import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getTransportAssignments,
  createTransportAssignment,
} from "@/modules/guests/services/logistics-service";
import { createTransportSchema } from "@/modules/guests/validation";
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

    const assignments = await getTransportAssignments(weddingId);
    return successResponse(assignments);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createTransportSchema.parse(body);

    const created = await createTransportAssignment(validated);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
