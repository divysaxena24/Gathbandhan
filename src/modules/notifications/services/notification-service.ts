import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { CreateNotificationInput, NotificationRecord } from "../types";

/**
 * Dispatches a notification idempotently using dedupeKey.
 * In simulator/mock mode, records delivery reference without claiming false carrier dispatch.
 */
export async function dispatchNotification(
  input: CreateNotificationInput
): Promise<NotificationRecord> {
  // Deduplication check: if dedupeKey exists, prevent duplicate notification
  if (input.dedupeKey) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.dedupeKey, input.dedupeKey))
      .limit(1);

    if (existing) {
      return existing as NotificationRecord;
    }
  }

  const channel = input.channel || "IN_APP";
  const isSimulator = true; // In-app & simulator mode per PRD 09
  const providerRef = `mock-${channel.toLowerCase()}-${Date.now().toString(36)}`;

  const [created] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      weddingId: input.weddingId || null,
      channel,
      template: input.template,
      title: input.title,
      body: input.body,
      payload: input.payload || null,
      dedupeKey: input.dedupeKey || null,
      status: "SENT",
      providerReference: providerRef,
      isSimulator,
      sentAt: new Date(),
    })
    .returning();

  return created as NotificationRecord;
}

export async function getUserNotifications(
  userId: string,
  unreadOnly = false
): Promise<NotificationRecord[]> {
  const query = db
    .select()
    .from(notifications)
    .where(
      unreadOnly
        ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
        : eq(notifications.userId, userId)
    )
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const rows = await query;
  return rows as NotificationRecord[];
}

export async function markNotificationAsRead(
  id: string
): Promise<NotificationRecord | null> {
  const [updated] = await db
    .update(notifications)
    .set({
      readAt: new Date(),
      status: "READ",
      updatedAt: new Date(),
    })
    .where(eq(notifications.id, id))
    .returning();

  return (updated as NotificationRecord) || null;
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  const result = await db
    .update(notifications)
    .set({
      readAt: new Date(),
      status: "READ",
      updatedAt: new Date(),
    })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    )
    .returning({ id: notifications.id });

  return result.length;
}
