import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  guestSideEnum,
  rsvpStatusEnum,
  mealPreferenceEnum,
  transportStatusEnum,
} from "./enums";
import { weddings, weddingEvents } from "./weddings";

// ── Guests & Households ───────────────────────────────────────────
export const guests = pgTable(
  "guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    householdName: text("household_name"), // e.g. "Kapoor Family", "Joshi Clan"
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    side: guestSideEnum("side").default("MUTUAL").notNull(),
    isPrimaryContact: boolean("is_primary_contact").default(false).notNull(),
    dietaryPreference: mealPreferenceEnum("dietary_preference")
      .default("VEG")
      .notNull(),
    allergies: text("allergies"), // Confidential/restricted operational data
    accessibilityNeeds: text("accessibility_needs"), // Mobility, wheelchair, elderly care
    notes: text("notes"),
    rsvpToken: text("rsvp_token").unique().notNull(), // Unique token for public/secure /rsvp/[token]
    invitationSentAt: timestamp("invitation_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("guests_wedding_id_idx").on(table.weddingId),
    index("guests_household_idx").on(table.householdName),
    index("guests_side_idx").on(table.side),
    uniqueIndex("guests_rsvp_token_idx").on(table.rsvpToken),
    index("guests_deleted_at_idx").on(table.deletedAt),
  ]
);

// ── Per-Event RSVPs ───────────────────────────────────────────────
export const guestEventRsvps = pgTable(
  "guest_event_rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    guestId: uuid("guest_id")
      .references(() => guests.id, { onDelete: "cascade" })
      .notNull(),
    eventId: uuid("event_id")
      .references(() => weddingEvents.id, { onDelete: "cascade" })
      .notNull(),
    status: rsvpStatusEnum("status").default("INVITED").notNull(),
    plusOnes: integer("plus_ones").default(0).notNull(),
    mealPreference: mealPreferenceEnum("meal_preference")
      .default("VEG")
      .notNull(),
    dietaryNotes: text("dietary_notes"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("guest_event_unique_idx").on(table.guestId, table.eventId),
    index("guest_rsvps_wedding_id_idx").on(table.weddingId),
    index("guest_rsvps_event_id_idx").on(table.eventId),
    index("guest_rsvps_status_idx").on(table.status),
  ]
);

// ── Accommodation Bookings & Room Allocations ─────────────────────
export const accommodationBookings = pgTable(
  "accommodation_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    guestId: uuid("guest_id").references(() => guests.id),
    householdName: text("household_name"),
    hotelName: text("hotel_name").notNull(), // e.g. "Taj Lake Palace, Udaipur"
    roomNumber: text("room_number"), // e.g. "Suite 204"
    roomType: text("room_type").notNull(), // e.g. "Palace Lake View Suite", "Luxury Heritage Room"
    checkInDate: date("check_in_date").notNull(),
    checkOutDate: date("check_out_date").notNull(),
    confirmationCode: text("confirmation_code"),
    status: text("status").default("CONFIRMED").notNull(), // CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("accommodation_wedding_id_idx").on(table.weddingId),
    index("accommodation_guest_id_idx").on(table.guestId),
    index("accommodation_hotel_idx").on(table.hotelName),
  ]
);

// ── Transport & Airport Transfers ─────────────────────────────────
export const transportAssignments = pgTable(
  "transport_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    guestId: uuid("guest_id").references(() => guests.id),
    guestName: text("guest_name"), // Display name if assigned to family/group
    transferType: text("transfer_type").notNull(), // AIRPORT_PICKUP, AIRPORT_DROPOFF, INTER_VENUE_SHUTTLE
    pickupTime: timestamp("pickup_time", { withTimezone: true }).notNull(),
    pickupLocation: text("pickup_location").notNull(),
    dropoffLocation: text("dropoff_location").notNull(),
    vehicleType: text("vehicle_type").notNull(), // "Toyota Innova Crysta", "Mercedes S-Class", "Force Urbania 17-Seater"
    vehicleNumber: text("vehicle_number"), // "RJ-27-PA-4421"
    driverName: text("driver_name"),
    driverPhone: text("driver_phone"),
    passengerCount: integer("passenger_count").default(1).notNull(),
    status: transportStatusEnum("status").default("SCHEDULED").notNull(),
    flightTrainNumber: text("flight_train_number"), // "6E-2094 from DEL"
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transport_wedding_id_idx").on(table.weddingId),
    index("transport_pickup_time_idx").on(table.pickupTime),
    index("transport_status_idx").on(table.status),
  ]
);

