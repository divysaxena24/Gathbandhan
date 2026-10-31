export type PaymentMethod =
  | "NEFT"
  | "RTGS"
  | "IMPS"
  | "UPI"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "CASH";

export type MilestoneStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "DISPUTED"
  | "PAID"
  | "CANCELLED";

export interface ClientPaymentMilestoneRecord {
  id: string;
  weddingId: string;
  title: string;
  percentage: string | null;
  amountPaise: bigint;
  paidPaise: bigint;
  remainingPaise: bigint;
  dueAt: string;
  status: MilestoneStatus;
  orderIndex: number;
  notes: string | null;
}

export interface ClientPaymentTransactionRecord {
  id: string;
  milestoneId: string;
  milestoneTitle?: string | null;
  weddingId: string;
  amountPaise: bigint;
  paidAt: Date;
  paymentMethod: string;
  reference: string;
  idempotencyKey: string;
  recordedBy: string | null;
  recordedByName?: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface VendorInvoiceRecord {
  id: string;
  weddingVendorId: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  category: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotalPaise: bigint;
  taxPaise: bigint;
  totalPaise: bigint;
  paidPaise: bigint;
  remainingPayablePaise: bigint;
  status: InvoiceStatus;
  documentUrl: string | null;
  notes: string | null;
  isReconciled: boolean;
  reconciledAt: Date | null;
  reconciledByName?: string | null;
  reconciliationNotes: string | null;
}

export interface VendorPaymentTransactionRecord {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  weddingVendorId: string;
  vendorName?: string;
  weddingId: string;
  amountPaise: bigint;
  paidAt: Date;
  paymentMethod: string;
  reference: string;
  idempotencyKey: string;
  recordedByName?: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface ExpenseRecord {
  id: string;
  weddingId: string;
  title: string;
  category: string;
  amountPaise: bigint;
  incurredAt: Date;
  vendorId: string | null;
  vendorName?: string | null;
  billableToClient: boolean;
  isApproved: boolean;
  approvedByName?: string | null;
  approvedAt: Date | null;
  receiptUrl: string | null;
  notes: string | null;
}

export interface ApprovedExtraRecord {
  id: string;
  weddingId: string;
  weddingVendorId: string | null;
  vendorName?: string | null;
  title: string;
  description: string | null;
  category: string;
  unitRatePaise: bigint;
  quantity: number;
  vendorCostPaise: bigint;
  clientAmountPaise: bigint;
  billableToClient: boolean;
  status: string; // PENDING_APPROVAL, APPROVED, BILLED, REJECTED
  approvedByName?: string | null;
  approvedAt: Date | null;
}

export interface InvoiceReconciliationResult {
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  contractAmountPaise: bigint;
  approvedExtrasPaise: bigint;
  totalApprovedCommitmentPaise: bigint;
  invoicedTotalPaise: bigint;
  paidToDatePaise: bigint;
  remainingPayablePaise: bigint;
  variancePaise: bigint;
  varianceStatus: "EXACT_MATCH" | "UNDER_BUDGET" | "OVER_BUDGET";
  variancePercentage: number;
  explanation: string;
  requiresFinanceApproval: boolean;
}

export interface CategoryFinancials {
  category: string;
  committedPaise: bigint;
  invoicedPaise: bigint;
  paidPaise: bigint;
}

export interface WeddingProfitability {
  weddingId: string;
  contractedRevenuePaise: bigint;
  collectedRevenuePaise: bigint;
  pendingReceivablesPaise: bigint;
  committedVendorCostsPaise: bigint;
  actualInvoicedCostsPaise: bigint;
  paidToVendorsPaise: bigint;
  pendingPayablesPaise: bigint;
  approvedExpensesPaise: bigint;
  totalProjectedCostsPaise: bigint;
  totalActualCostsPaise: bigint;
  projectedProfitPaise: bigint;
  projectedMarginPercentage: number;
  realizedProfitPaise: bigint;
  realizedMarginPercentage: number;
  categoryBreakdown: CategoryFinancials[];
  asOf: string;
}
