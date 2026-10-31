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
import {
  paymentStatusEnum,
  invoiceStatusEnum,
  vendorCategoryEnum,
  billStatusEnum,
  virtualPaymentSessionStatusEnum,
  virtualPaymentTypeEnum,
} from "./enums";
import { weddings } from "./weddings";
import { clients } from "./clients";
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

// ── Client Bills (Admin Invoicing & Client Acceptance) ────────────
export const clientBills = pgTable(
  "client_bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    billNumber: text("bill_number").notNull(),
    title: text("title").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotalPaise: bigint("subtotal_paise", { mode: "bigint" }).notNull(),
    taxPaise: bigint("tax_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalPaise: bigint("total_paise", { mode: "bigint" }).notNull(),
    paidPaise: bigint("paid_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    advancePercentage: numeric("advance_percentage", { precision: 5, scale: 2 })
      .default("0.00")
      .notNull(),
    advanceAmountPaise: bigint("advance_amount_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    balanceDueAt: date("balance_due_at"),
    status: billStatusEnum("status").default("DRAFT").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_bills_wedding_id_idx").on(table.weddingId),
    index("client_bills_client_id_idx").on(table.clientId),
    index("client_bills_status_idx").on(table.status),
    index("client_bills_bill_number_idx").on(table.billNumber),
  ]
);

// ── Client Bill Items ─────────────────────────────────────────────
export const clientBillItems = pgTable(
  "client_bill_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    billId: uuid("bill_id")
      .references(() => clientBills.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    unitRatePaise: bigint("unit_rate_paise", { mode: "bigint" }).notNull(),
    totalPaise: bigint("total_paise", { mode: "bigint" }).notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_bill_items_bill_id_idx").on(table.billId),
  ]
);

// ── Client Bill Installments ──────────────────────────────────────
export const clientBillInstallments = pgTable(
  "client_bill_installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    billId: uuid("bill_id")
      .references(() => clientBills.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    paidPaise: bigint("paid_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    dueAt: date("due_at").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    linkedMilestoneId: uuid("linked_milestone_id").references(() => clientPaymentMilestones.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_bill_installments_bill_id_idx").on(table.billId),
    index("client_bill_installments_status_idx").on(table.status),
    index("client_bill_installments_due_at_idx").on(table.dueAt),
  ]
);

// ── Virtual Payment Sessions (QR & Checkout token) ───────────────
export const virtualPaymentSessions = pgTable(
  "virtual_payment_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: text("session_token").unique().notNull(),
    billId: uuid("bill_id")
      .references(() => clientBills.id, { onDelete: "cascade" })
      .notNull(),
    paymentType: virtualPaymentTypeEnum("payment_type").notNull(),
    installmentId: uuid("installment_id").references(() => clientBillInstallments.id),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    status: virtualPaymentSessionStatusEnum("status").default("PENDING").notNull(),
    qrPayload: text("qr_payload").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("v_pay_sessions_token_idx").on(table.sessionToken),
    index("v_pay_sessions_bill_id_idx").on(table.billId),
    index("v_pay_sessions_status_idx").on(table.status),
  ]
);

// ── Virtual Payment Transactions ──────────────────────────────────
export const virtualPaymentTransactions = pgTable(
  "virtual_payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => virtualPaymentSessions.id),
    billId: uuid("bill_id")
      .references(() => clientBills.id)
      .notNull(),
    virtualUtr: text("virtual_utr").unique().notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    payerVpa: text("payer_vpa").notNull(),
    payerName: text("payer_name"),
    paymentType: virtualPaymentTypeEnum("payment_type").notNull(),
    idempotencyKey: text("idempotency_key").unique().notNull(),
    isSimulation: boolean("is_simulation").default(true).notNull(),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("v_pay_tx_session_id_idx").on(table.sessionId),
    index("v_pay_tx_bill_id_idx").on(table.billId),
    index("v_pay_tx_utr_idx").on(table.virtualUtr),
    index("v_pay_tx_idempotency_idx").on(table.idempotencyKey),
  ]
);

// ── Virtual Payment Allocations (Audit of installment settlement) ──
export const virtualPaymentAllocations = pgTable(
  "virtual_payment_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id")
      .references(() => virtualPaymentTransactions.id, { onDelete: "cascade" })
      .notNull(),
    installmentId: uuid("installment_id")
      .references(() => clientBillInstallments.id)
      .notNull(),
    amountPaise: bigint("amount_paise", { mode: "bigint" }).notNull(),
    previousInstallmentStatus: text("previous_installment_status").notNull(),
    newInstallmentStatus: text("new_installment_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("v_pay_alloc_tx_id_idx").on(table.transactionId),
    index("v_pay_alloc_installment_id_idx").on(table.installmentId),
  ]
);
