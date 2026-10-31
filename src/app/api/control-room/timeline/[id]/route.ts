/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateTimelineItem,
  deleteTimelineItem,
} from "@/modules/control-room/services/timeline-service";
import { updateTimelineItemSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = updateTimelineItemSchema.parse(body);

    const updated = await updateTimelineItem(id, validated as any);
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
    await requireAuth();
    const { id } = await params;
    const deleted = await deleteTimelineItem(id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error);
  }
}
