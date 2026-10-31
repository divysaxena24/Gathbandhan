import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateTasksForWedding } from "@/modules/planning/services/task-service";
import { generatePlanSchema } from "@/modules/planning/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can generate wedding plans");
    }

    const body = await req.json();
    const validated = generatePlanSchema.parse(body);

    const tasks = await generateTasksForWedding(
      validated.weddingId,
      validated.packageType,
      validated.assignedPlannerId || user.id
    );

    return successResponse(tasks);
  } catch (error) {
    return errorResponse(error);
  }
}
