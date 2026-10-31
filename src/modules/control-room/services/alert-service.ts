import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { controlRoomAlerts } from "@/lib/db/schema";
import { ControlRoomAlertRecord } from "../types";

export async function getActiveAlerts(
  weddingId: string
): Promise<ControlRoomAlertRecord[]> {
  const alerts = await db
    .select({
      id: controlRoomAlerts.id,
      weddingId: controlRoomAlerts.weddingId,
      alertType: controlRoomAlerts.alertType,
      severity: controlRoomAlerts.severity,
      title: controlRoomAlerts.title,
      message: controlRoomAlerts.message,
      relatedEntityType: controlRoomAlerts.relatedEntityType,
      relatedEntityId: controlRoomAlerts.relatedEntityId,
      isDismissed: controlRoomAlerts.isDismissed,
      dismissedAt: controlRoomAlerts.dismissedAt,
      createdAt: controlRoomAlerts.createdAt,
    })
    .from(controlRoomAlerts)
    .where(
      and(
        eq(controlRoomAlerts.weddingId, weddingId),
        eq(controlRoomAlerts.isDismissed, false)
      )
    )
    .orderBy(desc(controlRoomAlerts.createdAt));

  return alerts;
}

export async function dismissAlert(alertId: string): Promise<void> {
  await db
    .update(controlRoomAlerts)
    .set({
      isDismissed: true,
      dismissedAt: new Date(),
    })
    .where(eq(controlRoomAlerts.id, alertId));
}
