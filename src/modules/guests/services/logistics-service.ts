import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  guests,
  guestEventRsvps,
  accommodationBookings,
  transportAssignments,
  weddingEvents,
} from "@/lib/db/schema";
import {
  AccommodationBookingRecord,
  TransportAssignmentRecord,
  TransportStatus,
  WeddingLogisticsOverview,
  EventDietarySummary,
  AllergyBreakdown,
} from "../types";
import { NotFoundError } from "@/lib/errors";

export async function getDietarySummaryForWedding(
  weddingId: string,
  bufferPercentage = 5
): Promise<WeddingLogisticsOverview> {
  // 1. Fetch wedding events
  const events = await db
    .select({
      id: weddingEvents.id,
      name: weddingEvents.name,
      eventType: weddingEvents.eventType,
      startsAt: weddingEvents.startsAt,
      venue: weddingEvents.venue,
    })
    .from(weddingEvents)
    .where(eq(weddingEvents.weddingId, weddingId))
    .orderBy(weddingEvents.startsAt);

  // 2. Fetch all active guests and their RSVPs
  const allGuests = await db
    .select({
      id: guests.id,
      householdName: guests.householdName,
      allergies: guests.allergies,
    })
    .from(guests)
    .where(and(eq(guests.weddingId, weddingId), isNull(guests.deletedAt)));

  const guestMap = new Map(allGuests.map((g) => [g.id, g]));

  const rsvps = await db
    .select({
      id: guestEventRsvps.id,
      guestId: guestEventRsvps.guestId,
      eventId: guestEventRsvps.eventId,
      status: guestEventRsvps.status,
      plusOnes: guestEventRsvps.plusOnes,
      mealPreference: guestEventRsvps.mealPreference,
      dietaryNotes: guestEventRsvps.dietaryNotes,
    })
    .from(guestEventRsvps)
    .where(eq(guestEventRsvps.weddingId, weddingId));

  // 3. Aggregate metrics per event
  const eventSummaries: EventDietarySummary[] = events.map((ev) => {
    const eventRsvps = rsvps.filter((r) => r.eventId === ev.id);

    let confirmedGuests = 0;
    let plusOnesCount = 0;
    let vegCount = 0;
    let jainCount = 0;
    let nonVegCount = 0;
    let veganCount = 0;
    let declinedCount = 0;
    let pendingCount = 0;

    const allergyCounts = new Map<string, number>();
    const specialRequests: string[] = [];

    eventRsvps.forEach((r) => {
      if (r.status === "ATTENDING") {
        confirmedGuests += 1;
        plusOnesCount += r.plusOnes;
        const totalPeople = 1 + r.plusOnes;

        if (r.mealPreference === "JAIN") jainCount += totalPeople;
        else if (r.mealPreference === "NON_VEG") nonVegCount += totalPeople;
        else if (r.mealPreference === "VEGAN") veganCount += totalPeople;
        else vegCount += totalPeople;

        // Check allergies from guest record
        const guestInfo = guestMap.get(r.guestId);
        if (guestInfo?.allergies) {
          const parts = guestInfo.allergies
            .split(/[,;/]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          parts.forEach((allergy) => {
            const normalized =
              allergy.charAt(0).toUpperCase() + allergy.slice(1).toLowerCase();
            allergyCounts.set(
              normalized,
              (allergyCounts.get(normalized) || 0) + 1
            );
          });
        }

        if (r.dietaryNotes) {
          specialRequests.push(r.dietaryNotes);
        }
      } else if (r.status === "DECLINED") {
        declinedCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    const totalAttendingHeadcount = confirmedGuests + plusOnesCount;
    const bufferHeadcount = Math.ceil(
      totalAttendingHeadcount * (bufferPercentage / 100)
    );
    const totalCateringPlatesCommitted =
      totalAttendingHeadcount + bufferHeadcount;

    const allergies: AllergyBreakdown[] = Array.from(
      allergyCounts.entries()
    ).map(([allergy, count]) => ({ allergy, count }));

    return {
      eventId: ev.id,
      eventName: ev.name,
      eventType: ev.eventType,
      startsAt: ev.startsAt,
      venue: ev.venue,
      confirmedGuests,
      plusOnesCount,
      totalAttendingHeadcount,
      cateringBufferPercentage: bufferPercentage,
      bufferHeadcount,
      totalCateringPlatesCommitted,
      vegCount,
      jainCount,
      nonVegCount,
      veganCount,
      declinedCount,
      pendingCount,
      allergies,
      specialRequests: specialRequests.slice(0, 15),
    };
  });

  // 4. Overall counts
  const totalInvitedGuests = allGuests.length;
  const uniqueHouseholds = new Set(
    allGuests.map((g) => g.householdName).filter(Boolean)
  ).size;

  const roomCount = await db
    .select({ id: accommodationBookings.id })
    .from(accommodationBookings)
    .where(eq(accommodationBookings.weddingId, weddingId));

  const transportCount = await db
    .select({ id: transportAssignments.id })
    .from(transportAssignments)
    .where(eq(transportAssignments.weddingId, weddingId));

  // Determine global confirmed / declined from first or max event attendance
  const maxAttending = Math.max(
    0,
    ...eventSummaries.map((s) => s.totalAttendingHeadcount)
  );
  const maxDeclined = Math.max(0, ...eventSummaries.map((s) => s.declinedCount));

  return {
    weddingId,
    totalInvitedGuests,
    totalConfirmedGuests: maxAttending,
    totalDeclinedGuests: maxDeclined,
    totalPendingGuests: Math.max(0, totalInvitedGuests - maxAttending - maxDeclined),
    totalHouseholds: uniqueHouseholds,
    totalRoomsBooked: roomCount.length,
    totalTransfersScheduled: transportCount.length,
    eventSummaries,
  };
}

export async function getAccommodationBookings(
  weddingId: string
): Promise<AccommodationBookingRecord[]> {
  const rows = await db
    .select({
      id: accommodationBookings.id,
      weddingId: accommodationBookings.weddingId,
      guestId: accommodationBookings.guestId,
      guestFirstName: guests.firstName,
      guestLastName: guests.lastName,
      householdName: accommodationBookings.householdName,
      hotelName: accommodationBookings.hotelName,
      roomNumber: accommodationBookings.roomNumber,
      roomType: accommodationBookings.roomType,
      checkInDate: accommodationBookings.checkInDate,
      checkOutDate: accommodationBookings.checkOutDate,
      confirmationCode: accommodationBookings.confirmationCode,
      status: accommodationBookings.status,
      notes: accommodationBookings.notes,
      createdAt: accommodationBookings.createdAt,
    })
    .from(accommodationBookings)
    .leftJoin(guests, eq(accommodationBookings.guestId, guests.id))
    .where(eq(accommodationBookings.weddingId, weddingId))
    .orderBy(desc(accommodationBookings.createdAt));

  return rows.map((r) => ({
    id: r.id,
    weddingId: r.weddingId,
    guestId: r.guestId,
    guestName: r.guestFirstName
      ? `${r.guestFirstName} ${r.guestLastName}`
      : r.householdName || "Unassigned Guest",
    householdName: r.householdName,
    hotelName: r.hotelName,
    roomNumber: r.roomNumber,
    roomType: r.roomType,
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate,
    confirmationCode: r.confirmationCode,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}

export async function createAccommodationBooking(data: {
  weddingId: string;
  guestId?: string | null;
  householdName?: string | null;
  hotelName: string;
  roomNumber?: string | null;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  confirmationCode?: string | null;
  status?: string;
  notes?: string | null;
}): Promise<AccommodationBookingRecord> {
  const [created] = await db
    .insert(accommodationBookings)
    .values({
      weddingId: data.weddingId,
      guestId: data.guestId,
      householdName: data.householdName,
      hotelName: data.hotelName,
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      confirmationCode: data.confirmationCode,
      status: data.status || "CONFIRMED",
      notes: data.notes,
    })
    .returning();

  return {
    ...created,
    guestName: data.householdName || "Guest",
  };
}

export async function getTransportAssignments(
  weddingId: string
): Promise<TransportAssignmentRecord[]> {
  const rows = await db
    .select()
    .from(transportAssignments)
    .where(eq(transportAssignments.weddingId, weddingId))
    .orderBy(transportAssignments.pickupTime);

  return rows.map((r) => ({
    id: r.id,
    weddingId: r.weddingId,
    guestId: r.guestId,
    guestName: r.guestName,
    transferType: r.transferType,
    pickupTime: r.pickupTime,
    pickupLocation: r.pickupLocation,
    dropoffLocation: r.dropoffLocation,
    vehicleType: r.vehicleType,
    vehicleNumber: r.vehicleNumber,
    driverName: r.driverName,
    driverPhone: r.driverPhone,
    passengerCount: r.passengerCount,
    status: r.status as TransportStatus,
    flightTrainNumber: r.flightTrainNumber,
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}

export async function createTransportAssignment(data: {
  weddingId: string;
  guestId?: string | null;
  guestName?: string | null;
  transferType: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  passengerCount?: number;
  status?: TransportStatus;
  flightTrainNumber?: string | null;
  notes?: string | null;
}): Promise<TransportAssignmentRecord> {
  const [created] = await db
    .insert(transportAssignments)
    .values({
      weddingId: data.weddingId,
      guestId: data.guestId,
      guestName: data.guestName,
      transferType: data.transferType,
      pickupTime: new Date(data.pickupTime),
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      passengerCount: data.passengerCount || 1,
      status: data.status || "SCHEDULED",
      flightTrainNumber: data.flightTrainNumber,
      notes: data.notes,
    })
    .returning();

  return {
    ...created,
    status: created.status as TransportStatus,
  };
}

export async function updateTransportStatus(
  id: string,
  status: TransportStatus
): Promise<TransportAssignmentRecord> {
  const [updated] = await db
    .update(transportAssignments)
    .set({ status, updatedAt: new Date() })
    .where(eq(transportAssignments.id, id))
    .returning();

  if (!updated) {
    throw new NotFoundError(`Transport assignment ${id} not found`);
  }

  return {
    ...updated,
    status: updated.status as TransportStatus,
  };
}
