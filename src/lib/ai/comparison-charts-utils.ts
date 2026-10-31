import { QuotationAnalysisResult } from "./types";
import {
  MultiVendorComparisonResult,
  ScoreChartItem,
  CostChartItem,
  CoverageChartItem,
  EvidenceDetailRecord,
} from "./comparison-types";

/**
 * Prepares chart data for Score Comparison and Weighted Breakdown.
 * Safe for client-side and browser bundles (no Node.js dependencies).
 */
export function prepareScoreChartData(comparison: MultiVendorComparisonResult): ScoreChartItem[] {
  if (!comparison?.scoring?.rankings) return [];
  return comparison.scoring.rankings.map((r) => {
    const breakdown = comparison.scoring.vendorScores[r.uploadId];
    const crit = breakdown.criteria;
    return {
      vendorId: r.uploadId,
      vendorName: r.vendorName,
      totalScore: r.totalScore,
      rank: r.rank,
      isRecommended: r.uploadId === comparison.recommendation.recommendedVendorId,
      costScore: crit.costCompetitiveness.normalizedScore,
      coverageScore: crit.serviceCoverage.normalizedScore,
      termsScore: crit.commercialTerms.normalizedScore,
      auditScore: crit.transparency.normalizedScore,
      qualityScore: crit.qualityAndPortfolio.isAvailable ? crit.qualityAndPortfolio.normalizedScore : 0,
      pastPerfScore: crit.pastPerformance.isAvailable ? crit.pastPerformance.normalizedScore : 0,
    };
  });
}

/**
 * Prepares chart data for Quoted Cost & Financial Breakdown.
 * Safe for client-side and browser bundles (no Node.js dependencies).
 */
export function prepareCostChartData(
  comparison: MultiVendorComparisonResult,
  analyzedQuotations: QuotationAnalysisResult[] = []
): CostChartItem[] {
  if (!comparison?.vendors) return [];
  const validPrices = comparison.vendors
    .map((v) => v.statedGrandTotal ?? v.calculatedGrandTotal)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  return comparison.vendors.map((v) => {
    const rawQ = analyzedQuotations.find((q) => q.uploadId === v.uploadId);
    const statedTotal = v.statedGrandTotal ?? v.calculatedGrandTotal ?? 0;
    return {
      vendorId: v.uploadId,
      vendorName: v.vendorName,
      statedTotal,
      calculatedTotal: v.calculatedGrandTotal ?? statedTotal,
      currency: v.currency || "INR",
      isLowest: statedTotal > 0 && statedTotal === minPrice,
      subtotal: rawQ?.commercialDetails.statedSubtotal ?? statedTotal,
      taxes: rawQ?.commercialDetails.totalTax ?? 0,
    };
  });
}

/**
 * Prepares chart data for Service Coverage Comparison.
 * Safe for client-side and browser bundles (no Node.js dependencies).
 */
export function prepareCoverageChartData(
  comparison: MultiVendorComparisonResult,
  analyzedQuotations: QuotationAnalysisResult[] = []
): CoverageChartItem[] {
  if (!comparison?.vendors) return [];
  return comparison.vendors.map((v) => {
    const rawQ = analyzedQuotations.find((q) => q.uploadId === v.uploadId);
    return {
      vendorId: v.uploadId,
      vendorName: v.vendorName,
      inclusionsCount: v.inclusionsCount,
      exclusionsCount: v.exclusionsCount,
      deliverablesCount: rawQ?.serviceDetails.deliverables.length ?? (v.qualityEvidence ? 2 : 1),
    };
  });
}

/**
 * Extracts all itemized evidence records across analyzed quotations.
 * Safe for client-side and browser bundles (no Node.js dependencies).
 */
export function extractAllEvidenceRecords(
  quotations: QuotationAnalysisResult[]
): EvidenceDetailRecord[] {
  const records: EvidenceDetailRecord[] = [];

  for (const q of quotations) {
    const vId = q.uploadId;
    const vName = q.vendorDetails.vendorName || "Unknown Vendor";
    const fileName = q.originalName || "Quotation.pdf";

    // Commercial Line Items
    for (const item of q.commercialDetails.lineItems) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: item.sourcePage || 1,
        category: "line_item",
        field: item.description,
        extractedValue: `Rs. ${item.statedAmount || item.unitPrice || "—"}`,
        evidenceSnippet: item.evidenceSnippet || item.description,
        isExplicit: item.isExplicit,
      });
    }

    // Inclusions
    for (const inc of q.serviceDetails.servicesIncluded) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: inc.sourcePage || 1,
        category: "inclusion",
        field: "Included Service",
        extractedValue: inc.text,
        evidenceSnippet: inc.evidence || inc.text,
        isExplicit: true,
      });
    }

    // Deliverables
    for (const del of q.serviceDetails.deliverables) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: del.sourcePage || 1,
        category: "inclusion",
        field: "Deliverable",
        extractedValue: del.text,
        evidenceSnippet: del.evidence || del.text,
        isExplicit: true,
      });
    }

    // Exclusions
    for (const exc of q.serviceDetails.servicesExcluded) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: exc.sourcePage || 1,
        category: "exclusion",
        field: "Excluded Service",
        extractedValue: exc.text,
        evidenceSnippet: exc.evidence || exc.text,
        isExplicit: true,
      });
    }

    // Payment Milestones
    for (const p of q.commercialDetails.paymentSchedule) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: p.sourcePage || 1,
        category: "payment",
        field: `Milestone: ${p.milestone}`,
        extractedValue: `${p.milestone}: ${p.percentage ? `${p.percentage}%` : ""} (Rs. ${p.statedAmount || "—"}) due ${p.dueDate || "per agreement"}`,
        evidenceSnippet: p.evidenceSnippet || p.milestone,
        isExplicit: true,
      });
    }

    // Cancellation
    if (q.commercialDetails.cancellationTerms) {
      records.push({
        vendorId: vId,
        vendorName: vName,
        originalFileName: fileName,
        sourcePage: 2,
        category: "cancellation",
        field: "Cancellation & Refund Terms",
        extractedValue: q.commercialDetails.cancellationTerms,
        evidenceSnippet: q.commercialDetails.cancellationTerms,
        isExplicit: true,
      });
    }

    // Math Discrepancies
    if (!q.financialAudit.isValid) {
      for (const flag of q.financialAudit.discrepancyFlags) {
        records.push({
          vendorId: vId,
          vendorName: vName,
          originalFileName: fileName,
          sourcePage: 1,
          category: "math_audit",
          field: `Audit Flag: ${flag.type}`,
          extractedValue: flag.message,
          evidenceSnippet: flag.message,
          isExplicit: true,
          auditStatus: "DISCREPANCY",
        });
      }
    }
  }

  return records;
}

/**
 * Filters extracted evidence records by vendorId or category.
 * Safe for client-side and browser bundles (no Node.js dependencies).
 */
export function findEvidenceRecords(
  records: EvidenceDetailRecord[],
  filter: {
    vendorId?: string;
    category?: EvidenceDetailRecord["category"];
  }
): EvidenceDetailRecord[] {
  return records.filter((r) => {
    if (filter.vendorId && r.vendorId !== filter.vendorId) return false;
    if (filter.category && r.category !== filter.category) return false;
    return true;
  });
}
