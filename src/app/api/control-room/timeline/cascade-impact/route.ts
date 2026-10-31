import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEventCascadeImpact } from "@/modules/control-room/services/timeline-service";
import { cascadeImpactSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = cascadeImpactSchema.parse(body);

    const impact = await getEventCascadeImpact(
      validated.weddingId,
      validated.eventId,
      validated.delayedItemId,
      validated.delayMinutes
    );

    return successResponse(impact);
  } catch (error) {
    return errorResponse(error);
  }
}
