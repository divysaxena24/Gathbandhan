import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { vendorCategoryEnum } from "./enums";
import { weddings, weddingEvents } from "./weddings";

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: vendorCategoryEnum("category").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    serviceArea: text("service_area").array(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
    totalWeddings: integer("total_weddings").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("vendors_category_idx").on(table.category),
    index("vendors_city_idx").on(table.city),
    index("vendors_is_active_idx").on(table.isActive),
    index("vendors_deleted_at_idx").on(table.deletedAt),
  ]
);

export const weddingVendors = pgTable(
  "wedding_vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id)
      .notNull(),
    eventId: uuid("event_id").references(() => weddingEvents.id),
    contractAmountPaise: bigint("contract_amount_paise", { mode: "bigint" }),
    currency: text("currency").default("INR").notNull(),
    scope: text("scope"),
    status: text("status").default("assigned").notNull(),
    terms: text("terms"),
    expectedArrivalAt: timestamp("expected_arrival_at", {
      withTimezone: true,
    }),
    graceMinutes: integer("grace_minutes").default(15).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("wedding_vendors_wedding_id_idx").on(table.weddingId),
    index("wedding_vendors_vendor_id_idx").on(table.vendorId),
    index("wedding_vendors_event_id_idx").on(table.eventId),
  ]
);
