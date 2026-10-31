import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { leads } from "./leads";
import { weddings } from "./weddings";

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    leadId: uuid("lead_id").references(() => leads.id),
    weddingId: uuid("wedding_id").references(() => weddings.id),
    coupleName: text("couple_name").notNull(),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    preferredContactMethod: text("preferred_contact_method"),
    weddingType: text("wedding_type"),
    regionalTraditions: jsonb("regional_traditions"),
    ceremonies: jsonb("ceremonies"),
    destination: text("destination"),
    destinationCity: text("destination_city"),
    venueType: text("venue_type"),
    preferredDate: text("preferred_date"),
    dateFlexible: boolean("date_flexible").default(false),
    durationDays: integer("duration_days").default(2),
    guestCount: integer("guest_count"),
    guestBreakdown: jsonb("guest_breakdown"),
    theme: text("theme"),
    decorPreferences: jsonb("decor_preferences"),
    colorPalette: jsonb("color_palette"),
    cateringType: text("catering_type"),
    cuisines: jsonb("cuisines"),
    dietaryRestrictions: jsonb("dietary_restrictions"),
    foodCounters: jsonb("food_counters"),
    photography: jsonb("photography"),
    entertainment: jsonb("entertainment"),
    accommodation: jsonb("accommodation"),
    transportation: jsonb("transportation"),
    additionalServices: jsonb("additional_services"),
    customRequirements: text("custom_requirements"),
    estimatedBudgetPaise: bigint("estimated_budget_paise", { mode: "bigint" }),
    budgetBreakdown: jsonb("budget_breakdown"),
    fullSelections: jsonb("full_selections"),
    status: text("status").default("SUBMITTED").notNull(), // SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, ACCEPTED, REJECTED
    reviewNotes: text("review_notes"),
    internalNotes: text("internal_notes"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_requests_user_id_idx").on(table.userId),
    index("booking_requests_lead_id_idx").on(table.leadId),
    index("booking_requests_wedding_id_idx").on(table.weddingId),
    index("booking_requests_status_idx").on(table.status),
    index("booking_requests_created_at_idx").on(table.createdAt),
  ]
);

export const bookingRequestMessages = pgTable(
  "booking_request_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingRequestId: uuid("booking_request_id")
      .references(() => bookingRequests.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id").references(() => users.id),
    senderName: text("sender_name").notNull(),
    senderRole: text("sender_role").notNull(), // 'CLIENT' | 'PLANNER'
    message: text("message").notNull(),
    isInternal: boolean("is_internal").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_request_messages_request_id_idx").on(table.bookingRequestId),
    index("booking_request_messages_created_at_idx").on(table.createdAt),
  ]
);
