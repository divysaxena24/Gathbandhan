import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  addTimelineDependency,
  removeTimelineDependency,
} from "@/modules/control-room/services/timeline-service";
import { addTimelineDependencySchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const validated = addTimelineDependencySchema.parse({
      ...body,
      timelineItemId: id,
    });

    const dependency = await addTimelineDependency(
      validated.timelineItemId,
      validated.dependsOnItemId,
      validated.bufferMinutes
    );

    return successResponse(dependency);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dependsOnItemId = searchParams.get("dependsOnItemId");

    if (!dependsOnItemId) {
      throw new ValidationError("dependsOnItemId is required");
    }

    await removeTimelineDependency(id, dependsOnItemId);
    return successResponse({ removed: true });
  } catch (error) {
    return errorResponse(error);
  }
}
