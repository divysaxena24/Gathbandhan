import { db } from "@/lib/db";
import { leads, users, leadActivities, auditLogs } from "@/lib/db/schema";
import {
  eq,
  and,
  isNull,
  ilike,
  or,
  desc,
  sql,
  count,
} from "drizzle-orm";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import {
  type CreateLeadInput,
  type UpdateLeadInput,
  type ChangeStageInput,
  type AssignPlannerInput,
  type ScheduleFollowUpInput,
  type AddNoteInput,
} from "../validation";
import {
  type Lead,
  type LeadFilters,
  type CRMStats,
  type PipelineStage,
} from "../types";

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List leads with filtering, search, pagination, and assigned planner join.
 */
export async function getLeads(
  filters: LeadFilters = {},
  pagination: PaginationInput = {}
): Promise<PaginatedResult<Lead & { assignedPlannerName: string | null }>> {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(leads.deletedAt)];

  if (filters.status) {
    conditions.push(eq(leads.status, filters.status));
  }

  if (filters.assignedPlannerId) {
    conditions.push(eq(leads.assignedPlannerId, filters.assignedPlannerId));
  }

  if (filters.qualificationStatus) {
    conditions.push(eq(leads.qualificationStatus, filters.qualificationStatus));
  }

  if (filters.city) {
    conditions.push(ilike(leads.city, `%${filters.city}%`));
  }

  if (filters.source) {
    conditions.push(ilike(leads.source, `%${filters.source}%`));
  }

  if (filters.search && filters.search.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(leads.coupleName, searchPattern),
        ilike(leads.partnerOneName, searchPattern),
        ilike(leads.partnerOneEmail, searchPattern),
        ilike(leads.partnerOnePhone, searchPattern),
        ilike(leads.partnerTwoName, searchPattern)
      )!
    );
  }

  const whereClause = and(...conditions);

  // Total count
  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(leads)
    .where(whereClause);

  // Rows with planner name join
  const rows = await db
    .select({
      id: leads.id,
      coupleName: leads.coupleName,
      partnerOneName: leads.partnerOneName,
      partnerOneEmail: leads.partnerOneEmail,
      partnerOnePhone: leads.partnerOnePhone,
      partnerTwoName: leads.partnerTwoName,
      partnerTwoPhone: leads.partnerTwoPhone,
      partnerTwoEmail: leads.partnerTwoEmail,
      source: leads.source,
      eventDate: leads.eventDate,
      dateFlexibility: leads.dateFlexibility,
      estimatedGuestCount: leads.estimatedGuestCount,
      estimatedBudgetPaise: leads.estimatedBudgetPaise,
      city: leads.city,
      venue: leads.venue,
      themeNotes: leads.themeNotes,
      packageType: leads.packageType,
      status: leads.status,
      qualificationStatus: leads.qualificationStatus,
      assignedPlannerId: leads.assignedPlannerId,
      notes: leads.notes,
      nextFollowUpAt: leads.nextFollowUpAt,
      lostReason: leads.lostReason,
      convertedToClientId: leads.convertedToClientId,
      convertedToWeddingId: leads.convertedToWeddingId,
      convertedAt: leads.convertedAt,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
      assignedPlannerName: users.name,
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedPlannerId, users.id))
    .where(whereClause)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: rows as (Lead & { assignedPlannerName: string | null })[],
    meta: {
      page,
      pageSize,
      total: Number(totalCount),
      totalPages: Math.ceil(Number(totalCount) / pageSize) || 1,
    },
  };
}

/**
 * Get lead details by ID with activities and planner info.
 */
export async function getLeadById(id: string) {
  const [lead] = await db
    .select({
      id: leads.id,
      coupleName: leads.coupleName,
      partnerOneName: leads.partnerOneName,
      partnerOneEmail: leads.partnerOneEmail,
      partnerOnePhone: leads.partnerOnePhone,
      partnerTwoName: leads.partnerTwoName,
      partnerTwoPhone: leads.partnerTwoPhone,
      partnerTwoEmail: leads.partnerTwoEmail,
      source: leads.source,
      eventDate: leads.eventDate,
      dateFlexibility: leads.dateFlexibility,
      estimatedGuestCount: leads.estimatedGuestCount,
      estimatedBudgetPaise: leads.estimatedBudgetPaise,
      city: leads.city,
      venue: leads.venue,
      themeNotes: leads.themeNotes,
      packageType: leads.packageType,
      status: leads.status,
      qualificationStatus: leads.qualificationStatus,
      assignedPlannerId: leads.assignedPlannerId,
      notes: leads.notes,
      nextFollowUpAt: leads.nextFollowUpAt,
      lostReason: leads.lostReason,
      convertedToClientId: leads.convertedToClientId,
      convertedToWeddingId: leads.convertedToWeddingId,
      convertedAt: leads.convertedAt,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
      assignedPlannerName: users.name,
      assignedPlannerEmail: users.email,
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedPlannerId, users.id))
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .limit(1);

  if (!lead) {
    throw new NotFoundError("Lead", id);
  }

  // Load activities
  const activities = await db
    .select({
      id: leadActivities.id,
      leadId: leadActivities.leadId,
      actorId: leadActivities.actorId,
      activityType: leadActivities.activityType,
      title: leadActivities.title,
      description: leadActivities.description,
      metadata: leadActivities.metadata,
      createdAt: leadActivities.createdAt,
      actorName: users.name,
    })
    .from(leadActivities)
    .leftJoin(users, eq(leadActivities.actorId, users.id))
    .where(eq(leadActivities.leadId, id))
    .orderBy(desc(leadActivities.createdAt));

  return {
    ...lead,
    activities,
  };
}

/**
 * Check for duplicate leads with similar contact details and date.
 */
export async function checkDuplicateLead(
  email?: string | null,
  phone?: string | null,
  eventDate?: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; matchedLeadId?: string; reason?: string }> {
  if (!email && !phone) return { isDuplicate: false };

  const conditions = [isNull(leads.deletedAt)];
  if (excludeId) {
    conditions.push(sql`${leads.id} != ${excludeId}`);
  }

  const matchClauses = [];
  if (email && email.trim()) {
    matchClauses.push(
      or(
        eq(leads.partnerOneEmail, email.trim()),
        eq(leads.partnerTwoEmail, email.trim())
      )!
    );
  }
  if (phone && phone.trim()) {
    matchClauses.push(
      or(
        eq(leads.partnerOnePhone, phone.trim()),
        eq(leads.partnerTwoPhone, phone.trim())
      )!
    );
  }

  if (matchClauses.length === 0) return { isDuplicate: false };

  conditions.push(or(...matchClauses)!);

  const [matched] = await db
    .select({
      id: leads.id,
      coupleName: leads.coupleName,
      eventDate: leads.eventDate,
      partnerOneEmail: leads.partnerOneEmail,
      partnerOnePhone: leads.partnerOnePhone,
    })
    .from(leads)
    .where(and(...conditions))
    .limit(1);

  if (matched) {
    const isSameDate = eventDate && matched.eventDate === eventDate;
    const reason = isSameDate
      ? `Existing lead for '${matched.coupleName}' matches contact details and estimated wedding date (${eventDate}).`
      : `Existing lead for '${matched.coupleName}' matches contact details.`;
    return { isDuplicate: true, matchedLeadId: matched.id, reason };
  }

  return { isDuplicate: false };
}

/**
 * Create a new lead, checking for potential duplicates and logging the activity.
 */
export async function createLead(input: CreateLeadInput, actorId?: string): Promise<Lead> {
  const followUpDate = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
  const budgetPaise = input.estimatedBudgetPaise ?? (input.estimatedBudgetInrString ?? null);

  const [lead] = await db
    .insert(leads)
    .values({
      coupleName: input.coupleName.trim(),
      partnerOneName: input.partnerOneName.trim(),
      partnerOneEmail: input.partnerOneEmail ? input.partnerOneEmail.trim() : null,
      partnerOnePhone: input.partnerOnePhone ? input.partnerOnePhone.trim() : null,
      partnerTwoName: input.partnerTwoName ? input.partnerTwoName.trim() : null,
      partnerTwoPhone: input.partnerTwoPhone ? input.partnerTwoPhone.trim() : null,
      partnerTwoEmail: input.partnerTwoEmail ? input.partnerTwoEmail.trim() : null,
      source: input.source ? input.source.trim() : null,
      eventDate: input.eventDate || null,
      dateFlexibility: input.dateFlexibility || "EXACT",
      estimatedGuestCount: input.estimatedGuestCount || null,
      estimatedBudgetPaise: budgetPaise,
      city: input.city ? input.city.trim() : null,
      venue: input.venue ? input.venue.trim() : null,
      themeNotes: input.themeNotes ? input.themeNotes.trim() : null,
      packageType: input.packageType || "FULL_SERVICE",
      status: "NEW",
      qualificationStatus: input.qualificationStatus || "PENDING",
      assignedPlannerId: input.assignedPlannerId || null,
      notes: input.notes ? input.notes.trim() : null,
      nextFollowUpAt: followUpDate,
    })
    .returning();

  // Record creation activity
  await db.insert(leadActivities).values({
    leadId: lead.id,
    actorId: actorId || null,
    activityType: "CREATED",
    title: "Lead Created",
    description: `New enquiry captured for ${lead.coupleName} (Source: ${lead.source || "Direct"}).`,
    metadata: {
      packageType: lead.packageType,
      city: lead.city,
      eventDate: lead.eventDate,
    },
  });

  // Record audit log
  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "lead",
      entityId: lead.id,
      action: "lead.created",
      newValue: {
        coupleName: lead.coupleName,
        status: lead.status,
        packageType: lead.packageType,
      },
      reason: "Initial lead creation",
    });
  }

  return lead;
}

/**
 * Update lead information.
 */
export async function updateLead(
  id: string,
  input: UpdateLeadInput,
  actorId?: string
): Promise<Lead> {
  await getLeadById(id);

  const updateData: Partial<typeof leads.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.coupleName !== undefined) updateData.coupleName = input.coupleName.trim();
  if (input.partnerOneName !== undefined) updateData.partnerOneName = input.partnerOneName.trim();
  if (input.partnerOneEmail !== undefined) updateData.partnerOneEmail = input.partnerOneEmail ? input.partnerOneEmail.trim() : null;
  if (input.partnerOnePhone !== undefined) updateData.partnerOnePhone = input.partnerOnePhone ? input.partnerOnePhone.trim() : null;
  if (input.partnerTwoName !== undefined) updateData.partnerTwoName = input.partnerTwoName ? input.partnerTwoName.trim() : null;
  if (input.partnerTwoPhone !== undefined) updateData.partnerTwoPhone = input.partnerTwoPhone ? input.partnerTwoPhone.trim() : null;
  if (input.partnerTwoEmail !== undefined) updateData.partnerTwoEmail = input.partnerTwoEmail ? input.partnerTwoEmail.trim() : null;
  if (input.source !== undefined) updateData.source = input.source ? input.source.trim() : null;
  if (input.eventDate !== undefined) updateData.eventDate = input.eventDate || null;
  if (input.dateFlexibility !== undefined) updateData.dateFlexibility = input.dateFlexibility;
  if (input.estimatedGuestCount !== undefined) updateData.estimatedGuestCount = input.estimatedGuestCount;
  if (input.estimatedBudgetPaise !== undefined) updateData.estimatedBudgetPaise = input.estimatedBudgetPaise;
  if (input.city !== undefined) updateData.city = input.city ? input.city.trim() : null;
  if (input.venue !== undefined) updateData.venue = input.venue ? input.venue.trim() : null;
  if (input.themeNotes !== undefined) updateData.themeNotes = input.themeNotes ? input.themeNotes.trim() : null;
  if (input.packageType !== undefined) updateData.packageType = input.packageType;
  if (input.qualificationStatus !== undefined) updateData.qualificationStatus = input.qualificationStatus;
  if (input.assignedPlannerId !== undefined) updateData.assignedPlannerId = input.assignedPlannerId;
  if (input.notes !== undefined) updateData.notes = input.notes ? input.notes.trim() : null;
  if (input.nextFollowUpAt !== undefined) {
    updateData.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
  }
  if (input.status !== undefined) updateData.status = input.status;
  if (input.lostReason !== undefined) updateData.lostReason = input.lostReason;

  const [updated] = await db
    .update(leads)
    .set(updateData)
    .where(eq(leads.id, id))
    .returning();

  // Log activity
  await db.insert(leadActivities).values({
    leadId: id,
    actorId: actorId || null,
    activityType: "UPDATED",
    title: "Lead Details Updated",
    description: "Lead contact and wedding preferences updated.",
  });

  return updated;
}

/**
 * Change lead pipeline stage, enforcing validation for lost reasons.
 */
export async function changeLeadStage(
  id: string,
  input: ChangeStageInput,
  actorId?: string
): Promise<Lead> {
  const existing = await getLeadById(id);

  if (existing.status === input.status) {
    return existing;
  }

  // If transitioning to LOST, validate reason
  if (input.status === "LOST" && (!input.lostReason || !input.lostReason.trim())) {
    throw new ValidationError("A lost reason is required when marking a lead as Lost", {
      lostReason: ["Please provide a reason for losing this lead"],
    });
  }

  const [updated] = await db
    .update(leads)
    .set({
      status: input.status,
      lostReason: input.status === "LOST" ? input.lostReason?.trim() : null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  // Activity log
  const stageTitle = input.status === "LOST" ? "Lead Marked Lost" : "Pipeline Stage Changed";
  const stageDescription =
    input.status === "LOST"
      ? `Lead marked as Lost. Reason: ${input.lostReason || "Not specified"}`
      : `Moved from ${existing.status} to ${input.status}.`;

  await db.insert(leadActivities).values({
    leadId: id,
    actorId: actorId || null,
    activityType: input.status === "LOST" ? "MARKED_LOST" : "STAGE_CHANGED",
    title: stageTitle,
    description: stageDescription,
    metadata: {
      fromStatus: existing.status,
      toStatus: input.status,
      lostReason: input.lostReason || null,
    },
  });

  // Audit log
  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "lead",
      entityId: id,
      action: "lead.stage_changed",
      oldValue: { status: existing.status },
      newValue: { status: input.status, lostReason: input.lostReason },
      reason: input.status === "LOST" ? `Marked Lost: ${input.lostReason}` : "Pipeline advance",
    });
  }

  return updated;
}

/**
 * Assign a planner to a lead.
 */
export async function assignPlanner(
  id: string,
  input: AssignPlannerInput,
  actorId?: string
): Promise<Lead> {
  const existing = await getLeadById(id);

  let plannerName = "Unassigned";
  if (input.assignedPlannerId) {
    const [planner] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, input.assignedPlannerId))
      .limit(1);

    if (!planner) {
      throw new NotFoundError("Planner", input.assignedPlannerId);
    }
    plannerName = planner.name;
  }

  const [updated] = await db
    .update(leads)
    .set({
      assignedPlannerId: input.assignedPlannerId,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  // Activity log
  await db.insert(leadActivities).values({
    leadId: id,
    actorId: actorId || null,
    activityType: "PLANNER_ASSIGNED",
    title: "Planner Assigned",
    description: `Assigned to ${plannerName}.`,
    metadata: {
      previousPlannerId: existing.assignedPlannerId,
      newPlannerId: input.assignedPlannerId,
    },
  });

  return updated;
}

/**
 * Schedule or update a follow-up date for a lead.
 */
export async function scheduleFollowUp(
  id: string,
  input: ScheduleFollowUpInput,
  actorId?: string
): Promise<Lead> {
  await getLeadById(id);

  const followUpDate = new Date(input.nextFollowUpAt);

  const [updated] = await db
    .update(leads)
    .set({
      nextFollowUpAt: followUpDate,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  await db.insert(leadActivities).values({
    leadId: id,
    actorId: actorId || null,
    activityType: "FOLLOW_UP_SCHEDULED",
    title: "Follow-up Scheduled",
    description: `Scheduled for ${followUpDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.${input.notes ? ` Notes: ${input.notes}` : ""}`,
    metadata: {
      scheduledFor: followUpDate.toISOString(),
      notes: input.notes,
    },
  });

  return updated;
}

/**
 * Add a manual activity note to a lead.
 */
export async function addNote(
  leadId: string,
  input: AddNoteInput,
  actorId?: string
) {
  await getLeadById(leadId);

  const [activity] = await db
    .insert(leadActivities)
    .values({
      leadId,
      actorId: actorId || null,
      activityType: "NOTE_ADDED",
      title: input.title.trim(),
      description: input.description.trim(),
    })
    .returning();

  return activity;
}

/**
 * Soft delete a lead.
 */
export async function deleteLead(id: string, actorId?: string): Promise<void> {
  const existing = await getLeadById(id);

  if (existing.status === "CONVERTED" || existing.convertedToClientId) {
    throw new ConflictError("Cannot delete a converted lead. The lead is linked to an active client and wedding.");
  }

  await db
    .update(leads)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "lead",
      entityId: id,
      action: "lead.deleted",
      oldValue: { coupleName: existing.coupleName, status: existing.status },
      reason: "Lead soft deleted",
    });
  }
}

/**
 * Get aggregate CRM statistics for the dashboard.
 */
export async function getCRMStats(plannerId?: string): Promise<CRMStats> {
  const conditions = [isNull(leads.deletedAt)];
  if (plannerId) {
    conditions.push(eq(leads.assignedPlannerId, plannerId));
  }

  const allActiveLeads = await db
    .select({
      id: leads.id,
      status: leads.status,
      qualificationStatus: leads.qualificationStatus,
      estimatedBudgetPaise: leads.estimatedBudgetPaise,
      nextFollowUpAt: leads.nextFollowUpAt,
    })
    .from(leads)
    .where(and(...conditions));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let newEnquiries = 0;
  let qualifiedLeads = 0;
  let followUpsDueToday = 0;
  let followUpsOverdue = 0;
  let convertedCount = 0;
  let pipelineBudgetPaise = 0n;

  const stageCounts: Record<PipelineStage, number> = {
    NEW: 0,
    CONTACTED: 0,
    CONSULTATION_SCHEDULED: 0,
    PROPOSAL_SENT: 0,
    NEGOTIATION: 0,
    CONVERTED: 0,
    LOST: 0,
    ARCHIVED: 0,
  };

  for (const l of allActiveLeads) {
    if (l.status in stageCounts) {
      stageCounts[l.status as PipelineStage]++;
    }

    if (l.status === "NEW") newEnquiries++;
    if (l.status === "CONVERTED") convertedCount++;
    if (l.qualificationStatus === "QUALIFIED") qualifiedLeads++;

    if (l.estimatedBudgetPaise && l.status !== "LOST" && l.status !== "ARCHIVED") {
      pipelineBudgetPaise += BigInt(l.estimatedBudgetPaise);
    }

    if (l.nextFollowUpAt) {
      const followUp = new Date(l.nextFollowUpAt);
      if (followUp >= startOfToday && followUp <= endOfToday) {
        followUpsDueToday++;
      } else if (followUp < startOfToday && l.status !== "CONVERTED" && l.status !== "LOST") {
        followUpsOverdue++;
      }
    }
  }

  return {
    totalLeads: allActiveLeads.length,
    newEnquiries,
    qualifiedLeads,
    followUpsDueToday,
    followUpsOverdue,
    convertedCount,
    pipelineBudgetPaise,
    stageCounts,
  };
}
