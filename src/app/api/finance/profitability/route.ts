import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { calculateWeddingProfit } from "@/modules/finance/services/profitability-service";
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

    const profitability = await calculateWeddingProfit(weddingId);
    return successResponse(profitability);
  } catch (error) {
    return errorResponse(error);
  }
}
