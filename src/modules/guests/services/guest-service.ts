import crypto from "crypto";
import { eq, and, isNull, desc, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  guests,
  guestEventRsvps,
  weddings,
  weddingEvents,
} from "@/lib/db/schema";
import {
  GuestRecord,
  GuestEventRsvpRecord,
  GuestSide,
  MealPreference,
  RsvpStatus,
  PublicRsvpDetails,
} from "../types";
import { NotFoundError } from "@/lib/errors";

export async function getGuestsForWedding(
  weddingId: string,
  options?: {
    search?: string;
    household?: string;
    side?: string;
  }
): Promise<GuestRecord[]> {
  const conditions = [
    eq(guests.weddingId, weddingId),
    isNull(guests.deletedAt),
  ];

  if (options?.side && options.side !== "ALL") {
    conditions.push(eq(guests.side, options.side as GuestSide));
  }

  if (options?.household) {
    conditions.push(eq(guests.householdName, options.household));
  }

  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        ilike(guests.firstName, term),
        ilike(guests.lastName, term),
        ilike(guests.email, term),
        ilike(guests.phone, term),
        ilike(guests.householdName, term)
      )!
    );
  }

  const guestRows = await db
    .select()
    .from(guests)
    .where(and(...conditions))
    .orderBy(desc(guests.createdAt));

  if (guestRows.length === 0) return [];

  // Fetch RSVPs for all these guests
  const rsvpRows = await db
    .select({
      id: guestEventRsvps.id,
      weddingId: guestEventRsvps.weddingId,
      guestId: guestEventRsvps.guestId,
      eventId: guestEventRsvps.eventId,
      eventName: weddingEvents.name,
      status: guestEventRsvps.status,
      plusOnes: guestEventRsvps.plusOnes,
      mealPreference: guestEventRsvps.mealPreference,
      dietaryNotes: guestEventRsvps.dietaryNotes,
      respondedAt: guestEventRsvps.respondedAt,
      notes: guestEventRsvps.notes,
    })
    .from(guestEventRsvps)
    .innerJoin(weddingEvents, eq(guestEventRsvps.eventId, weddingEvents.id))
    .where(eq(guestEventRsvps.weddingId, weddingId));

  const rsvpMap = new Map<string, GuestEventRsvpRecord[]>();
  rsvpRows.forEach((r) => {
    const list = rsvpMap.get(r.guestId) || [];
    list.push({
      ...r,
      status: r.status as RsvpStatus,
      mealPreference: r.mealPreference as MealPreference,
    });
    rsvpMap.set(r.guestId, list);
  });

  return guestRows.map((g) => ({
    id: g.id,
    weddingId: g.weddingId,
    householdName: g.householdName,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    side: g.side as GuestSide,
    isPrimaryContact: g.isPrimaryContact,
    dietaryPreference: g.dietaryPreference as MealPreference,
    allergies: g.allergies,
    accessibilityNeeds: g.accessibilityNeeds,
    notes: g.notes,
    rsvpToken: g.rsvpToken,
    invitationSentAt: g.invitationSentAt,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    rsvps: rsvpMap.get(g.id) || [],
  }));
}

export async function createGuest(data: {
  weddingId: string;
  householdName?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  side?: GuestSide;
  isPrimaryContact?: boolean;
  dietaryPreference?: MealPreference;
  allergies?: string | null;
  accessibilityNeeds?: string | null;
  notes?: string | null;
}): Promise<GuestRecord> {
  const rsvpToken = `rsvp_${crypto.randomBytes(16).toString("hex")}`;

  const [guest] = await db
    .insert(guests)
    .values({
      weddingId: data.weddingId,
      householdName: data.householdName,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      side: data.side || "MUTUAL",
      isPrimaryContact: data.isPrimaryContact ?? false,
      dietaryPreference: data.dietaryPreference || "VEG",
      allergies: data.allergies,
      accessibilityNeeds: data.accessibilityNeeds,
      notes: data.notes,
      rsvpToken,
    })
    .returning();

  // Auto-seed RSVP records for all existing wedding events with default INVITED status
  const events = await db
    .select({ id: weddingEvents.id })
    .from(weddingEvents)
    .where(eq(weddingEvents.weddingId, data.weddingId));

  if (events.length > 0) {
    await db.insert(guestEventRsvps).values(
      events.map((ev) => ({
        weddingId: data.weddingId,
        guestId: guest.id,
        eventId: ev.id,
        status: "INVITED" as const,
        plusOnes: 0,
        mealPreference: guest.dietaryPreference,
      }))
    );
  }

  return {
    ...guest,
    side: guest.side as GuestSide,
    dietaryPreference: guest.dietaryPreference as MealPreference,
    rsvps: [],
  };
}

export async function updateGuest(
  id: string,
  data: Partial<{
    householdName?: string | null;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    side?: GuestSide;
    isPrimaryContact?: boolean;
    dietaryPreference?: MealPreference;
    allergies?: string | null;
    accessibilityNeeds?: string | null;
    notes?: string | null;
  }>
): Promise<GuestRecord> {
  const [updated] = await db
    .update(guests)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(guests.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError(`Guest ${id} not found`);
  }

  return {
    ...updated,
    side: updated.side as GuestSide,
    dietaryPreference: updated.dietaryPreference as MealPreference,
  };
}

export async function deleteGuest(id: string): Promise<void> {
  await db
    .update(guests)
    .set({ deletedAt: new Date() })
    .where(eq(guests.id, id));
}

export async function getGuestByRsvpToken(token: string): Promise<PublicRsvpDetails> {
  const [guest] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.rsvpToken, token), isNull(guests.deletedAt)))
    .limit(1);

  if (!guest) {
    throw new NotFoundError("RSVP invitation link is invalid or expired");
  }

  const [wedding] = await db
    .select({
      id: weddings.id,
      title: weddings.title,
      city: weddings.city,
      venue: weddings.venue,
      startDate: weddings.startDate,
      endDate: weddings.endDate,
    })
    .from(weddings)
    .where(eq(weddings.id, guest.weddingId))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError("Wedding not found for this invitation");
  }

  // Get all events for this wedding
  const events = await db
    .select({
      id: weddingEvents.id,
      name: weddingEvents.name,
      eventType: weddingEvents.eventType,
      startsAt: weddingEvents.startsAt,
      endsAt: weddingEvents.endsAt,
      venue: weddingEvents.venue,
    })
    .from(weddingEvents)
    .where(eq(weddingEvents.weddingId, wedding.id))
    .orderBy(weddingEvents.startsAt);

  // Get existing RSVPs for this guest
  const existingRsvps = await db
    .select()
    .from(guestEventRsvps)
    .where(eq(guestEventRsvps.guestId, guest.id));

  const rsvpMap = new Map(existingRsvps.map((r) => [r.eventId, r]));

  const eventOptions = events.map((ev) => {
    const current = rsvpMap.get(ev.id);
    return {
      id: ev.id,
      name: ev.name,
      eventType: ev.eventType,
      startsAt: ev.startsAt?.toISOString() || null,
      endsAt: ev.endsAt?.toISOString() || null,
      venue: ev.venue,
      currentStatus: (current?.status as RsvpStatus) || "INVITED",
      currentPlusOnes: current?.plusOnes ?? 0,
      currentMealPreference:
        (current?.mealPreference as MealPreference) ||
        (guest.dietaryPreference as MealPreference) ||
        "VEG",
      currentDietaryNotes: current?.dietaryNotes || null,
    };
  });

  return {
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      householdName: guest.householdName,
      dietaryPreference: guest.dietaryPreference as MealPreference,
      allergies: guest.allergies,
      accessibilityNeeds: guest.accessibilityNeeds,
    },
    wedding: {
      id: wedding.id,
      title: wedding.title,
      city: wedding.city,
      venue: wedding.venue,
      startDate: wedding.startDate,
      endDate: wedding.endDate,
    },
    events: eventOptions,
  };
}

export async function submitGuestRsvp(
  token: string,
  data: {
    rsvps: Array<{
      eventId: string;
      status: "INVITED" | "ATTENDING" | "DECLINED" | "TENTATIVE";
      plusOnes: number;
      mealPreference: "VEG" | "JAIN" | "NON_VEG" | "VEGAN";
      dietaryNotes?: string | null;
    }>;
    allergies?: string | null;
    accessibilityNeeds?: string | null;
  }
): Promise<{ success: boolean; count: number }> {
  const [guest] = await db
    .select({ id: guests.id, weddingId: guests.weddingId })
    .from(guests)
    .where(and(eq(guests.rsvpToken, token), isNull(guests.deletedAt)))
    .limit(1);

  if (!guest) {
    throw new NotFoundError("RSVP invitation link is invalid or expired");
  }

  // Update guest allergies or accessibility needs if submitted
  if (data.allergies !== undefined || data.accessibilityNeeds !== undefined) {
    await db
      .update(guests)
      .set({
        allergies: data.allergies,
        accessibilityNeeds: data.accessibilityNeeds,
        updatedAt: new Date(),
      })
      .where(eq(guests.id, guest.id));
  }

  const now = new Date();

  // Upsert each event response
  for (const item of data.rsvps) {
    const [existing] = await db
      .select({ id: guestEventRsvps.id })
      .from(guestEventRsvps)
      .where(
        and(
          eq(guestEventRsvps.guestId, guest.id),
          eq(guestEventRsvps.eventId, item.eventId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(guestEventRsvps)
        .set({
          status: item.status,
          plusOnes: item.plusOnes,
          mealPreference: item.mealPreference,
          dietaryNotes: item.dietaryNotes || null,
          respondedAt: now,
          updatedAt: now,
        })
        .where(eq(guestEventRsvps.id, existing.id));
    } else {
      await db.insert(guestEventRsvps).values({
        weddingId: guest.weddingId,
        guestId: guest.id,
        eventId: item.eventId,
        status: item.status,
        plusOnes: item.plusOnes,
        mealPreference: item.mealPreference,
        dietaryNotes: item.dietaryNotes || null,
        respondedAt: now,
      });
    }
  }

  return { success: true, count: data.rsvps.length };
}
