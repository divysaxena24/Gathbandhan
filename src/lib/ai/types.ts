export interface EvidenceRecord<T> {
  value: T;
  sourcePage: number | null;
  evidenceSnippet: string | null;
  isExplicit: boolean; // true = explicitly found in document, false = inferred/ambiguous
}

export interface ExtractedLineItem {
  description: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  statedAmount: number | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
  isExplicit: boolean;
}

export interface ExtractedTaxItem {
  description: string;
  ratePercent: number | null;
  statedAmount: number | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
}

export interface ExtractedDiscountItem {
  description: string;
  statedAmount: number | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
}

export interface ExtractedChargeItem {
  description: string;
  statedAmount: number | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
}

export interface PaymentScheduleItem {
  milestone: string;
  percentage: number | null;
  statedAmount: number | null;
  dueDate: string | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
}

export interface ExtractedVendorDetails {
  vendorName: string | null;
  category: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  website: string | null;
  quotationNumber: string | null;
  quotationDate: string | null;
  validityDate: string | null;
  sourcePage: number | null;
  evidenceSnippet: string | null;
}

export interface ExtractedServiceDetails {
  servicesIncluded: Array<{ text: string; sourcePage: number | null; evidence: string | null }>;
  servicesExcluded: Array<{ text: string; sourcePage: number | null; evidence: string | null }>;
  deliverables: Array<{ text: string; sourcePage: number | null; evidence: string | null }>;
  guestLimit: number | null;
  eventDates: string[] | null;
  coverageHours: number | null;
  setupDetails: string | null;
  dismantlingDetails: string | null;
  overtimeCharges: string | null;
  optionalAddons: Array<{
    name: string;
    price: number | null;
    description: string | null;
    sourcePage: number | null;
  }>;
}

export interface ExtractedCommercialDetails {
  currency: string | null;
  lineItems: ExtractedLineItem[];
  statedSubtotal: number | null;
  discounts: ExtractedDiscountItem[];
  totalDiscount: number | null;
  taxes: ExtractedTaxItem[];
  totalTax: number | null;
  additionalCharges: ExtractedChargeItem[];
  statedGrandTotal: number | null;
  paymentSchedule: PaymentScheduleItem[];
  advancePayment: {
    percentage: number | null;
    amount: number | null;
    terms: string | null;
    sourcePage: number | null;
  } | null;
  cancellationTerms: string | null;
  refundTerms: string | null;
  specialConditions: string[];
}

export interface LineItemAudit {
  itemIndex: number;
  description: string;
  quantity: number;
  unitPrice: number;
  expectedAmount: number; // quantity * unitPrice
  statedAmount: number;
  discrepancy: number; // statedAmount - expectedAmount
  isMismatch: boolean;
}

export interface FinancialAuditResult {
  isValid: boolean;
  statedSubtotal: number | null;
  calculatedSubtotal: number | null;
  subtotalDiscrepancy: number | null;
  subtotalMatches: boolean;

  statedGrandTotal: number | null;
  calculatedGrandTotal: number | null;
  grandTotalDiscrepancy: number | null;
  grandTotalMatches: boolean;

  lineItemAudits: LineItemAudit[];
  hasLineItemDiscrepancies: boolean;

  discrepancyFlags: Array<{
    type: "LINE_ITEM_MATH" | "SUBTOTAL_MISMATCH" | "GRAND_TOTAL_MISMATCH" | "MISSING_STATED_TOTAL" | "TAX_MISMATCH";
    severity: "critical" | "warning" | "info";
    message: string;
    difference?: number;
  }>;
  missingInformationFlags: string[];
  taxCalculations?: any[];
  auditTimestamp?: string;
}

export interface QuotationAnalysisResult {
  success: boolean;
  uploadId: string;
  originalName: string;
  analyzedAt: string;
  modelUsed: string;
  vendorDetails: ExtractedVendorDetails;
  commercialDetails: ExtractedCommercialDetails;
  serviceDetails: ExtractedServiceDetails;
  financialAudit: FinancialAuditResult;
  sourcePageCount: number;
  conflictsAndWarnings: string[];
  missingFields: string[];
  error: string | null;
  meta?: {
    uploadId: string;
    originalName?: string;
    originalFileName?: string;
    extractedAt?: string;
    pageCount?: number;
    [key: string]: any;
  };
}
