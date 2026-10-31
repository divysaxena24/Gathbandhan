import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateCheckInStatus } from "@/modules/control-room/services/check-in-service";
import { updateCheckInStatusSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = updateCheckInStatusSchema.parse(body);

    await updateCheckInStatus(
      id,
      validated.status,
      validated.source || "COORDINATOR_MANUAL",
      validated.notes,
      validated.checkedInBy
    );

    return successResponse({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
