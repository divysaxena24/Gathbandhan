/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getMilestonesForWedding,
  createClientMilestone,
} from "@/modules/finance/services/client-milestone-service";
import { createMilestoneSchema } from "@/modules/finance/validation";
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

    const milestones = await getMilestonesForWedding(weddingId);
    return successResponse(milestones);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createMilestoneSchema.parse(body);

    const created = await createClientMilestone(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
