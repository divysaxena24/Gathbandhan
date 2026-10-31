import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  incidents,
  users,
  vendors,
  weddingEvents,
  controlRoomAlerts,
  auditLogs,
} from "@/lib/db/schema";
import { IncidentRecord, IncidentSeverity, IncidentStatus } from "../types";
import { NotFoundError } from "@/lib/errors";

export async function getIncidentsForWedding(
  weddingId: string,
  statusFilter?: string
): Promise<IncidentRecord[]> {
  const query = db
    .select({
      id: incidents.id,
      weddingId: incidents.weddingId,
      eventId: incidents.eventId,
      eventName: weddingEvents.name,
      title: incidents.title,
      description: incidents.description,
      severity: incidents.severity,
      status: incidents.status,
      ownerId: incidents.ownerId,
      ownerName: users.name,
      vendorId: incidents.vendorId,
      vendorName: vendors.name,
      reportedBy: incidents.reportedBy,
      reportedAt: incidents.reportedAt,
      resolvedAt: incidents.resolvedAt,
      resolutionNotes: incidents.resolutionNotes,
      costImpactPaise: incidents.costImpactPaise,
    })
    .from(incidents)
    .leftJoin(weddingEvents, eq(incidents.eventId, weddingEvents.id))
    .leftJoin(users, eq(incidents.ownerId, users.id))
    .leftJoin(vendors, eq(incidents.vendorId, vendors.id));

  const rows = statusFilter
    ? await query.where(
        and(eq(incidents.weddingId, weddingId), eq(incidents.status, statusFilter))
      )
    : await query.where(eq(incidents.weddingId, weddingId));

  return rows.map((r) => ({
    ...r,
    severity: r.severity as IncidentSeverity,
    status: r.status as IncidentStatus,
  }));
}

export async function createIncident(
  data: {
    weddingId: string;
    eventId?: string | null;
    title: string;
    description: string;
    severity?: IncidentSeverity;
    ownerId?: string | null;
    vendorId?: string | null;
    reportedBy: string;
    costImpactPaise?: bigint;
  },
  actorId?: string
) {
  const [incident] = await db
    .insert(incidents)
    .values({
      weddingId: data.weddingId,
      eventId: data.eventId,
      title: data.title,
      description: data.description,
      severity: data.severity || "MEDIUM",
      status: "OPEN",
      ownerId: data.ownerId,
      vendorId: data.vendorId,
      reportedBy: data.reportedBy,
      costImpactPaise: data.costImpactPaise || 0n,
    })
    .returning();

  // If severity is CRITICAL, generate an immediate control room alert
  if (data.severity === "CRITICAL") {
    await db.insert(controlRoomAlerts).values({
      weddingId: data.weddingId,
      alertType: "INCIDENT_CRITICAL",
      severity: "CRITICAL",
      title: `CRITICAL INCIDENT: ${data.title}`,
      message: `${data.description} (Reported by: ${data.reportedBy})`,
      relatedEntityType: "incidents",
      relatedEntityId: incident.id,
    });
  }

  // Audit log
  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "incidents",
      entityId: incident.id,
      action: "INCIDENT_CREATED",
      newValue: {
        title: data.title,
        severity: data.severity || "MEDIUM",
        reportedBy: data.reportedBy,
      },
      occurredAt: new Date(),
    });
  }

  return incident;
}

export async function updateIncident(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    ownerId: string | null;
    vendorId: string | null;
    resolutionNotes: string | null;
    costImpactPaise: bigint;
  }>,
  actorId?: string
) {
  const [existing] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Incident ${id} not found`);
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.severity !== undefined) updateData.severity = data.severity;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
  if (data.resolutionNotes !== undefined)
    updateData.resolutionNotes = data.resolutionNotes;
  if (data.costImpactPaise !== undefined)
    updateData.costImpactPaise = data.costImpactPaise;

  const [updated] = await db
    .update(incidents)
    .set(updateData)
    .where(eq(incidents.id, id))
    .returning();

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "incidents",
      entityId: id,
      action: "INCIDENT_UPDATED",
      oldValue: { status: existing.status, severity: existing.severity },
      newValue: updateData,
      occurredAt: new Date(),
    });
  }

  return updated;
}

export async function resolveIncident(
  id: string,
  resolutionNotes: string,
  costImpactPaise: bigint = 0n,
  actorId?: string
) {
  const [existing] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Incident ${id} not found`);
  }

  const now = new Date();
  const [resolved] = await db
    .update(incidents)
    .set({
      status: "RESOLVED",
      resolvedAt: now,
      resolutionNotes,
      costImpactPaise,
      updatedAt: now,
    })
    .where(eq(incidents.id, id))
    .returning();

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "incidents",
      entityId: id,
      action: "INCIDENT_RESOLVED",
      oldValue: { status: existing.status },
      newValue: {
        status: "RESOLVED",
        resolutionNotes,
        costImpactPaise: costImpactPaise.toString(),
      },
      occurredAt: now,
    });
  }

  return resolved;
}
