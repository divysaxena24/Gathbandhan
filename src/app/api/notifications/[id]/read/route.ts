import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markNotificationAsRead } from "@/modules/notifications/services/notification-service";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { NotFoundError } from "@/lib/errors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const updated = await markNotificationAsRead(id);

    if (!updated) {
      throw new NotFoundError("Notification not found");
    }

    return mutationResponse(updated, "Notification marked as read");
  } catch (error) {
    return errorResponse(error);
  }
}
