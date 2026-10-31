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

// ==========================================
// Milestone 5: Interactive Dashboard & Scenario Types
// ==========================================

export type ComparisonScenarioType =
  | "balanced"
  | "lowest_cost"
  | "service_coverage"
  | "commercial_safety"
  | "custom";

export interface ScenarioDefinition {
  id: ComparisonScenarioType;
  label: string;
  description: string;
  weights: ComparisonWeights;
}

export const SCENARIO_PRESETS: Record<ComparisonScenarioType, ScenarioDefinition> = {
  balanced: {
    id: "balanced",
    label: "Best Overall Value (Default)",
    description: "Balanced commercial evaluation across cost, deliverables, contract terms, and audit integrity.",
    weights: DEFAULT_COMPARISON_WEIGHTS,
  },
  lowest_cost: {
    id: "lowest_cost",
    label: "Lowest Quoted Cost",
    description: "Emphasizes strict price competitiveness (60% cost weight) for budget-sensitive clients.",
    weights: {
      costCompetitiveness: 60,
      serviceCoverage: 15,
      commercialTerms: 10,
      qualityAndPortfolio: 5,
      pastPerformance: 5,
      transparency: 5,
    },
  },
  service_coverage: {
    id: "service_coverage",
    label: "Comprehensive Service Coverage",
    description: "Prioritizes extensive inclusions, tangible deliverables, and setup coverage (55% coverage weight).",
    weights: {
      costCompetitiveness: 15,
      serviceCoverage: 55,
      qualityAndPortfolio: 10,
      pastPerformance: 10,
      commercialTerms: 5,
      transparency: 5,
    },
  },
  commercial_safety: {
    id: "commercial_safety",
    label: "Strongest Terms & Audit Integrity",
    description: "Minimizes financial and cancellation risks (40% terms, 25% audit integrity, low advance required).",
    weights: {
      costCompetitiveness: 20,
      serviceCoverage: 15,
      commercialTerms: 40,
      transparency: 25,
      qualityAndPortfolio: 0,
      pastPerformance: 0,
    },
  },
  custom: {
    id: "custom",
    label: "Custom Priority Model",
    description: "User-configured interactive weight distribution.",
    weights: DEFAULT_COMPARISON_WEIGHTS,
  },
};

export interface ScoreChartItem {
  vendorId: string;
  vendorName: string;
  totalScore: number;
  rank: number;
  isRecommended: boolean;
  costScore: number;
  coverageScore: number;
  termsScore: number;
  auditScore: number;
  qualityScore: number;
  pastPerfScore: number;
}

export interface CostChartItem {
  vendorId: string;
  vendorName: string;
  statedTotal: number;
  calculatedTotal: number;
  currency: string;
  isLowest: boolean;
  subtotal: number;
  taxes: number;
}

export interface CoverageChartItem {
  vendorId: string;
  vendorName: string;
  inclusionsCount: number;
  exclusionsCount: number;
  deliverablesCount: number;
}

export interface EvidenceDetailRecord {
  vendorId: string;
  vendorName: string;
  originalFileName: string;
  sourcePage: number;
  category: "line_item" | "inclusion" | "exclusion" | "payment" | "cancellation" | "math_audit";
  field: string;
  extractedValue: string;
  evidenceSnippet: string;
  isExplicit: boolean;
  auditStatus?: "VERIFIED" | "DISCREPANCY" | "UNAUDITED";
}
