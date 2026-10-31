/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getIncidentsForWedding,
  createIncident,
} from "@/modules/control-room/services/incident-service";
import { createIncidentSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");
    const status = searchParams.get("status") || undefined;

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const incidentList = await getIncidentsForWedding(weddingId, status);
    return successResponse(incidentList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createIncidentSchema.parse(body);

    const incident = await createIncident(validated as any, user.id);
    return successResponse(incident);
  } catch (error) {
    return errorResponse(error);
  }
}
