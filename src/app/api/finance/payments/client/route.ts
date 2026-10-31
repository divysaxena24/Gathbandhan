/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getClientTransactionsForWedding,
  recordClientPayment,
} from "@/modules/finance/services/client-milestone-service";
import { recordClientPaymentSchema } from "@/modules/finance/validation";
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

    const transactions = await getClientTransactionsForWedding(weddingId);
    return successResponse(transactions);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = recordClientPaymentSchema.parse(body);

    const receipt = await recordClientPayment(validated as any, user.id);
    return successResponse(receipt);
  } catch (error) {
    return errorResponse(error);
  }
}
