import { db } from "@/lib/db";
import {
  vendors,
  weddingVendors,
  vendorCheckIns,
  incidents,
  vendorInvoices,
} from "@/lib/db/schema";
import { VendorReliabilityMetrics } from "../types";

/**
 * Computes deterministic vendor reliability and performance ratings.
 * Evaluates punctuality, incident history, cost variance, and quality tier.
 * Answers: Which vendors are late or over budget repeatedly?
 */
export async function getVendorReliabilityMetrics(): Promise<
  VendorReliabilityMetrics[]
> {
  const allVendors = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      category: vendors.category,
      averageRating: vendors.averageRating,
      city: vendors.city,
    })
    .from(vendors);

  const allWeddingVendors = await db
    .select({
      vendorId: weddingVendors.vendorId,
      contractAmountPaise: weddingVendors.contractAmountPaise,
    })
    .from(weddingVendors);

  const allCheckIns = await db
    .select({
      weddingVendorId: vendorCheckIns.weddingVendorId,
      status: vendorCheckIns.status,
    })
    .from(vendorCheckIns);

  const allIncidents = await db
    .select({
      vendorId: incidents.vendorId,
      severity: incidents.severity,
    })
    .from(incidents);

  const allInvoices = await db
    .select({
      vendorId: vendorInvoices.vendorId,
      totalPaise: vendorInvoices.totalPaise,
    })
    .from(vendorInvoices);

  // Group check-ins by vendorId via weddingVendors
  const vendorIdByWeddingVendorId = new Map<string, string>();
  const contractsByVendor = new Map<string, bigint>();
  const engagementCountByVendor = new Map<string, number>();

  for (const wv of allWeddingVendors) {
    engagementCountByVendor.set(
      wv.vendorId,
      (engagementCountByVendor.get(wv.vendorId) || 0) + 1
    );
    const prev = contractsByVendor.get(wv.vendorId) || 0n;
    contractsByVendor.set(wv.vendorId, prev + (wv.contractAmountPaise || 0n));
  }

  const invoicesByVendor = new Map<string, bigint>();
  for (const inv of allInvoices) {
    const prev = invoicesByVendor.get(inv.vendorId) || 0n;
    invoicesByVendor.set(inv.vendorId, prev + inv.totalPaise);
  }

  const incidentsByVendor = new Map<string, number>();
  for (const inc of allIncidents) {
    if (inc.vendorId) {
      incidentsByVendor.set(
        inc.vendorId,
        (incidentsByVendor.get(inc.vendorId) || 0) + 1
      );
    }
  }

  // Count check-ins
  // Note: vendorCheckIns links to weddingVendorId. We can also directly map.
  const checkInsByVendor = new Map<
    string,
    { total: number; onTime: number; late: number }
  >();

  // Fetch wedding vendors with their id
  const wvMap = await db
    .select({
      id: weddingVendors.id,
      vendorId: weddingVendors.vendorId,
    })
    .from(weddingVendors);

  for (const wv of wvMap) {
    vendorIdByWeddingVendorId.set(wv.id, wv.vendorId);
  }

  for (const ci of allCheckIns) {
    const vId = vendorIdByWeddingVendorId.get(ci.weddingVendorId);
    if (vId) {
      const stats = checkInsByVendor.get(vId) || {
        total: 0,
        onTime: 0,
        late: 0,
      };
      stats.total += 1;
      if (ci.status === "LATE") {
        stats.late += 1;
      } else if (
        ci.status === "ARRIVED" ||
        ci.status === "SETUP_COMPLETE" ||
        ci.status === "WORKING" ||
        ci.status === "COMPLETED"
      ) {
        stats.onTime += 1;
      }
      checkInsByVendor.set(vId, stats);
    }
  }

  const results: VendorReliabilityMetrics[] = [];

  for (const v of allVendors) {
    const checkStats = checkInsByVendor.get(v.id) || {
      total: 0,
      onTime: 0,
      late: 0,
    };
    const engagements = engagementCountByVendor.get(v.id) || 0;
    const incidentCount = incidentsByVendor.get(v.id) || 0;
    const contractedPaise = contractsByVendor.get(v.id) || 0n;
    const invoicedPaise = invoicesByVendor.get(v.id) || 0n;
    const costVariancePaise =
      invoicedPaise > contractedPaise ? invoicedPaise - contractedPaise : 0n;

    // 1. Punctuality Score (35%)
    let punctualityScore = 85;
    if (checkStats.total > 0) {
      punctualityScore = Math.round(
        (checkStats.onTime / checkStats.total) * 100
      );
    }

    // 2. Incident Freedom Score (30%)
    const incidentFreedomScore = Math.max(0, 100 - incidentCount * 25);

    // 3. Budget Adherence Score (20%)
    let budgetAdherenceScore = 100;
    if (contractedPaise > 0n && costVariancePaise > 0n) {
      const overrunPct = Number((costVariancePaise * 100n) / contractedPaise);
      budgetAdherenceScore = Math.max(0, 100 - overrunPct * 2);
    }

    // 4. Quality Tier Score (15%)
    const ratingNum = Number(v.averageRating) || 4.5;
    let tier: "ELITE" | "PREFERRED" | "STANDARD" | "TRIAL" = "PREFERRED";
    if (ratingNum >= 4.8) tier = "ELITE";
    else if (ratingNum >= 4.3) tier = "PREFERRED";
    else if (ratingNum >= 3.8) tier = "STANDARD";
    else tier = "TRIAL";

    let qualityScore = 80;
    if (tier === "ELITE") qualityScore = 100;
    else if (tier === "PREFERRED") qualityScore = 90;
    else if (tier === "TRIAL") qualityScore = 70;

    // Weighted Overall Score (0-100)
    const overallScore = Math.round(
      punctualityScore * 0.35 +
        incidentFreedomScore * 0.3 +
        budgetAdherenceScore * 0.2 +
        qualityScore * 0.15
    );

    // Reliability Grade
    let reliabilityGrade: "ELITE" | "RELIABLE" | "WATCHLIST" | "RISK" =
      "RELIABLE";
    if (overallScore >= 90) reliabilityGrade = "ELITE";
    else if (overallScore >= 75) reliabilityGrade = "RELIABLE";
    else if (overallScore >= 60) reliabilityGrade = "WATCHLIST";
    else reliabilityGrade = "RISK";

    // Sparse data warning: avoids misleading score when data < 3 samples
    const isSparseData = checkStats.total < 3 && engagements < 3;
    const isRepeatedlyLate = checkStats.late >= 2;
    const isRepeatedlyOverBudget = costVariancePaise > 0n;

    results.push({
      vendorId: v.id,
      vendorName: v.name,
      category: v.category,
      tier,
      city: v.city || "Rajasthan",
      totalEngagements: engagements,
      checkInTotal: checkStats.total,
      onTimeCheckIns: checkStats.onTime,
      punctualityScore,
      incidentCount,
      incidentFreedomScore,
      contractedAmountPaise: contractedPaise,
      invoicedAmountPaise: invoicedPaise,
      costVariancePaise,
      budgetAdherenceScore,
      overallScore,
      reliabilityGrade,
      isSparseData,
      isRepeatedlyLate,
      isRepeatedlyOverBudget,
    });
  }

  // Sort descending by overallScore
  return results.sort((a, b) => b.overallScore - a.overallScore);
}
