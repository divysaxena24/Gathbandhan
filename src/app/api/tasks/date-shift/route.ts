import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleDateShift } from "@/modules/planning/services/task-service";
import { previewDateShiftSchema } from "@/modules/planning/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can modify wedding dates");
    }

    const body = await req.json();
    const weddingId = body.weddingId;
    if (!weddingId) {
      throw new Error("weddingId is required");
    }

    const validated = previewDateShiftSchema.parse(body);
    const apply = body.apply === true;

    const result = await handleDateShift(
      weddingId,
      validated.newStartDate,
      apply,
      user.id
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
