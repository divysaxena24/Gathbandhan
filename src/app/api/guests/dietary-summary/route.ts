import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDietarySummaryForWedding } from "@/modules/guests/services/logistics-service";
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

    const bufferPercentage = searchParams.get("buffer")
      ? parseFloat(searchParams.get("buffer")!)
      : 5;

    const summary = await getDietarySummaryForWedding(weddingId, bufferPercentage);
    return successResponse(summary);
  } catch (error) {
    return errorResponse(error);
  }
}

