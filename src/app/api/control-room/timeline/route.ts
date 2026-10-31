/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getTimelineForEvent,
  createTimelineItem,
} from "@/modules/control-room/services/timeline-service";
import { createTimelineItemSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");
    const eventId = searchParams.get("eventId");

    if (!weddingId || !eventId) {
      throw new ValidationError("weddingId and eventId query parameters are required");
    }

    const items = await getTimelineForEvent(weddingId, eventId);
    return successResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createTimelineItemSchema.parse(body);

    const created = await createTimelineItem(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
