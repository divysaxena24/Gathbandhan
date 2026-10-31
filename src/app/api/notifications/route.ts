import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getUserNotifications,
  dispatchNotification,
} from "@/modules/notifications/services/notification-service";
import { successResponse, mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { z } from "zod";

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  weddingId: z.string().uuid().optional().nullable(),
  channel: z.enum(["IN_APP", "EMAIL", "WHATSAPP", "SMS"]).optional(),
  template: z.enum([
    "LEAD_FOLLOW_UP",
    "TASK_DEADLINE",
    "CLIENT_PAYMENT_DUE",
    "VENDOR_PAYMENT_DUE",
    "VENDOR_LATE",
    "INCIDENT_ALERT",
    "AGREEMENT_SIGNED",
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  dedupeKey: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    try {
      const notifications = await getUserNotifications(user.id, unreadOnly);
      return successResponse(notifications);
    } catch (dbErr: unknown) {
      console.warn("Could not load notifications from DB (database may be offline or starting):", dbErr);
      return successResponse([]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createNotificationSchema.parse(body);

    const notification = await dispatchNotification(validated);
    return mutationResponse(notification, "Notification queued successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
