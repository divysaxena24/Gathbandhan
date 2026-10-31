import { describe, it, expect, beforeEach } from "vitest";
import {
  checkCategoryCompatibility,
  checkCurrencyCompatibility,
  calculateVendorScores,
  buildDeterministicProsAndCons,
  buildComparisonMatrix,
  generateFinalRecommendation,
  compareAnalyzedQuotations,
} from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { DEFAULT_COMPARISON_WEIGHTS } from "@/lib/ai/comparison-types";
import { POST } from "@/app/api/quotation-analyzer/compare/route";
import { setCachedAnalysis, clearAnalysisCache } from "@/lib/ai/quotation-analyzer-service";

function createMockAnalysis(params: {
  uploadId: string;
  vendorName: string;
  category?: string;
  currency?: string;
  grandTotal?: number | null;
  lineItemsCount?: number;
  inclusionsCount?: number;
  deliverablesCount?: number;
  exclusionsCount?: number;
  hasWebsite?: boolean;
  hasExperience?: boolean;
  advancePercentage?: number | null;
  cancellationTerms?: string | null;
  overtimeCharges?: string | null;
  isMathValid?: boolean;
  discrepanciesCount?: number;
}): QuotationAnalysisResult {
  const lineItems = Array.from({ length: params.lineItemsCount ?? 5 }, (_, i) => ({
    description: `Item ${i + 1}`,
    quantity: 1,
    unit: "package",
    unitPrice: 10000,
    statedAmount: 10000,
    sourcePage: 1,
    evidenceSnippet: `Item ${i + 1} - 10000`,
    isExplicit: true,
  }));

  const inclusions = Array.from({ length: params.inclusionsCount ?? 6 }, (_, i) => ({
    text: `Service Inclusion ${i + 1}`,
    sourcePage: 1,
    evidence: `Included ${i + 1}`,
  }));

  const deliverables = Array.from({ length: params.deliverablesCount ?? 2 }, (_, i) => ({
    text: `Deliverable ${i + 1}`,
    sourcePage: 1,
    evidence: `Deliverable ${i + 1}`,
  }));

  const exclusions = Array.from({ length: params.exclusionsCount ?? 1 }, (_, i) => ({
    text: `Exclusion ${i + 1}`,
    sourcePage: 1,
    evidence: `Excluded ${i + 1}`,
  }));

  const discrepancyFlags = Array.from({ length: params.discrepanciesCount ?? 0 }, (_, i) => ({
    type: "LINE_ITEM_MATH" as const,
    severity: "warning" as const,
    message: `Discrepancy ${i + 1} detected`,
  }));

  return {
    success: true,
    uploadId: params.uploadId,
    originalName: `${params.vendorName.replace(/\s+/g, "_")}.pdf`,
    analyzedAt: new Date().toISOString(),
    modelUsed: "mock-model",
    vendorDetails: {
      vendorName: params.vendorName,
      category: params.category ?? "Wedding Catering",
      contactPhone: "+91 9876543210",
      contactEmail: "info@vendor.com",
      address: "Mumbai, India",
      website: params.hasWebsite ? "https://vendor.com/portfolio" : null,
      quotationNumber: `QT-${params.uploadId}`,
      quotationDate: "2026-10-15",
      validityDate: "2026-11-15",
      sourcePage: 1,
      evidenceSnippet: params.hasExperience ? "Serving weddings with 15 years of experience since 2011" : null,
    },
    commercialDetails: {
      currency: params.currency ?? "INR",
      lineItems,
      statedSubtotal: params.grandTotal ?? 100000,
      discounts: [],
      totalDiscount: 0,
      taxes: [],
      totalTax: 0,
      additionalCharges: [],
      statedGrandTotal: params.grandTotal ?? 100000,
      paymentSchedule: [
        {
          milestone: "Advance on Booking",
          percentage: params.advancePercentage ?? 25,
          statedAmount: 25000,
          dueDate: "Upon signing",
          sourcePage: 2,
          evidenceSnippet: "25% advance on contract signing",
        },
        {
          milestone: "Event Day",
          percentage: 75,
          statedAmount: 75000,
          dueDate: "Event date",
          sourcePage: 2,
          evidenceSnippet: "75% on event day",
        },
      ],
      advancePayment: {
        percentage: params.advancePercentage ?? 25,
        amount: 25000,
        terms: "Advance booking fee",
        sourcePage: 2,
      },
      cancellationTerms: params.cancellationTerms !== undefined ? params.cancellationTerms : "50% refund if cancelled 30 days prior",
      refundTerms: params.cancellationTerms !== undefined ? params.cancellationTerms : "Partial refund available",
      specialConditions: params.hasExperience ? ["Established wedding caterer since 2011"] : [],
    },
    serviceDetails: {
      servicesIncluded: inclusions,
      servicesExcluded: exclusions,
      deliverables,
      guestLimit: 500,
      eventDates: ["2026-12-10"],
      coverageHours: 8,
      setupDetails: "Setup 4 hours prior",
      dismantlingDetails: "Dismantling within 2 hours",
      overtimeCharges: params.overtimeCharges !== undefined ? params.overtimeCharges : "₹5,000 per extra hour",
      optionalAddons: [],
    },
    financialAudit: {
      isValid: params.isMathValid ?? true,
      statedSubtotal: params.grandTotal ?? 100000,
      calculatedSubtotal: params.grandTotal ?? 100000,
      subtotalDiscrepancy: 0,
      subtotalMatches: true,
      statedGrandTotal: params.grandTotal ?? 100000,
      calculatedGrandTotal: params.grandTotal ?? 100000,
      grandTotalDiscrepancy: 0,
      grandTotalMatches: true,
      lineItemAudits: [],
      hasLineItemDiscrepancies: (params.discrepanciesCount ?? 0) > 0,
      discrepancyFlags,
      missingInformationFlags: [],
    },
    sourcePageCount: 3,
    conflictsAndWarnings: [],
    missingFields: [],
    error: null,
  };
}

describe("Milestone 4: Vendor Comparison, Scoring, and Recommendation Engine", () => {
  beforeEach(() => {
    clearAnalysisCache();
  });

  describe("Category & Currency Compatibility Checks", () => {
    it("recognizes compatible categories (e.g. catering variants) as compatible", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Royal Feast", category: "Wedding Catering" });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Saffron Table", category: "Gourmet Catering & Food" });

      const check = checkCategoryCompatibility([q1, q2]);
      expect(check.isCompatible).toBe(true);
      expect(check.warningMessage).toBeUndefined();
    });

    it("detects and flags incompatible vendor categories with an informative warning", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Royal Feast", category: "Catering" });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Studio Lens", category: "Photography & Cinema" });

      const check = checkCategoryCompatibility([q1, q2]);
      expect(check.isCompatible).toBe(false);
      expect(check.warningMessage).toContain("divergent vendor categories");
      expect(check.detectedCategories).toContain("Catering");
      expect(check.detectedCategories).toContain("Photography & Cinema");
    });

    it("detects different currencies across quotations and warns against direct numerical equivalence", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Vendor A", currency: "INR" });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Vendor B", currency: "USD" });

      const check = checkCurrencyCompatibility([q1, q2]);
      expect(check.isCompatible).toBe(false);
      expect(check.warningMessage).toContain("Multiple currencies detected");
    });
  });

  describe("Transparent Weighted Scoring & Dynamic Re-Normalization", () => {
    it("scores two vendors across all dimensions and assigns correct ranks", () => {
      const q1 = createMockAnalysis({
        uploadId: "1",
        vendorName: "Royal Feast Caterers",
        grandTotal: 150000,
        inclusionsCount: 10,
        advancePercentage: 20,
        hasWebsite: true,
        hasExperience: true,
      });

      const q2 = createMockAnalysis({
        uploadId: "2",
        vendorName: "Grand Aroma",
        grandTotal: 250000,
        inclusionsCount: 5,
        advancePercentage: 50,
        hasWebsite: false,
        hasExperience: false,
      });

      const scoring = calculateVendorScores([q1, q2]);
      expect(scoring.rankings).toHaveLength(2);
      expect(scoring.rankings[0].uploadId).toBe("1");
      expect(scoring.rankings[0].rank).toBe(1);
      expect(scoring.rankings[1].uploadId).toBe("2");
      expect(scoring.rankings[1].rank).toBe(2);

      // Verify Royal Feast has higher cost competitiveness score
      expect(scoring.vendorScores["1"].criteria.costCompetitiveness.normalizedScore).toBe(100);
      expect(scoring.vendorScores["2"].criteria.costCompetitiveness.normalizedScore).toBeLessThan(100);
    });

    it("supports multi-vendor comparison with 3 or more quotations", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Vendor 1", grandTotal: 100000 });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Vendor 2", grandTotal: 120000 });
      const q3 = createMockAnalysis({ uploadId: "3", vendorName: "Vendor 3", grandTotal: 150000 });
      const q4 = createMockAnalysis({ uploadId: "4", vendorName: "Vendor 4", grandTotal: 200000 });

      const scoring = calculateVendorScores([q1, q2, q3, q4]);
      expect(scoring.rankings).toHaveLength(4);
      expect(new Set(scoring.rankings.map((r) => r.rank)).size).toBe(4);
    });

    it("dynamically re-normalizes weights to 100% when portfolio and past performance evidence is missing without penalizing the vendor", () => {
      const qWithoutEvidence = createMockAnalysis({
        uploadId: "no-evidence",
        vendorName: "Plain Quote Caterers",
        hasWebsite: false,
        hasExperience: false,
      });

      const scoring = calculateVendorScores([qWithoutEvidence]);
      const breakdown = scoring.vendorScores["no-evidence"];

      // Quality & Past Performance should be marked unavailable
      expect(breakdown.criteria.qualityAndPortfolio.isAvailable).toBe(false);
      expect(breakdown.criteria.pastPerformance.isAvailable).toBe(false);
      expect(breakdown.criteria.qualityAndPortfolio.rawScore).toBeNull();

      // Available weights should re-normalize to exactly 100%
      const effectiveWeightsSum = Object.values(breakdown.effectiveWeightsSummary).reduce((a, b) => a + b, 0);
      expect(Math.round(effectiveWeightsSum)).toBe(100);

      // Total score should be non-zero and bounded 0-100
      expect(breakdown.totalScore).toBeGreaterThan(0);
      expect(breakdown.totalScore).toBeLessThanOrEqual(100);
    });

    it("penalizes transparency score for financial audit discrepancies", () => {
      const qClean = createMockAnalysis({ uploadId: "clean", vendorName: "Clean Math", isMathValid: true, discrepanciesCount: 0 });
      const qDiscrepancy = createMockAnalysis({ uploadId: "bad", vendorName: "Faulty Math", isMathValid: false, discrepanciesCount: 2 });

      const scoring = calculateVendorScores([qClean, qDiscrepancy]);
      const cleanTransparency = scoring.vendorScores["clean"].criteria.transparency.normalizedScore;
      const badTransparency = scoring.vendorScores["bad"].criteria.transparency.normalizedScore;

      expect(cleanTransparency).toBe(100);
      expect(badTransparency).toBeLessThan(60);
    });

    it("respects custom weight configurations passed by the planner", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Cheap Limited", grandTotal: 50000, inclusionsCount: 2 });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Luxury Comprehensive", grandTotal: 300000, inclusionsCount: 20 });

      // When cost weight is 70% and coverage is 10%
      const costHeavy = calculateVendorScores([q1, q2], {
        costCompetitiveness: 70,
        serviceCoverage: 10,
      });
      expect(costHeavy.rankings[0].uploadId).toBe("1"); // Cheap wins

      // When service coverage is 70% and cost is 10%
      const coverageHeavy = calculateVendorScores([q1, q2], {
        costCompetitiveness: 10,
        serviceCoverage: 70,
      });
      expect(coverageHeavy.rankings[0].uploadId).toBe("2"); // Comprehensive wins
    });
  });

  describe("Side-by-Side Comparison Matrix", () => {
    it("constructs comparison matrix across commercial, scope, terms, and audit categories", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Vendor A", grandTotal: 100000, inclusionsCount: 8 });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Vendor B", grandTotal: 120000, inclusionsCount: 12 });

      const matrix = buildComparisonMatrix([q1, q2], 100000);
      expect(matrix.length).toBeGreaterThanOrEqual(8);

      const totalCostRow = matrix.find((r) => r.criterion === "Total Quoted Cost");
      expect(totalCostRow).toBeDefined();
      expect(totalCostRow?.highlightBest).toBe("1");

      const inclusionRow = matrix.find((r) => r.criterion === "Service Inclusions");
      expect(inclusionRow).toBeDefined();
      expect(inclusionRow?.highlightBest).toBe("2");
    });
  });

  describe("Deterministic & Evidence-Traceable Pros and Cons", () => {
    it("generates evidence-traceable pros and cons directly from quotation data", () => {
      const q = createMockAnalysis({
        uploadId: "test",
        vendorName: "Royal Catering",
        grandTotal: 100000,
        inclusionsCount: 10,
        advancePercentage: 20,
        cancellationTerms: "Full refund 45 days prior",
        overtimeCharges: "₹4,000/hr",
      });

      const { pros, cons } = buildDeterministicProsAndCons(q, 100000);
      expect(pros.some((p) => p.includes("Lowest overall quoted pricing"))).toBe(true);
      expect(pros.some((p) => p.includes("10 distinct service inclusions"))).toBe(true);
      expect(pros.some((p) => p.includes("low 20% advance"))).toBe(true);
    });

    it("flags missing cancellation terms or high advance payments as cons", () => {
      const q = createMockAnalysis({
        uploadId: "test-missing",
        vendorName: "Risky Caterers",
        grandTotal: 300000,
        advancePercentage: 60,
        cancellationTerms: null, // missing cancellation
        overtimeCharges: null,
      });

      const { cons } = buildDeterministicProsAndCons(q, 100000);
      expect(cons.some((c) => c.includes("advance deposit (60%)"))).toBe(true);
      expect(cons.some((c) => c.includes("No cancellation or refund terms specified"))).toBe(true);
    });
  });

  describe("Exactly One Final Recommendation", () => {
    it("produces exactly one definitive recommendation with rationale and clarification questions", () => {
      const q1 = createMockAnalysis({
        uploadId: "winner",
        vendorName: "Elite Wedding Banquets",
        grandTotal: 100000,
        inclusionsCount: 12,
        hasWebsite: true,
        hasExperience: true,
      });
      const q2 = createMockAnalysis({
        uploadId: "runner-up",
        vendorName: "Basic Caterers",
        grandTotal: 180000,
        inclusionsCount: 4,
      });

      const scoring = calculateVendorScores([q1, q2]);
      const prosAndCons = {
        winner: buildDeterministicProsAndCons(q1, 100000),
        "runner-up": buildDeterministicProsAndCons(q2, 100000),
      };

      const recommendation = generateFinalRecommendation(
        scoring.rankings,
        scoring.vendorScores,
        [q1, q2],
        prosAndCons
      );

      expect(recommendation.recommendedVendorId).toBe("winner");
      expect(recommendation.recommendedVendorName).toBe("Elite Wedding Banquets");
      expect(recommendation.headline).toContain("Ranked #1 Overall");
      expect(recommendation.majorAdvantages.length).toBeGreaterThan(0);
      expect(recommendation.commercialDisadvantages.length).toBeGreaterThan(0);
      expect(recommendation.questionsToClarifyBeforeSigning.length).toBeGreaterThan(0);
      expect(recommendation.advisoryNotice).toContain("advisory");
    });

    it("marks recommendation as provisional when the top two vendors are closely matched", () => {
      const q1 = createMockAnalysis({ uploadId: "1", vendorName: "Vendor A", grandTotal: 100000 });
      const q2 = createMockAnalysis({ uploadId: "2", vendorName: "Vendor B", grandTotal: 101000 });

      const scoring = calculateVendorScores([q1, q2]);
      const prosAndCons = {
        "1": buildDeterministicProsAndCons(q1, 100000),
        "2": buildDeterministicProsAndCons(q2, 100000),
      };

      const recommendation = generateFinalRecommendation(
        scoring.rankings,
        scoring.vendorScores,
        [q1, q2],
        prosAndCons
      );

      expect(recommendation.recommendedVendorId).toBeDefined();
      expect(recommendation.isProvisional).toBe(true);
      expect(recommendation.executiveSummary).toContain("provisional");
    });
  });

  describe("End-to-End Comparison Service & API Route", () => {
    it("runs compareAnalyzedQuotations end-to-end and returns complete structured response", async () => {
      const q1 = createMockAnalysis({ uploadId: "q1", vendorName: "Royal Feast", grandTotal: 120000 });
      const q2 = createMockAnalysis({ uploadId: "q2", vendorName: "Saffron Table", grandTotal: 140000 });

      const result = await compareAnalyzedQuotations([q1, q2]);

      expect(result.success).toBe(true);
      expect(result.comparisonId).toBeDefined();
      expect(result.vendors).toHaveLength(2);
      expect(result.matrix.length).toBeGreaterThan(0);
      expect(result.scoring.rankings).toHaveLength(2);
      expect(result.recommendation.recommendedVendorId).toBeDefined();
    });

    it("rejects comparison requests with fewer than 2 quotations", async () => {
      const q1 = createMockAnalysis({ uploadId: "q1", vendorName: "Solo Vendor" });
      await expect(compareAnalyzedQuotations([q1])).rejects.toThrow("at least two");
    });

    it("POST /api/quotation-analyzer/compare rejects invalid bodies and insufficient IDs", async () => {
      // 1. Invalid JSON
      const badReq = new Request("http://localhost:3000/api/quotation-analyzer/compare", {
        method: "POST",
        body: "invalid-json",
      });
      const badRes = await POST(badReq);
      expect(badRes.status).toBe(400);

      // 2. Fewer than 2 IDs
      const singleReq = new Request("http://localhost:3000/api/quotation-analyzer/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ["single-id"] }),
      });
      const singleRes = await POST(singleReq);
      expect(singleRes.status).toBe(400);
      const singleJson = await singleRes.json();
      expect(singleJson.error).toContain("At least two analyzed quotation IDs");
    });

    it("POST /api/quotation-analyzer/compare compares cached analyzed quotations successfully", async () => {
      const q1 = createMockAnalysis({ uploadId: "cached-1", vendorName: "Vendor One", grandTotal: 90000 });
      const q2 = createMockAnalysis({ uploadId: "cached-2", vendorName: "Vendor Two", grandTotal: 110000 });

      setCachedAnalysis("cached-1", q1);
      setCachedAnalysis("cached-2", q2);

      const req = new Request("http://localhost:3000/api/quotation-analyzer/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ["cached-1", "cached-2"] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.recommendation.recommendedVendorId).toBe("cached-1");
      expect(json.vendors).toHaveLength(2);
    });
  });
});
