import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { paymentStatusEnum, invoiceStatusEnum, vendorCategoryEnum } from "./enums";
import { weddings } from "./weddings";
import { vendors, weddingVendors } from "./vendors";
import { users } from "./users";

// ── Client Payment Milestones ─────────────────────────────────────
export const clientPaymentMilestones = pgTable(
  "client_payment_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    title: text("title").notNull(), // e.g. "Booking Deposit 20%", "Mid-Term Advance 50%"
    percentage: numeric("percentage", { precision: 5, scale: 2 }), // e.g. 20.00
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    paidPaise: bigint("paid_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    dueAt: date("due_at").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_milestones_wedding_id_idx").on(table.weddingId),
    index("client_milestones_status_idx").on(table.status),
    index("client_milestones_due_at_idx").on(table.dueAt),
  ]
);

// ── Client Payment Transactions (Receipts) ───────────────────────
export const clientPaymentTransactions = pgTable(
  "client_payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    milestoneId: uuid("milestone_id")
      .references(() => clientPaymentMilestones.id)
      .notNull(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    paymentMethod: text("payment_method").notNull(), // NEFT, RTGS, UPI, BANK_TRANSFER, CHEQUE
    reference: text("reference").notNull(), // UTR / Bank transaction ID / Cheque #
    idempotencyKey: text("idempotency_key").unique().notNull(),
    recordedBy: uuid("recorded_by").references(() => users.id),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_tx_milestone_id_idx").on(table.milestoneId),
    index("client_tx_wedding_id_idx").on(table.weddingId),
    index("client_tx_idempotency_idx").on(table.idempotencyKey),
  ]
);

// ── Vendor Invoices ──────────────────────────────────────────────
export const vendorInvoices = pgTable(
  "vendor_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingVendorId: uuid("wedding_vendor_id")
      .references(() => weddingVendors.id)
      .notNull(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id)
      .notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotalPaise: bigint("subtotal_paise", { mode: "bigint" }).notNull(),
    taxPaise: bigint("tax_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(), // GST
    totalPaise: bigint("total_paise", { mode: "bigint" }).notNull(),
    paidPaise: bigint("paid_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    status: invoiceStatusEnum("status").default("SENT").notNull(),
    documentUrl: text("document_url"),
    notes: text("notes"),
    isReconciled: boolean("is_reconciled").default(false).notNull(),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    reconciledBy: uuid("reconciled_by").references(() => users.id),
    reconciliationNotes: text("reconciliation_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vendor_invoices_wedding_id_idx").on(table.weddingId),
    index("vendor_invoices_vendor_assignment_idx").on(table.weddingVendorId),
    index("vendor_invoices_status_idx").on(table.status),
    index("vendor_invoices_number_idx").on(table.invoiceNumber),
  ]
);

// ── Vendor Payment Transactions (Disbursements) ───────────────────
export const vendorPaymentTransactions = pgTable(
  "vendor_payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .references(() => vendorInvoices.id)
      .notNull(),
    weddingVendorId: uuid("wedding_vendor_id")
      .references(() => weddingVendors.id)
      .notNull(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    paymentMethod: text("payment_method").notNull(), // RTGS, NEFT, IMPS, CHEQUE
    reference: text("reference").notNull(), // Bank UTR / Cheque Ref
    idempotencyKey: text("idempotency_key").unique().notNull(),
    recordedBy: uuid("recorded_by").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vendor_tx_invoice_id_idx").on(table.invoiceId),
    index("vendor_tx_wedding_id_idx").on(table.weddingId),
    index("vendor_tx_idempotency_idx").on(table.idempotencyKey),
  ]
);

// ── Wedding Miscellaneous Expenses ────────────────────────────────
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    title: text("title").notNull(),
    category: vendorCategoryEnum("category").notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    incurredAt: timestamp("incurred_at", { withTimezone: true }).notNull(),
    vendorId: uuid("vendor_id").references(() => vendors.id),
    billableToClient: boolean("billable_to_client").default(false).notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("expenses_wedding_id_idx").on(table.weddingId),
    index("expenses_category_idx").on(table.category),
    index("expenses_is_approved_idx").on(table.isApproved),
  ]
);

// ── Approved Client-Billable Extras ───────────────────────────────
export const approvedExtras = pgTable(
  "approved_extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    weddingVendorId: uuid("wedding_vendor_id").references(
      () => weddingVendors.id
    ),
    title: text("title").notNull(), // e.g. "Additional 50 Dining Guests", "Late Night DJ Overtime"
    description: text("description"),
    category: text("category").notNull(),
    unitRatePaise: bigint("unit_rate_paise", { mode: "bigint" }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    vendorCostPaise: bigint("vendor_cost_paise", { mode: "bigint" }).notNull(),
    clientAmountPaise: bigint("client_amount_paise", { mode: "bigint" }).notNull(),
    billableToClient: boolean("billable_to_client").default(true).notNull(),
    status: text("status").default("PENDING_APPROVAL").notNull(), // PENDING_APPROVAL, APPROVED, BILLED, REJECTED
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("approved_extras_wedding_id_idx").on(table.weddingId),
    index("approved_extras_vendor_idx").on(table.weddingVendorId),
    index("approved_extras_status_idx").on(table.status),
  ]
);
