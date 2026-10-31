import { eq, and, desc, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  vendorInvoices,
  vendorPaymentTransactions,
  weddingVendors,
  vendors,
  approvedExtras,
  users,
  auditLogs,
} from "@/lib/db/schema";
import {
  InvoiceReconciliationResult,
  InvoiceStatus,
  VendorInvoiceRecord,
  VendorPaymentTransactionRecord,
} from "../types";
import { formatINR } from "@/lib/money";
import { DuplicatePaymentError, NotFoundError } from "@/lib/errors";

export async function getInvoicesForWedding(
  weddingId: string,
  vendorId?: string
): Promise<VendorInvoiceRecord[]> {
  const query = db
    .select({
      id: vendorInvoices.id,
      weddingVendorId: vendorInvoices.weddingVendorId,
      weddingId: vendorInvoices.weddingId,
      vendorId: vendorInvoices.vendorId,
      vendorName: vendors.name,
      category: vendors.category,
      invoiceNumber: vendorInvoices.invoiceNumber,
      issueDate: vendorInvoices.issueDate,
      dueDate: vendorInvoices.dueDate,
      subtotalPaise: vendorInvoices.subtotalPaise,
      taxPaise: vendorInvoices.taxPaise,
      totalPaise: vendorInvoices.totalPaise,
      paidPaise: vendorInvoices.paidPaise,
      status: vendorInvoices.status,
      documentUrl: vendorInvoices.documentUrl,
      notes: vendorInvoices.notes,
      isReconciled: vendorInvoices.isReconciled,
      reconciledAt: vendorInvoices.reconciledAt,
      reconciledByName: users.name,
      reconciliationNotes: vendorInvoices.reconciliationNotes,
    })
    .from(vendorInvoices)
    .innerJoin(vendors, eq(vendorInvoices.vendorId, vendors.id))
    .leftJoin(users, eq(vendorInvoices.reconciledBy, users.id));

  const rows = vendorId
    ? await query.where(
        and(
          eq(vendorInvoices.weddingId, weddingId),
          eq(vendorInvoices.vendorId, vendorId)
        )
      )
    : await query.where(eq(vendorInvoices.weddingId, weddingId));

  return rows.map((r) => ({
    ...r,
    status: r.status as InvoiceStatus,
    remainingPayablePaise:
      r.totalPaise > r.paidPaise ? r.totalPaise - r.paidPaise : 0n,
  }));
}

export async function getVendorPaymentsForWedding(
  weddingId: string
): Promise<VendorPaymentTransactionRecord[]> {
  const rows = await db
    .select({
      id: vendorPaymentTransactions.id,
      invoiceId: vendorPaymentTransactions.invoiceId,
      invoiceNumber: vendorInvoices.invoiceNumber,
      weddingVendorId: vendorPaymentTransactions.weddingVendorId,
      weddingId: vendorPaymentTransactions.weddingId,
      amountPaise: vendorPaymentTransactions.amountPaise,
      paidAt: vendorPaymentTransactions.paidAt,
      paymentMethod: vendorPaymentTransactions.paymentMethod,
      reference: vendorPaymentTransactions.reference,
      idempotencyKey: vendorPaymentTransactions.idempotencyKey,
      recordedByName: users.name,
      notes: vendorPaymentTransactions.notes,
      createdAt: vendorPaymentTransactions.createdAt,
    })
    .from(vendorPaymentTransactions)
    .innerJoin(
      vendorInvoices,
      eq(vendorPaymentTransactions.invoiceId, vendorInvoices.id)
    )
    .leftJoin(users, eq(vendorPaymentTransactions.recordedBy, users.id))
    .where(eq(vendorPaymentTransactions.weddingId, weddingId))
    .orderBy(desc(vendorPaymentTransactions.paidAt));

  return rows;
}

export async function createVendorInvoice(data: {
  weddingVendorId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotalPaise: bigint;
  taxPaise?: bigint;
  totalPaise: bigint;
  documentUrl?: string | null;
  notes?: string | null;
}) {
  const [wv] = await db
    .select({
      id: weddingVendors.id,
      weddingId: weddingVendors.weddingId,
      vendorId: weddingVendors.vendorId,
    })
    .from(weddingVendors)
    .where(eq(weddingVendors.id, data.weddingVendorId))
    .limit(1);

  if (!wv) {
    throw new NotFoundError(
      `Wedding vendor assignment ${data.weddingVendorId} not found`
    );
  }

  const [invoice] = await db
    .insert(vendorInvoices)
    .values({
      weddingVendorId: wv.id,
      weddingId: wv.weddingId,
      vendorId: wv.vendorId,
      invoiceNumber: data.invoiceNumber,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      subtotalPaise: data.subtotalPaise,
      taxPaise: data.taxPaise || 0n,
      totalPaise: data.totalPaise,
      documentUrl: data.documentUrl,
      notes: data.notes,
      status: "SENT",
    })
    .returning();

  return invoice;
}

/**
 * Reconciles vendor invoice against contracted amounts and approved extras.
 * Strict invariant: Never auto-approves unexplained positive variance.
 */
export async function reconcileVendorInvoice(
  invoiceId: string,
  actorId?: string,
  options?: {
    approvedExtrasAllowed?: boolean;
    reconciliationNotes?: string | null;
  }
): Promise<InvoiceReconciliationResult> {
  const [invoice] = await db
    .select({
      id: vendorInvoices.id,
      weddingVendorId: vendorInvoices.weddingVendorId,
      weddingId: vendorInvoices.weddingId,
      vendorId: vendorInvoices.vendorId,
      vendorName: vendors.name,
      invoiceNumber: vendorInvoices.invoiceNumber,
      totalPaise: vendorInvoices.totalPaise,
      paidPaise: vendorInvoices.paidPaise,
      contractAmountPaise: weddingVendors.contractAmountPaise,
    })
    .from(vendorInvoices)
    .innerJoin(
      weddingVendors,
      eq(vendorInvoices.weddingVendorId, weddingVendors.id)
    )
    .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .where(eq(vendorInvoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    throw new NotFoundError(`Vendor invoice ${invoiceId} not found`);
  }

  // Fetch approved extras for this wedding vendor assignment
  const extras = await db
    .select({ vendorCostPaise: approvedExtras.vendorCostPaise })
    .from(approvedExtras)
    .where(
      and(
        eq(approvedExtras.weddingVendorId, invoice.weddingVendorId),
        eq(approvedExtras.status, "APPROVED")
      )
    );

  const extrasAllowed = options?.approvedExtrasAllowed ?? true;
  const approvedExtrasPaise = extrasAllowed
    ? extras.reduce((sum, e) => sum + e.vendorCostPaise, 0n)
    : 0n;

  const contractAmountPaise = invoice.contractAmountPaise || 0n;
  const totalApprovedCommitmentPaise =
    contractAmountPaise + approvedExtrasPaise;
  const invoicedTotalPaise = invoice.totalPaise;
  const variancePaise = invoicedTotalPaise - totalApprovedCommitmentPaise;

  let varianceStatus: InvoiceReconciliationResult["varianceStatus"] =
    "EXACT_MATCH";
  let requiresFinanceApproval = false;
  let explanation = "";

  if (variancePaise === 0n) {
    varianceStatus = "EXACT_MATCH";
    explanation =
      "Invoice amount matches approved contract commitments exactly (₹0 variance).";
  } else if (variancePaise < 0n) {
    varianceStatus = "UNDER_BUDGET";
    const savings = formatINR(-variancePaise);
    explanation = `Favorable variance: Invoiced total is ${savings} below committed contract budget.`;
  } else {
    varianceStatus = "OVER_BUDGET";
    requiresFinanceApproval = true;
    const overrun = formatINR(variancePaise);
    explanation = `Overrun detected: Invoice exceeds total approved commitments by ${overrun}. Unexplained variance requires explicit approval by Finance/Planner before disbursement.`;
  }

  const customNotes = options?.reconciliationNotes
    ? `\nCoordinator Note: ${options.reconciliationNotes}`
    : "";
  const fullReconciliationText = `${explanation}${customNotes}`;

  const remainingPayablePaise =
    invoicedTotalPaise > invoice.paidPaise
      ? invoicedTotalPaise - invoice.paidPaise
      : 0n;

  const variancePercentage =
    totalApprovedCommitmentPaise > 0n
      ? Number((variancePaise * 10000n) / totalApprovedCommitmentPaise) / 100
      : 0;

  // Persist reconciliation state
  const now = new Date();
  await db
    .update(vendorInvoices)
    .set({
      isReconciled: true,
      reconciledAt: now,
      reconciledBy: actorId,
      reconciliationNotes: fullReconciliationText,
      updatedAt: now,
    })
    .where(eq(vendorInvoices.id, invoice.id));

  // Audit log
  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      entityType: "vendor_invoices",
      entityId: invoice.id,
      action: "INVOICE_RECONCILED",
      newValue: {
        invoiceNumber: invoice.invoiceNumber,
        contractAmountPaise: contractAmountPaise.toString(),
        approvedExtrasPaise: approvedExtrasPaise.toString(),
        invoicedTotalPaise: invoicedTotalPaise.toString(),
        variancePaise: variancePaise.toString(),
        varianceStatus,
      },
      reason: fullReconciliationText,
      occurredAt: now,
    });
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    vendorName: invoice.vendorName,
    contractAmountPaise,
    approvedExtrasPaise,
    totalApprovedCommitmentPaise,
    invoicedTotalPaise,
    paidToDatePaise: invoice.paidPaise,
    remainingPayablePaise,
    variancePaise,
    varianceStatus,
    variancePercentage,
    explanation: fullReconciliationText,
    requiresFinanceApproval,
  };
}

export async function recordVendorPayment(
  data: {
    invoiceId: string;
    amountPaise: bigint;
    paidAt: string;
    paymentMethod: string;
    reference: string;
    idempotencyKey: string;
    allowBusinessDuplicate?: boolean;
    notes?: string | null;
  },
  actorId?: string
): Promise<VendorPaymentTransactionRecord> {
  // 1. Exact Idempotency Check: Retry returns existing transaction
  const [existingIdempotent] = await db
    .select({
      id: vendorPaymentTransactions.id,
      invoiceId: vendorPaymentTransactions.invoiceId,
      invoiceNumber: vendorInvoices.invoiceNumber,
      weddingVendorId: vendorPaymentTransactions.weddingVendorId,
      weddingId: vendorPaymentTransactions.weddingId,
      amountPaise: vendorPaymentTransactions.amountPaise,
      paidAt: vendorPaymentTransactions.paidAt,
      paymentMethod: vendorPaymentTransactions.paymentMethod,
      reference: vendorPaymentTransactions.reference,
      idempotencyKey: vendorPaymentTransactions.idempotencyKey,
      notes: vendorPaymentTransactions.notes,
      createdAt: vendorPaymentTransactions.createdAt,
    })
    .from(vendorPaymentTransactions)
    .innerJoin(
      vendorInvoices,
      eq(vendorPaymentTransactions.invoiceId, vendorInvoices.id)
    )
    .where(eq(vendorPaymentTransactions.idempotencyKey, data.idempotencyKey))
    .limit(1);

  if (existingIdempotent) {
    return existingIdempotent;
  }

  // 2. Fetch invoice
  const [invoice] = await db
    .select()
    .from(vendorInvoices)
    .where(eq(vendorInvoices.id, data.invoiceId))
    .limit(1);

  if (!invoice) {
    throw new NotFoundError(`Vendor invoice ${data.invoiceId} not found`);
  }

  // 3. Business Duplicate Heuristic: check if same invoice + amount was paid within last 24h
  if (!data.allowBusinessDuplicate) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDuplicates = await db
      .select({ id: vendorPaymentTransactions.id })
      .from(vendorPaymentTransactions)
      .where(
        and(
          eq(vendorPaymentTransactions.invoiceId, data.invoiceId),
          eq(vendorPaymentTransactions.amountPaise, data.amountPaise),
          gt(vendorPaymentTransactions.createdAt, oneDayAgo)
        )
      )
      .limit(1);

    if (recentDuplicates.length > 0) {
      throw new DuplicatePaymentError(
        `Potential duplicate disbursement: A vendor payment of identical amount was recorded within the last 24 hours (Transaction ${recentDuplicates[0].id}). Confirm legitimate installment or provide explicit authorization.`,
        recentDuplicates[0].id
      );
    }
  }

  // 4. Atomic Execution: Insert disbursement, update invoice paid, write audit log
  return await db.transaction(async (tx) => {
    const paidAtDate = new Date(data.paidAt);

    const [disbursement] = await tx
      .insert(vendorPaymentTransactions)
      .values({
        invoiceId: invoice.id,
        weddingVendorId: invoice.weddingVendorId,
        weddingId: invoice.weddingId,
        amountPaise: data.amountPaise,
        paidAt: paidAtDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        idempotencyKey: data.idempotencyKey,
        recordedBy: actorId,
        notes: data.notes,
      })
      .returning();

    const newPaidPaise = invoice.paidPaise + data.amountPaise;
    const newStatus: InvoiceStatus =
      newPaidPaise >= invoice.totalPaise ? "PAID" : "SENT";

    await tx
      .update(vendorInvoices)
      .set({
        paidPaise: newPaidPaise,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(vendorInvoices.id, invoice.id));

    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        entityType: "vendor_payment_transactions",
        entityId: disbursement.id,
        action: "VENDOR_DISBURSEMENT_RECORDED",
        oldValue: {
          paidPaise: invoice.paidPaise.toString(),
          status: invoice.status,
        },
        newValue: {
          transactionId: disbursement.id,
          amountPaise: data.amountPaise.toString(),
          newPaidPaise: newPaidPaise.toString(),
          status: newStatus,
          reference: data.reference,
          idempotencyKey: data.idempotencyKey,
        },
        reason: `Vendor disbursement recorded for invoice '${invoice.invoiceNumber}'`,
        occurredAt: new Date(),
      });
    }

    return {
      ...disbursement,
      invoiceNumber: invoice.invoiceNumber,
    };
  });
}
