import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getCheckInsForWedding,
  generateCheckInTokensForWedding,
} from "@/modules/control-room/services/check-in-service";
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

    const checkIns = await getCheckInsForWedding(weddingId);
    return successResponse(checkIns);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { weddingId } = body;

    if (!weddingId) {
      throw new ValidationError("weddingId is required");
    }

    const checkIns = await generateCheckInTokensForWedding(weddingId);
    return successResponse(checkIns);
  } catch (error) {
    return errorResponse(error);
  }
}
