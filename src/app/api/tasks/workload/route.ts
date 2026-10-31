import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTeamWorkload } from "@/modules/planning/services/task-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();
    const workload = await getTeamWorkload();
    return successResponse(workload);
  } catch (error) {
    return errorResponse(error);
  }
}
