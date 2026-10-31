/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "@/modules/planning/services/task-service";
import { updateTaskSchema } from "@/modules/planning/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const task = await getTaskById(id);
    return successResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can update tasks");
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateTaskSchema.parse(body);

    const updated = await updateTask(id, validated as any);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can delete tasks");
    }

    const { id } = await params;
    const deleted = await deleteTask(id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error);
  }
}
