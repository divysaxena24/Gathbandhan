import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/modules/notifications/services/notification-service";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const count = await markAllNotificationsAsRead(user.id);

    return mutationResponse({ count }, `${count} notifications marked as read`);
  } catch (error) {
    return errorResponse(error);
  }
}
