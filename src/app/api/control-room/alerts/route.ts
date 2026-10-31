import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getActiveAlerts,
  dismissAlert,
} from "@/modules/control-room/services/alert-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const alerts = await getActiveAlerts(weddingId);
    return successResponse(alerts);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { alertId } = body;

    if (!alertId) {
      throw new ValidationError("alertId is required");
    }

    await dismissAlert(alertId);
    return successResponse({ dismissed: true });
  } catch (error) {
    return errorResponse(error);
  }
}
