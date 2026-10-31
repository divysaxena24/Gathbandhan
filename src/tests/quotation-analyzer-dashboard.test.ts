import { describe, it, expect, beforeEach } from "vitest";
import {
  prepareScoreChartData,
  prepareCostChartData,
  prepareCoverageChartData,
  extractAllEvidenceRecords,
  findEvidenceRecords,
  simulateComparisonScenario,
  compareAnalyzedQuotations,
} from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import {
  DEFAULT_COMPARISON_WEIGHTS,
  SCENARIO_PRESETS,
  ComparisonScenarioType,
} from "@/lib/ai/comparison-types";

function createMockAnalysis(params: {
  uploadId: string;
  vendorName: string;
  category?: string;
  currency?: string;
  grandTotal?: number;
  calculatedTotal?: number;
  lineItemsCount?: number;
  inclusionsCount?: number;
  deliverablesCount?: number;
  exclusionsCount?: number;
  advancePercentage?: number | null;
  cancellationTerms?: string | null;
  isMathValid?: boolean;
  discrepanciesCount?: number;
}): QuotationAnalysisResult {
  const lineItems = Array.from({ length: params.lineItemsCount ?? 4 }, (_, i) => ({
    description: `Service Item ${i + 1}`,
    quantity: 1,
    unit: "unit",
    unitPrice: 25000,
    statedAmount: 25000,
    sourcePage: 1,
    evidenceSnippet: `Item ${i + 1} - 25000`,
    isExplicit: true,
  }));

  const inclusions = Array.from({ length: params.inclusionsCount ?? 5 }, (_, i) => ({
    text: `Included Benefit ${i + 1}`,
    sourcePage: 1,
    evidence: `Benefit ${i + 1} confirmed in quotation`,
  }));

  const deliverables = Array.from({ length: params.deliverablesCount ?? 3 }, (_, i) => ({
    text: `Physical Deliverable ${i + 1}`,
    sourcePage: 2,
    evidence: `Deliverable ${i + 1} delivered on event day`,
  }));

  const exclusions = Array.from({ length: params.exclusionsCount ?? 2 }, (_, i) => ({
    text: `Excluded Cost ${i + 1}`,
    sourcePage: 2,
    evidence: `Not covered: ${i + 1}`,
  }));

  const discrepancyFlags = Array.from({ length: params.discrepanciesCount ?? 0 }, (_, i) => ({
    type: "SUBTOTAL_MISMATCH" as const,
    severity: "warning" as const,
    message: `Discrepancy ${i + 1} found`,
    difference: 5000,
  }));

  return {
    success: true,
    uploadId: params.uploadId,
    originalName: `${params.vendorName.replace(/\s+/g, "_")}.pdf`,
    analyzedAt: new Date().toISOString(),
    modelUsed: "openai/gpt-oss-120b",
    vendorDetails: {
      vendorName: params.vendorName,
      category: params.category ?? "Wedding Catering",
      contactPhone: "+91 9876543210",
      contactEmail: "info@vendor.com",
      address: "Mumbai, India",
      website: "https://vendor.com",
      quotationNumber: `QT-${params.uploadId}`,
      quotationDate: "2026-10-15",
      validityDate: "2026-11-15",
      sourcePage: 1,
      evidenceSnippet: "Serving weddings with 15 years experience",
    },
    commercialDetails: {
      currency: params.currency ?? "INR",
      lineItems,
      statedSubtotal: params.grandTotal ?? 100000,
      discounts: [],
      totalDiscount: 0,
      taxes: [
        {
          description: "GST",
          ratePercent: 5,
          statedAmount: (params.grandTotal ?? 100000) * 0.05,
          sourcePage: 1,
          evidenceSnippet: "5% GST included",
        },
      ],
      totalTax: (params.grandTotal ?? 100000) * 0.05,
      additionalCharges: [],
      statedGrandTotal: params.grandTotal ?? 105000,
      paymentSchedule: [
        {
          milestone: "Advance Deposit",
          percentage: params.advancePercentage ?? 25,
          statedAmount: 25000,
          dueDate: "Upon signing",
          sourcePage: 2,
          evidenceSnippet: "25% advance on contract execution",
        },
        {
          milestone: "Final Settlement",
          percentage: 75,
          statedAmount: 75000,
          dueDate: "1 week prior to event",
          sourcePage: 2,
          evidenceSnippet: "Remaining 75% due 7 days before event",
        },
      ],
      advancePayment: {
        percentage: params.advancePercentage ?? 25,
        amount: 25000,
        terms: "Advance deposit required",
        sourcePage: 2,
      },
      cancellationTerms: params.cancellationTerms ?? "100% refund prior to 30 days, non-refundable deposit inside 14 days",
      refundTerms: "Refund processed within 7 business days",
      specialConditions: [],
    },
    serviceDetails: {
      servicesIncluded: inclusions,
      servicesExcluded: exclusions,
      deliverables,
      guestLimit: 500,
      eventDates: ["2026-12-15"],
      coverageHours: 8,
      setupDetails: "Setup starts 4 hours prior",
      dismantlingDetails: "Dismantled within 2 hours",
      overtimeCharges: "Rs. 10,000 / hr beyond 8 hours",
      optionalAddons: [],
    },
    financialAudit: {
      isValid: params.isMathValid ?? true,
      statedGrandTotal: params.grandTotal ?? 100000,
      statedSubtotal: params.grandTotal ?? 100000,
      calculatedSubtotal: params.calculatedTotal ?? params.grandTotal ?? 100000,
      subtotalDiscrepancy: params.isMathValid === false ? 5000 : 0,
      subtotalMatches: params.isMathValid ?? true,
      hasLineItemDiscrepancies: false,
      missingInformationFlags: [],
      
      grandTotalMatches: params.isMathValid ?? true,
      calculatedGrandTotal: params.calculatedTotal ? params.calculatedTotal * 1.05 : (params.grandTotal ?? 100000) * 1.05,
      grandTotalDiscrepancy: params.isMathValid === false ? 5250 : 0,
      lineItemAudits: [],
      discrepancyFlags,
      auditTimestamp: new Date().toISOString(),
    },
    conflictsAndWarnings: [],
    sourcePageCount: 3,
    missingFields: [],
    error: null,
    meta: {
      uploadId: params.uploadId,
      originalFileName: `${params.vendorName.replace(/\s+/g, "_")}.pdf`,
      extractedAt: new Date().toISOString(),
      pageCount: 3,
    },
  };
}

describe("Milestone 5: Interactive Vendor Comparison Dashboard", () => {
  let mockVendorA: QuotationAnalysisResult;
  let mockVendorB: QuotationAnalysisResult;
  let mockVendorC: QuotationAnalysisResult;

  beforeEach(() => {
    // Vendor A: Royal Feast Caterers (High Coverage, Moderate Cost, Perfect Math)
    mockVendorA = createMockAnalysis({
      uploadId: "upl-001",
      vendorName: "Royal Feast Caterers",
      grandTotal: 120000,
      calculatedTotal: 120000,
      lineItemsCount: 8,
      inclusionsCount: 12,
      deliverablesCount: 4,
      exclusionsCount: 1,
      advancePercentage: 20,
      isMathValid: true,
      discrepanciesCount: 0,
    });

    // Vendor B: Budget Spice Caterers (Lowest Cost, Lower Coverage, 1 Math Warning)
    mockVendorB = createMockAnalysis({
      uploadId: "upl-002",
      vendorName: "Budget Spice Caterers",
      grandTotal: 85000,
      calculatedTotal: 90000,
      lineItemsCount: 4,
      inclusionsCount: 4,
      deliverablesCount: 1,
      exclusionsCount: 4,
      advancePercentage: 50,
      isMathValid: false,
      discrepanciesCount: 1,
    });

    // Vendor C: Maharaja Grand (Premium Quality, High Cost, Extensive Scope, Perfect Math)
    mockVendorC = createMockAnalysis({
      uploadId: "upl-003",
      vendorName: "Maharaja Grand Banquets",
      grandTotal: 250000,
      calculatedTotal: 250000,
      lineItemsCount: 15,
      inclusionsCount: 18,
      deliverablesCount: 6,
      exclusionsCount: 0,
      advancePercentage: 15,
      isMathValid: true,
      discrepanciesCount: 0,
    });
  });

  describe("1. Interactive Chart Data Preparation", () => {
    it("prepares accurate ScoreChartItem data from comparison result", async () => {
      const comparison = await compareAnalyzedQuotations([mockVendorA, mockVendorB, mockVendorC]);
      const scoreData = prepareScoreChartData(comparison);

      expect(scoreData).toHaveLength(3);
      expect(scoreData[0].rank).toBe(1);
      expect(scoreData[0].isRecommended).toBe(true);

      for (const item of scoreData) {
        expect(item.totalScore).toBeGreaterThanOrEqual(0);
        expect(item.totalScore).toBeLessThanOrEqual(100);
        expect(item.costScore).toBeDefined();
        expect(item.coverageScore).toBeDefined();
        expect(item.termsScore).toBeDefined();
      }
    });

    it("prepares CostChartItem data identifying the lowest quoted vendor accurately", async () => {
      const comparison = await compareAnalyzedQuotations([mockVendorA, mockVendorB, mockVendorC]);
      const costData = prepareCostChartData(comparison, [mockVendorA, mockVendorB, mockVendorC]);

      expect(costData).toHaveLength(3);
      const lowestItem = costData.find((c) => c.isLowest);
      expect(lowestItem).toBeDefined();
      expect(lowestItem?.vendorName).toBe("Budget Spice Caterers");
      expect(lowestItem?.statedTotal).toBe(85000);
    });

    it("prepares CoverageChartItem data comparing inclusions, exclusions, and deliverables", async () => {
      const comparison = await compareAnalyzedQuotations([mockVendorA, mockVendorB, mockVendorC]);
      const coverageData = prepareCoverageChartData(comparison, [mockVendorA, mockVendorB, mockVendorC]);

      expect(coverageData).toHaveLength(3);
      const maharajaCoverage = coverageData.find((c) => c.vendorName === "Maharaja Grand Banquets");
      expect(maharajaCoverage?.inclusionsCount).toBe(18);
      expect(maharajaCoverage?.deliverablesCount).toBe(6);
      expect(maharajaCoverage?.exclusionsCount).toBe(0);
    });
  });

  describe("2. Document Evidence Extraction & Citation Provenance", () => {
    it("extracts comprehensive EvidenceDetailRecord items across all quotation categories", () => {
      const records = extractAllEvidenceRecords([mockVendorA, mockVendorB]);

      expect(records.length).toBeGreaterThan(10);

      // Verify line item evidence
      const lineItemRec = records.find((r) => r.category === "line_item");
      expect(lineItemRec).toBeDefined();
      expect(lineItemRec?.sourcePage).toBe(1);
      expect(lineItemRec?.isExplicit).toBe(true);

      // Verify inclusion evidence
      const inclusionRec = records.find((r) => r.category === "inclusion");
      expect(inclusionRec).toBeDefined();

      // Verify payment schedule citation
      const paymentRec = records.find((r) => r.category === "payment");
      expect(paymentRec).toBeDefined();
      expect(paymentRec?.extractedValue).toContain("Advance Deposit");

      // Verify math audit discrepancy record for vendor with invalid math
      const mathAuditRec = records.find((r) => r.category === "math_audit");
      expect(mathAuditRec).toBeDefined();
      expect(mathAuditRec?.vendorName).toBe("Budget Spice Caterers");
      expect(mathAuditRec?.auditStatus).toBe("DISCREPANCY");
    });

    it("filters evidence records by category and vendorId using findEvidenceRecords", () => {
      const records = extractAllEvidenceRecords([mockVendorA, mockVendorB, mockVendorC]);

      const vendorAPayments = findEvidenceRecords(records, {
        vendorId: "upl-001",
        category: "payment",
      });
      expect(vendorAPayments.length).toBeGreaterThanOrEqual(1);
      expect(vendorAPayments.every((r) => r.vendorId === "upl-001")).toBe(true);
    });
  });

  describe("3. Dynamic Scenario Simulation & Winner Shift Detection", () => {
    it("simulates 'lowest_cost' scenario shifting weight towards budget-friendly vendors", async () => {
      const baseline = await compareAnalyzedQuotations([mockVendorA, mockVendorB]);
      const baselineWinner = baseline.recommendation.recommendedVendorId;

      const simulation = simulateComparisonScenario(
        [mockVendorA, mockVendorB],
        "lowest_cost"
      );

      expect(simulation.scenarioId).toBe("lowest_cost");
      expect(simulation.weightsUsed.costCompetitiveness).toBe(60);
      expect(simulation.scoring.vendorScores["upl-002"].criteria.costCompetitiveness.weight).toBe(60);
      expect(simulation.scoring.vendorScores["upl-002"].criteria.costCompetitiveness.adjustedWeight).toBeGreaterThanOrEqual(60);

      // If winner shifted, didWinnerChange is true
      if (simulation.scenarioWinnerId !== baselineWinner) {
        expect(simulation.didWinnerChange).toBe(true);
        expect(simulation.scenarioWinnerId).toBe("upl-002");
      }
    });

    it("simulates 'service_coverage' scenario weighting scope at 55%", () => {
      const simulation = simulateComparisonScenario(
        [mockVendorA, mockVendorB, mockVendorC],
        "service_coverage"
      );

      expect(simulation.scenarioId).toBe("service_coverage");
      expect(simulation.weightsUsed.serviceCoverage).toBe(55);
      // Maharaja Grand has highest inclusions and deliverables
      const maharajaScore = simulation.scoring.vendorScores["upl-003"];
      expect(maharajaScore.criteria.serviceCoverage.normalizedScore).toBeGreaterThanOrEqual(80);
    });

    it("simulates 'commercial_safety' scenario penalizing vendors with math warnings", () => {
      const simulation = simulateComparisonScenario(
        [mockVendorA, mockVendorB],
        "commercial_safety"
      );

      expect(simulation.scenarioId).toBe("commercial_safety");
      expect(simulation.weightsUsed.transparency).toBe(25);
      expect(simulation.weightsUsed.commercialTerms).toBe(40);

      // Vendor A with 0 discrepancies and low advance should score higher in safety
      const vendorAScore = simulation.scoring.vendorScores["upl-001"].totalScore;
      const vendorBScore = simulation.scoring.vendorScores["upl-002"].totalScore;
      expect(vendorAScore).toBeGreaterThan(vendorBScore);
    });
  });

  describe("4. Scenario Preset Definitions", () => {
    it("has 4 distinct scenario presets with balanced weights summing to 100", () => {
      const presets: ComparisonScenarioType[] = ["balanced", "lowest_cost", "service_coverage", "commercial_safety"];

      for (const presetKey of presets) {
        const preset = SCENARIO_PRESETS[presetKey];
        expect(preset).toBeDefined();
        expect(preset.label).toBeDefined();
        expect(preset.description).toBeDefined();

        const totalWeight = Object.values(preset.weights).reduce((a, b) => a + b, 0);
        expect(totalWeight).toBe(100);
      }
    });
  });
});
