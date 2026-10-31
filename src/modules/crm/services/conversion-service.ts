import { db } from "@/lib/db";
import {
  leads,
  clients,
  weddings,
  weddingEvents,
  leadActivities,
  auditLogs,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { type ConvertLeadInput } from "../validation";

export interface ConversionResult {
  client: typeof clients.$inferSelect;
  wedding: typeof weddings.$inferSelect;
  events: (typeof weddingEvents.$inferSelect)[];
}

/**
 * Transactional conversion of a qualified lead into a client, wedding project,
 * and initial multi-day event itinerary.
 *
 * Guarantees idempotency and duplicate prevention:
 * - Checks status and existing client link before transaction
 * - Uses unique database constraint on `clients.converted_from_lead_id`
 * - Runs all writes in a single atomic database transaction
 */
export async function convertLeadToWedding(
  leadId: string,
  input: ConvertLeadInput,
  actorId?: string
): Promise<ConversionResult> {
  // 1. Fetch lead
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
    .limit(1);

  if (!lead) {
    throw new NotFoundError("Lead", leadId);
  }

  // 2. Duplicate conversion check
  if (lead.status === "CONVERTED" || lead.convertedToClientId) {
    throw new ConflictError(
      `Lead '${lead.coupleName}' has already been converted into a client and wedding project.`
    );
  }

  // 3. Prepare dates and defaults
  const startDateStr = input.startDate || lead.eventDate || "2027-02-12";
  const endDateStr = input.endDate || startDateStr;
  const weddingTitle = input.weddingTitle || `${lead.coupleName} Royal Wedding`;
  const city = input.city || lead.city || "Jaipur";
  const venue = input.venue || lead.venue || null;
  const budgetPaise = input.budgetPaise ?? (lead.estimatedBudgetPaise ?? null);
  const guestCount = input.estimatedGuestCount ?? (lead.estimatedGuestCount ?? null);
  const packageType = input.packageType || lead.packageType || "FULL_SERVICE";

  // 4. Run atomic transaction
  return await db.transaction(async (tx) => {
    // 4a. Create client record
    const [client] = await tx
      .insert(clients)
      .values({
        coupleName: lead.coupleName,
        partnerOneName: lead.partnerOneName,
        partnerOneEmail: lead.partnerOneEmail,
        partnerOnePhone: lead.partnerOnePhone,
        partnerTwoName: lead.partnerTwoName,
        partnerTwoEmail: lead.partnerTwoEmail,
        address: city,
        notes: input.notes || lead.notes || null,
        convertedFromLeadId: lead.id,
      })
      .returning();

    // 4b. Create wedding record
    const [wedding] = await tx
      .insert(weddings)
      .values({
        clientId: client.id,
        title: weddingTitle,
        city,
        venue,
        startDate: startDateStr,
        endDate: endDateStr,
        estimatedGuestCount: guestCount,
        budgetPaise,
        packageType,
        lifecycleStatus: "PLANNING",
        assignedPlannerId: lead.assignedPlannerId,
        currency: "INR",
        notes: input.notes || lead.notes || null,
      })
      .returning();

    // 4c. Create initial wedding events
    let createdEvents: (typeof weddingEvents.$inferSelect)[] = [];

    if (input.events && input.events.length > 0) {
      createdEvents = await tx
        .insert(weddingEvents)
        .values(
          input.events.map((e) => ({
            weddingId: wedding.id,
            name: e.name,
            eventType: e.eventType,
            startsAt: new Date(e.startsAt),
            endsAt: new Date(e.endsAt),
            venue: e.venue || venue,
            expectedGuestCount: e.expectedGuestCount || guestCount,
            status: "CONFIRMED" as const,
          }))
        )
        .returning();
    } else {
      // Default 4-event luxury celebration spread across start/end dates
      const baseDate = new Date(`${startDateStr}T09:00:00+05:30`);
      const secondDate = new Date(`${endDateStr}T18:00:00+05:30`);

      const defaultEventsData = [
        {
          weddingId: wedding.id,
          name: "Mehendi Ceremony",
          eventType: "MEHENDI" as const,
          startsAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000), // 10:00 AM Day 1
          endsAt: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000),   // 02:00 PM Day 1
          venue: venue ? `${venue} - Garden Lawn` : "Garden Pavilion",
          expectedGuestCount: guestCount ? Math.round(guestCount * 0.5) : 200,
          status: "CONFIRMED" as const,
        },
        {
          weddingId: wedding.id,
          name: "Sangeet Celebration",
          eventType: "SANGEET" as const,
          startsAt: new Date(baseDate.getTime() + 10 * 60 * 60 * 1000), // 07:00 PM Day 1
          endsAt: new Date(baseDate.getTime() + 16 * 60 * 60 * 1000),  // 01:00 AM Day 2
          venue: venue ? `${venue} - Ballroom` : "Grand Ballroom",
          expectedGuestCount: guestCount || 350,
          status: "CONFIRMED" as const,
        },
        {
          weddingId: wedding.id,
          name: "Wedding Ceremony (Pheras)",
          eventType: "CEREMONY" as const,
          startsAt: new Date(secondDate.getTime() - 9 * 60 * 60 * 1000), // Morning of final day
          endsAt: new Date(secondDate.getTime() - 4 * 60 * 60 * 1000),  // Afternoon
          venue: venue ? `${venue} - Courtyard` : "Main Courtyard",
          expectedGuestCount: guestCount || 400,
          status: "CONFIRMED" as const,
        },
        {
          weddingId: wedding.id,
          name: "Grand Reception",
          eventType: "RECEPTION" as const,
          startsAt: secondDate,                                         // Evening of final day
          endsAt: new Date(secondDate.getTime() + 6 * 60 * 60 * 1000), // Late night
          venue: venue ? `${venue} - Lakeside Lawns` : "Royal Lawns",
          expectedGuestCount: guestCount || 400,
          status: "CONFIRMED" as const,
        },
      ];

      createdEvents = await tx
        .insert(weddingEvents)
        .values(defaultEventsData)
        .returning();
    }

    // 4d. Update lead with conversion references
    await tx
      .update(leads)
      .set({
        status: "CONVERTED",
        convertedToClientId: client.id,
        convertedToWeddingId: wedding.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    // 4e. Record lead activity
    await tx.insert(leadActivities).values({
      leadId: lead.id,
      actorId: actorId || null,
      activityType: "CONVERTED",
      title: "Lead Converted to Wedding",
      description: `Successfully converted to client '${client.coupleName}' and wedding project '${wedding.title}'. ${createdEvents.length} events scheduled.`,
      metadata: {
        clientId: client.id,
        weddingId: wedding.id,
        eventsCount: createdEvents.length,
      },
    });

    // 4f. Record immutable audit log
    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        entityType: "lead",
        entityId: lead.id,
        action: "lead.converted",
        newValue: {
          clientId: client.id,
          weddingId: wedding.id,
          weddingTitle: wedding.title,
          startDate: wedding.startDate,
          endDate: wedding.endDate,
        },
        reason: "Lead agreement signed and converted to active wedding project",
      });
    }

    return {
      client,
      wedding,
      events: createdEvents,
    };
  });
}

