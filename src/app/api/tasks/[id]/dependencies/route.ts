import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  addDependency,
  removeDependency,
} from "@/modules/planning/services/task-service";
import { addDependencySchema } from "@/modules/planning/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can modify task dependencies");
    }

    const { id: taskId } = await params;
    const body = await req.json();
    const validated = addDependencySchema.parse(body);

    const created = await addDependency(taskId, validated.dependsOnTaskId);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can modify task dependencies");
    }

    const { id: taskId } = await params;
    const { searchParams } = new URL(req.url);
    const dependsOnTaskId = searchParams.get("dependsOnTaskId");

    if (!dependsOnTaskId) {
      throw new Error("Missing dependsOnTaskId parameter");
    }

    await removeDependency(taskId, dependsOnTaskId);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
