/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getApprovedExtrasForWedding,
  createApprovedExtra,
} from "@/modules/finance/services/expense-extras-service";
import { createApprovedExtraSchema } from "@/modules/finance/validation";
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

    const extras = await getApprovedExtrasForWedding(weddingId);
    return successResponse(extras);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createApprovedExtraSchema.parse(body);

    const created = await createApprovedExtra(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
