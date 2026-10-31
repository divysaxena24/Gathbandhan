import { NextRequest } from "next/server";
import {
  createVirtualPaymentSession,
  getVirtualPaymentSession,
} from "@/modules/finance/services/virtual-upi-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.billId) {
      throw new ValidationError("billId is required");
    }
    if (!body.paymentType) {
      throw new ValidationError("paymentType is required (INSTALLMENT or FULL_BALANCE)");
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const appBaseUrl = `${proto}://${host}`;

    const session = await createVirtualPaymentSession({
      billId: body.billId,
      paymentType: body.paymentType,
      installmentId: body.installmentId,
      appBaseUrl,
    });

    return successResponse(serializeBigInt(session));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new ValidationError("token query parameter is required");
    }

    const session = await getVirtualPaymentSession(token);
    return successResponse(serializeBigInt(session));
  } catch (error) {
    return errorResponse(error);
  }
}
