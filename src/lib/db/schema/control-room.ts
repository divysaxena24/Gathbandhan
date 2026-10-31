import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { incidentSeverityEnum, checkInStatusEnum } from "./enums";
import { weddings, weddingEvents } from "./weddings";
import { vendors, weddingVendors } from "./vendors";
import { users } from "./users";

export const timelineItems = pgTable(
  "timeline_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    eventId: uuid("event_id")
      .references(() => weddingEvents.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    ownerId: uuid("owner_id").references(() => users.id),
    vendorId: uuid("vendor_id").references(() => vendors.id),
    weddingVendorId: uuid("wedding_vendor_id").references(
      () => weddingVendors.id
    ),
    status: text("status").default("PENDING").notNull(), // PENDING, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
    isKeyMoment: boolean("is_key_moment").default(false).notNull(),
    location: text("location"),
    orderIndex: integer("order_index").default(0).notNull(),
    actualStartsAt: timestamp("actual_starts_at", { withTimezone: true }),
    actualEndsAt: timestamp("actual_ends_at", { withTimezone: true }),
    delayMinutes: integer("delay_minutes").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("timeline_items_wedding_id_idx").on(table.weddingId),
    index("timeline_items_event_id_idx").on(table.eventId),
    index("timeline_items_starts_at_idx").on(table.startsAt),
    index("timeline_items_status_idx").on(table.status),
  ]
);

export const timelineDependencies = pgTable(
  "timeline_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timelineItemId: uuid("timeline_item_id")
      .references(() => timelineItems.id, { onDelete: "cascade" })
      .notNull(),
    dependsOnItemId: uuid("depends_on_item_id")
      .references(() => timelineItems.id, { onDelete: "cascade" })
      .notNull(),
    bufferMinutes: integer("buffer_minutes").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("timeline_deps_item_id_idx").on(table.timelineItemId),
    index("timeline_deps_depends_on_idx").on(table.dependsOnItemId),
  ]
);

export const vendorCheckIns = pgTable(
  "vendor_check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingVendorId: uuid("wedding_vendor_id")
      .references(() => weddingVendors.id, { onDelete: "cascade" })
      .notNull(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    eventId: uuid("event_id").references(() => weddingEvents.id),
    tokenHash: text("token_hash").unique().notNull(),
    rawToken: text("raw_token").notNull(),
    expectedArrivalAt: timestamp("expected_arrival_at", {
      withTimezone: true,
    }).notNull(),
    graceMinutes: integer("grace_minutes").default(15).notNull(),
    status: checkInStatusEnum("status").default("EXPECTED").notNull(),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    checkInSource: text("check_in_source"), // QR_SCAN, WEB_LINK, MANUAL_COORDINATOR
    checkedInBy: text("checked_in_by"),
    contactPhone: text("contact_phone"),
    notes: text("notes"),
    lateAlertSentAt: timestamp("late_alert_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vendor_check_ins_wedding_id_idx").on(table.weddingId),
    index("vendor_check_ins_vendor_assignment_idx").on(table.weddingVendorId),
    index("vendor_check_ins_status_idx").on(table.status),
    index("vendor_check_ins_token_hash_idx").on(table.tokenHash),
  ]
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    eventId: uuid("event_id").references(() => weddingEvents.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    severity: incidentSeverityEnum("severity").default("MEDIUM").notNull(),
    status: text("status").default("OPEN").notNull(), // OPEN, INVESTIGATING, RESOLVED
    ownerId: uuid("owner_id").references(() => users.id),
    vendorId: uuid("vendor_id").references(() => vendors.id),
    reportedBy: text("reported_by").notNull(),
    reportedAt: timestamp("reported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
    costImpactPaise: bigint("cost_impact_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("incidents_wedding_id_idx").on(table.weddingId),
    index("incidents_event_id_idx").on(table.eventId),
    index("incidents_severity_idx").on(table.severity),
    index("incidents_status_idx").on(table.status),
  ]
);

export const controlRoomAlerts = pgTable(
  "control_room_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    alertType: text("alert_type").notNull(), // VENDOR_LATE, SCHEDULE_DELAY, INCIDENT_CRITICAL
    severity: text("severity").default("WARNING").notNull(), // INFO, WARNING, CRITICAL
    title: text("title").notNull(),
    message: text("message").notNull(),
    relatedEntityType: text("related_entity_type"), // wedding_vendors, timeline_items, incidents
    relatedEntityId: uuid("related_entity_id"),
    isDismissed: boolean("is_dismissed").default(false).notNull(),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cr_alerts_wedding_id_idx").on(table.weddingId),
    index("cr_alerts_type_idx").on(table.alertType),
    index("cr_alerts_is_dismissed_idx").on(table.isDismissed),
  ]
);
