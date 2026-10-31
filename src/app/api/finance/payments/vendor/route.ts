/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getVendorPaymentsForWedding,
  recordVendorPayment,
} from "@/modules/finance/services/vendor-settlement-service";
import { recordVendorPaymentSchema } from "@/modules/finance/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const disbursements = await getVendorPaymentsForWedding(weddingId);
    return successResponse(disbursements);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = recordVendorPaymentSchema.parse(body);

    const receipt = await recordVendorPayment(validated as any, user.id);
    return successResponse(receipt);
  } catch (error) {
    return errorResponse(error);
  }
}
