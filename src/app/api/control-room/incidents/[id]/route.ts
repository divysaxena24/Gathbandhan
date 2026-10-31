/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateIncident,
  resolveIncident,
} from "@/modules/control-room/services/incident-service";
import { resolveIncidentSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    if (body.action === "resolve") {
      const validated = resolveIncidentSchema.parse(body);
      const resolved = await resolveIncident(
        id,
        validated.resolutionNotes,
        validated.costImpactPaise,
        user.id
      );
      return successResponse(resolved);
    }

    const updated = await updateIncident(id, body as any, user.id);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
