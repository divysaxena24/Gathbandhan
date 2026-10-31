/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { QuotationAnalysisResult } from "./types";

export interface ComparisonWeights {
  costCompetitiveness: number; // default 30%
  serviceCoverage: number; // default 25%
  qualityAndPortfolio: number; // default 15%
  pastPerformance: number; // default 15%
  commercialTerms: number; // default 10%
  transparency: number; // default 5%
}

export const DEFAULT_COMPARISON_WEIGHTS: ComparisonWeights = {
  costCompetitiveness: 30,
  serviceCoverage: 25,
  qualityAndPortfolio: 15,
  pastPerformance: 15,
  commercialTerms: 10,
  transparency: 5,
};

export interface CriterionScore {
  name: string;
  key: keyof ComparisonWeights;
  rawScore: number | null; // 0-100 or null if unavailable
  normalizedScore: number; // 0-100
  weight: number; // Initial weight %
  adjustedWeight: number; // Re-normalized weight % if some criteria are unavailable
  weightedScore: number; // normalizedScore * (adjustedWeight / 100)
  isAvailable: boolean;
  evidenceNotes: string; // Explanatory provenance
  dataPoints: Record<string, any>;
}

export interface VendorScoringBreakdown {
  uploadId: string;
  vendorName: string;
  criteria: Record<keyof ComparisonWeights, CriterionScore>;
  totalScore: number; // 0 - 100
  rank: number;
  availableCriteriaCount: number;
  effectiveWeightsSummary: Record<keyof ComparisonWeights, number>;
}

export interface ComparedVendorSummary {
  uploadId: string;
  originalName: string;
  vendorName: string;
  category: string;
  statedGrandTotal: number | null;
  calculatedGrandTotal: number | null;
  currency: string;
  lineItemCount: number;
  inclusionsCount: number;
  exclusionsCount: number;
  financialAuditStatus: "MATCHED" | "DISCREPANCY" | "UNAUDITED";
  discrepancyCount: number;
  advancePaymentPercent: number | null;
  advancePaymentAmount: number | null;
  cancellationSummary: string | null;
  refundSummary: string | null;
  overtimeCharges: string | null;
  paymentScheduleMilestones: number;
  pros: string[];
  cons: string[];
  missingInfoAlerts: string[];
  hiddenChargeAlerts: string[];
  qualityEvidence: string | null;
  pastPerformanceEvidence: string | null;
}

export interface ComparisonMatrixRow {
  criterion: string;
  category: "commercial" | "scope" | "terms" | "financial_audit" | "quality";
  values: Record<string, string | number | null | boolean>; // Keyed by uploadId
  highlightBest?: string; // uploadId of best vendor for this row
  notes?: string;
}

export interface VendorRecommendation {
  recommendedVendorId: string;
  recommendedVendorName: string;
  isProvisional: boolean;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  headline: string;
  executiveSummary: string;
  majorAdvantages: string[];
  commercialDisadvantages: string[];
  financialAuditAssessment: {
    status: "VERIFIED" | "WARNING" | "UNCHECKED";
    details: string;
  };
  criticalUncertainties: string[];
  questionsToClarifyBeforeSigning: string[];
  advisoryNotice: string;
}

export interface MultiVendorComparisonResult {
  success: boolean;
  comparisonId: string;
  comparedAt: string;
  vendors: ComparedVendorSummary[];
  scoring: {
    weights: ComparisonWeights;
    methodologyDescription: string;
    vendorScores: Record<string, VendorScoringBreakdown>;
    rankings: Array<{
      uploadId: string;
      vendorName: string;
      totalScore: number;
      rank: number;
    }>;
  };
  matrix: ComparisonMatrixRow[];
  categoryCompatibility: {
    isCompatible: boolean;
    primaryCategory: string;
    detectedCategories: string[];
    warningMessage?: string;
  };
  currencyCompatibility: {
    isCompatible: boolean;
    primaryCurrency: string;
    detectedCurrencies: string[];
    warningMessage?: string;
  };
  alerts: {
    financialDiscrepancies: Array<{
      vendorName: string;
      message: string;
      severity: "critical" | "warning";
    }>;
    hiddenCharges: Array<{
      vendorName: string;
      description: string;
      amount: number | null;
    }>;
    missingCriticalInfo: Array<{
      vendorName: string;
      missingItems: string[];
    }>;
  };
  recommendation: VendorRecommendation;
  error?: string | null;
}

export interface CompareApiRequest {
  uploadIds: string[];
  weights?: Partial<ComparisonWeights>;
}
