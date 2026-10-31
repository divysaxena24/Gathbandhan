/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTasks, createTask } from "@/modules/planning/services/task-service";
import { createTaskSchema } from "@/modules/planning/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);

    const weddingId = searchParams.get("weddingId") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const status = searchParams.get("status") as any;
    const category = searchParams.get("category") || undefined;
    const priority = searchParams.get("priority") as any;
    const search = searchParams.get("search") || undefined;

    const taskList = await getTasks({
      weddingId,
      ownerId,
      status,
      category,
      priority,
      search,
    });

    return successResponse(taskList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can create tasks");
    }

    const body = await req.json();
    const validated = createTaskSchema.parse(body);

    const created = await createTask(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
