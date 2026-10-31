import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import {
  packageTypeEnum,
  weddingLifecycleEnum,
  eventTypeEnum,
  eventStatusEnum,
} from "./enums";
import { clients } from "./clients";
import { users } from "./users";

export const weddings = pgTable(
  "weddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    title: text("title").notNull(),
    city: text("city"),
    venue: text("venue"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    estimatedGuestCount: integer("estimated_guest_count"),
    budgetPaise: bigint("budget_paise", { mode: "bigint" }),
    packageType: packageTypeEnum("package_type"),
    lifecycleStatus: weddingLifecycleEnum("lifecycle_status")
      .default("PLANNING")
      .notNull(),
    assignedPlannerId: uuid("assigned_planner_id").references(() => users.id),
    currency: text("currency").default("INR").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("weddings_client_id_idx").on(table.clientId),
    index("weddings_lifecycle_status_idx").on(table.lifecycleStatus),
    index("weddings_assigned_planner_id_idx").on(table.assignedPlannerId),
    index("weddings_deleted_at_idx").on(table.deletedAt),
  ]
);

export const weddingEvents = pgTable(
  "wedding_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    name: text("name").notNull(),
    eventType: eventTypeEnum("event_type").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    venue: text("venue"),
    expectedGuestCount: integer("expected_guest_count"),
    status: eventStatusEnum("status").default("DRAFT").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("wedding_events_wedding_id_idx").on(table.weddingId),
    index("wedding_events_event_type_idx").on(table.eventType),
    index("wedding_events_status_idx").on(table.status),
  ]
);
