import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateGuest,
  deleteGuest,
} from "@/modules/guests/services/guest-service";
import { updateGuestSchema } from "@/modules/guests/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = updateGuestSchema.parse(body);

    const updated = await updateGuest(id, validated);
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

    await deleteGuest(id);
    return successResponse({ deleted: true, id });
  } catch (error) {
    return errorResponse(error);
  }
}
