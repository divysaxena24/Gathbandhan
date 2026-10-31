import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  timelineItems,
  timelineDependencies,
  vendors,
  users,
} from "@/lib/db/schema";
import {
  CascadeImpactAnalysis,
  TimelineItemStatus,
  TimelineItemWithDeps,
} from "../types";
import {
  calculateCascadeImpact,
  DependencyEdge,
  TimelineNode,
} from "./cascade-engine";
import { ConflictError, NotFoundError } from "@/lib/errors";

export async function getTimelineForEvent(
  weddingId: string,
  eventId: string
): Promise<TimelineItemWithDeps[]> {
  const items = await db
    .select({
      id: timelineItems.id,
      weddingId: timelineItems.weddingId,
      eventId: timelineItems.eventId,
      title: timelineItems.title,
      description: timelineItems.description,
      startsAt: timelineItems.startsAt,
      endsAt: timelineItems.endsAt,
      ownerId: timelineItems.ownerId,
      ownerName: users.name,
      vendorId: timelineItems.vendorId,
      vendorName: vendors.name,
      weddingVendorId: timelineItems.weddingVendorId,
      status: timelineItems.status,
      isKeyMoment: timelineItems.isKeyMoment,
      location: timelineItems.location,
      orderIndex: timelineItems.orderIndex,
      actualStartsAt: timelineItems.actualStartsAt,
      actualEndsAt: timelineItems.actualEndsAt,
      delayMinutes: timelineItems.delayMinutes,
      notes: timelineItems.notes,
    })
    .from(timelineItems)
    .leftJoin(users, eq(timelineItems.ownerId, users.id))
    .leftJoin(vendors, eq(timelineItems.vendorId, vendors.id))
    .where(
      and(
        eq(timelineItems.weddingId, weddingId),
        eq(timelineItems.eventId, eventId)
      )
    )
    .orderBy(timelineItems.orderIndex, timelineItems.startsAt);

  if (items.length === 0) {
    return [];
  }

  // Fetch all dependencies between these event items
  const allDeps = await db
    .select({
      id: timelineDependencies.id,
      timelineItemId: timelineDependencies.timelineItemId,
      dependsOnItemId: timelineDependencies.dependsOnItemId,
      bufferMinutes: timelineDependencies.bufferMinutes,
    })
    .from(timelineDependencies);

  const titleMap = new Map(items.map((i) => [i.id, i.title]));

  return items.map((item) => {
    const itemDeps = allDeps
      .filter((d) => d.timelineItemId === item.id)
      .map((d) => ({
        id: d.id,
        timelineItemId: d.timelineItemId,
        dependsOnItemId: d.dependsOnItemId,
        dependsOnTitle: titleMap.get(d.dependsOnItemId) || "Prerequisite",
        bufferMinutes: d.bufferMinutes,
      }));

    return {
      ...item,
      status: item.status as TimelineItemStatus,
      prerequisites: itemDeps,
    };
  });
}

export async function createTimelineItem(data: {
  weddingId: string;
  eventId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  ownerId?: string | null;
  vendorId?: string | null;
  weddingVendorId?: string | null;
  status?: TimelineItemStatus;
  isKeyMoment?: boolean;
  location?: string | null;
  orderIndex?: number;
  notes?: string | null;
}) {
  const [created] = await db
    .insert(timelineItems)
    .values({
      weddingId: data.weddingId,
      eventId: data.eventId,
      title: data.title,
      description: data.description,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      ownerId: data.ownerId,
      vendorId: data.vendorId,
      weddingVendorId: data.weddingVendorId,
      status: data.status || "PENDING",
      isKeyMoment: data.isKeyMoment ?? false,
      location: data.location,
      orderIndex: data.orderIndex ?? 0,
      notes: data.notes,
    })
    .returning();

  return created;
}

export async function updateTimelineItem(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    ownerId: string | null;
    vendorId: string | null;
    weddingVendorId: string | null;
    status: TimelineItemStatus;
    isKeyMoment: boolean;
    location: string | null;
    orderIndex: number;
    actualStartsAt: string | null;
    actualEndsAt: string | null;
    delayMinutes: number;
    notes: string | null;
  }>
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
  if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
  if (data.weddingVendorId !== undefined)
    updateData.weddingVendorId = data.weddingVendorId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isKeyMoment !== undefined) updateData.isKeyMoment = data.isKeyMoment;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
  if (data.actualStartsAt !== undefined)
    updateData.actualStartsAt = data.actualStartsAt
      ? new Date(data.actualStartsAt)
      : null;
  if (data.actualEndsAt !== undefined)
    updateData.actualEndsAt = data.actualEndsAt
      ? new Date(data.actualEndsAt)
      : null;
  if (data.delayMinutes !== undefined)
    updateData.delayMinutes = data.delayMinutes;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const [updated] = await db
    .update(timelineItems)
    .set(updateData)
    .where(eq(timelineItems.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError(`Timeline item ${id} not found`);
  }

  return updated;
}

export async function deleteTimelineItem(id: string) {
  const [deleted] = await db
    .delete(timelineItems)
    .where(eq(timelineItems.id, id))
    .returning();

  if (!deleted) {
    throw new NotFoundError(`Timeline item ${id} not found`);
  }

  return deleted;
}

export async function addTimelineDependency(
  timelineItemId: string,
  dependsOnItemId: string,
  bufferMinutes: number = 0
) {
  if (timelineItemId === dependsOnItemId) {
    throw new ConflictError("A timeline activity cannot depend on itself");
  }

  // Check for reciprocal/circular dependency
  const existingReverse = await db
    .select({ id: timelineDependencies.id })
    .from(timelineDependencies)
    .where(
      and(
        eq(timelineDependencies.timelineItemId, dependsOnItemId),
        eq(timelineDependencies.dependsOnItemId, timelineItemId)
      )
    )
    .limit(1);

  if (existingReverse.length > 0) {
    throw new ConflictError(
      "Circular dependency detected: The requested prerequisite already depends on this activity"
    );
  }

  const [dep] = await db
    .insert(timelineDependencies)
    .values({
      timelineItemId,
      dependsOnItemId,
      bufferMinutes,
    })
    .returning();

  return dep;
}

export async function removeTimelineDependency(
  timelineItemId: string,
  dependsOnItemId: string
) {
  await db
    .delete(timelineDependencies)
    .where(
      and(
        eq(timelineDependencies.timelineItemId, timelineItemId),
        eq(timelineDependencies.dependsOnItemId, dependsOnItemId)
      )
    );
}

export async function getEventCascadeImpact(
  weddingId: string,
  eventId: string,
  delayedItemId: string,
  delayMinutes: number
): Promise<CascadeImpactAnalysis> {
  const items = await db
    .select({
      id: timelineItems.id,
      title: timelineItems.title,
      startsAt: timelineItems.startsAt,
      endsAt: timelineItems.endsAt,
      isKeyMoment: timelineItems.isKeyMoment,
      vendorName: vendors.name,
    })
    .from(timelineItems)
    .leftJoin(vendors, eq(timelineItems.vendorId, vendors.id))
    .where(
      and(
        eq(timelineItems.weddingId, weddingId),
        eq(timelineItems.eventId, eventId)
      )
    );

  const deps = await db
    .select({
      timelineItemId: timelineDependencies.timelineItemId,
      dependsOnItemId: timelineDependencies.dependsOnItemId,
      bufferMinutes: timelineDependencies.bufferMinutes,
    })
    .from(timelineDependencies);

  const itemNodes: TimelineNode[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    startsAt: i.startsAt,
    endsAt: i.endsAt,
    isKeyMoment: i.isKeyMoment,
    vendorName: i.vendorName,
  }));

  const depEdges: DependencyEdge[] = deps.map((d) => ({
    timelineItemId: d.timelineItemId,
    dependsOnItemId: d.dependsOnItemId,
    bufferMinutes: d.bufferMinutes,
  }));

  return calculateCascadeImpact(
    itemNodes,
    depEdges,
    delayedItemId,
    delayMinutes
  );
}
