import { NextRequest } from "next/server";
import { processVirtualPayment } from "@/modules/finance/services/virtual-upi-service";
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

    if (!body.sessionToken) {
      throw new ValidationError("sessionToken is required");
    }
    if (!body.payerVpa) {
      throw new ValidationError("payerVpa (UPI ID) is required");
    }

    const tx = await processVirtualPayment({
      sessionToken: body.sessionToken,
      payerVpa: body.payerVpa,
      payerName: body.payerName,
      idempotencyKey: body.idempotencyKey,
      allowBusinessDuplicate: body.allowBusinessDuplicate,
    });

    return successResponse(serializeBigInt(tx));
  } catch (error) {
    return errorResponse(error);
  }
}
