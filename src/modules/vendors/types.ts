import {
  vendorCategoryEnum,
  quoteRequestStatusEnum,
  quoteStatusEnum,
  inclusionStatusEnum,
} from "@/lib/db/schema/enums";

export type VendorCategory = (typeof vendorCategoryEnum.enumValues)[number];
export type QuoteRequestStatus =
  (typeof quoteRequestStatusEnum.enumValues)[number];
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type InclusionStatus = (typeof inclusionStatusEnum.enumValues)[number];

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  serviceArea: string[] | null;
  description: string | null;
  isActive: boolean;
  averageRating: string | null;
  totalWeddings: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface QuoteRequest {
  id: string;
  weddingId: string;
  category: VendorCategory;
  title: string;
  description: string | null;
  targetBudgetPaise: bigint | null;
  deadline: Date | null;
  status: QuoteRequestStatus;
  selectedQuoteId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  unitPricePaise: bigint | null;
  fixedChargePaise: bigint | null;
  isPerGuest: boolean;
  taxPercent: string;
  serviceChargePercent: string;
  inclusionStatus: InclusionStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  quoteRequestId: string;
  vendorId: string;
  status: QuoteStatus;
  submittedAt: Date | null;
  validUntil: Date | null;
  currency: string;
  rawDocumentUrl: string | null;
  rawDocumentName: string | null;
  rawDocumentText: string | null;
  extractionStatus: string;
  confidenceScore: string | null;
  extractionNotes: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  basePricePaise: bigint | null;
  travelFeePaise: bigint | null;
  overtimeHourlyRatePaise: bigint | null;
  taxRule: string;
  serviceChargeRule: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  vendor?: Vendor;
  items?: QuoteItem[];
}

export interface LandedCostScenario {
  guestCount: number;
  overtimeHours?: number;
}

export interface ItemCostBreakdown {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPricePaise: bigint;
  fixedChargePaise: bigint;
  isPerGuest: boolean;
  subtotalPaise: bigint;
  serviceChargePaise: bigint;
  taxPaise: bigint;
  totalPaise: bigint;
  inclusionStatus: InclusionStatus;
  effectivePerGuestPaise: bigint;
}

export interface LandedCostResult {
  quoteId: string;
  vendorId: string;
  vendorName: string;
  guestCount: number;
  itemsSubtotalPaise: bigint;
  totalServiceChargePaise: bigint;
  totalTaxPaise: bigint;
  travelFeePaise: bigint;
  overtimePaise: bigint;
  overtimeHours: number;
  totalLandedCostPaise: bigint;
  costPerGuestPaise: bigint;
  itemBreakdowns: ItemCostBreakdown[];
  assumptions: string[];
}

export interface InclusionGap {
  itemName: string;
  category: string;
  statusByQuote: Record<string, InclusionStatus>;
  riskDescription: string;
}

export interface ScoringWeights {
  cost: number;        // e.g. 0.40 (40%)
  reliability: number; // e.g. 0.25 (25%)
  quality: number;     // e.g. 0.20 (20%)
  inclusions: number;  // e.g. 0.15 (15%)
}

export interface QuoteScoreBreakdown {
  quoteId: string;
  vendorId: string;
  vendorName: string;
  costScore: number;         // 0 - 100
  reliabilityScore: number;  // 0 - 100
  qualityScore: number;      // 0 - 100
  inclusionsScore: number;   // 0 - 100
  compositeScore: number;    // 0 - 100 weighted
  landedCostPaise: bigint;
  rank: number;
  highlights: string[];
  flags: string[];
}

export interface MultiQuoteComparison {
  quoteRequestId: string;
  weddingId: string;
  category: VendorCategory;
  scenario: LandedCostScenario;
  weights: ScoringWeights;
  quotes: LandedCostResult[];
  scores: QuoteScoreBreakdown[];
  inclusionGaps: InclusionGap[];
}

export interface ExtractionResult {
  confidenceScore: number;
  rawText: string;
  suggestedBasePricePaise: bigint;
  suggestedTravelFeePaise: bigint;
  suggestedTaxRule: string;
  suggestedServiceChargeRule: string;
  notes: string;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPricePaise: bigint;
    fixedChargePaise: bigint;
    isPerGuest: boolean;
    taxPercent: number;
    serviceChargePercent: number;
    inclusionStatus: InclusionStatus;
    notes?: string;
    confidence: number;
  }>;
  requiresReview: boolean;
}

