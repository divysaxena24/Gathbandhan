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
import {
  vendorCategoryEnum,
  quoteRequestStatusEnum,
  quoteStatusEnum,
  inclusionStatusEnum,
} from "./enums";
import { weddings } from "./weddings";
import { vendors } from "./vendors";
import { users } from "./users";

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    category: vendorCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    targetBudgetPaise: bigint("target_budget_paise", { mode: "bigint" }),
    deadline: timestamp("deadline", { withTimezone: true }),
    status: quoteRequestStatusEnum("status").default("OPEN").notNull(),
    selectedQuoteId: uuid("selected_quote_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("quote_requests_wedding_id_idx").on(table.weddingId),
    index("quote_requests_category_idx").on(table.category),
    index("quote_requests_status_idx").on(table.status),
  ]
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteRequestId: uuid("quote_request_id")
      .references(() => quoteRequests.id)
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id)
      .notNull(),
    status: quoteStatusEnum("status").default("REQUESTED").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    currency: text("currency").default("INR").notNull(),
    rawDocumentUrl: text("raw_document_url"),
    rawDocumentName: text("raw_document_name"),
    rawDocumentText: text("raw_document_text"),
    extractionStatus: text("extraction_status").default("MANUAL").notNull(),
    confidenceScore: numeric("confidence_score", { precision: 4, scale: 2 }),
    extractionNotes: text("extraction_notes"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    basePricePaise: bigint("base_price_paise", { mode: "bigint" }),
    travelFeePaise: bigint("travel_fee_paise", { mode: "bigint" }),
    overtimeHourlyRatePaise: bigint("overtime_hourly_rate_paise", {
      mode: "bigint",
    }),
    taxRule: text("tax_rule").default("GST_18").notNull(),
    serviceChargeRule: text("service_charge_rule").default("NONE").notNull(),
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
    index("quotes_quote_request_id_idx").on(table.quoteRequestId),
    index("quotes_vendor_id_idx").on(table.vendorId),
    index("quotes_status_idx").on(table.status),
  ]
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .references(() => quotes.id)
      .notNull(),
    name: text("name").notNull(),
    category: text("category").default("General"),
    quantity: integer("quantity").default(1).notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPricePaise: bigint("unit_price_paise", { mode: "bigint" }),
    fixedChargePaise: bigint("fixed_charge_paise", { mode: "bigint" }),
    isPerGuest: boolean("is_per_guest").default(false).notNull(),
    taxPercent: numeric("tax_percent", { precision: 5, scale: 2 })
      .default("18.00")
      .notNull(),
    serviceChargePercent: numeric("service_charge_percent", {
      precision: 5,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    inclusionStatus: inclusionStatusEnum("inclusion_status")
      .default("INCLUDED")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("quote_items_quote_id_idx").on(table.quoteId)]
);
