import { describe, it, expect } from "vitest";

function calculateVendorReliability(params: {
  checkInTotal: number;
  onTimeCheckIns: number;
  lateCheckIns: number;
  incidentCount: number;
  contractedPaise: bigint;
  invoicedPaise: bigint;
  tier: "ELITE" | "PREFERRED" | "STANDARD" | "TRIAL";
  totalEngagements: number;
}) {
  const costVariancePaise =
    params.invoicedPaise > params.contractedPaise
      ? params.invoicedPaise - params.contractedPaise
      : 0n;

  // 1. Punctuality (35%)
  let punctualityScore = 85;
  if (params.checkInTotal > 0) {
    punctualityScore = Math.round(
      (params.onTimeCheckIns / params.checkInTotal) * 100
    );
  }

  // 2. Incident Freedom (30%)
  const incidentFreedomScore = Math.max(0, 100 - params.incidentCount * 25);

  // 3. Budget Adherence (20%)
  let budgetAdherenceScore = 100;
  if (params.contractedPaise > 0n && costVariancePaise > 0n) {
    const overrunPct = Number((costVariancePaise * 100n) / params.contractedPaise);
    budgetAdherenceScore = Math.max(0, 100 - overrunPct * 2);
  }

  // 4. Quality (15%)
  let qualityScore = 80;
  if (params.tier === "ELITE") qualityScore = 100;
  else if (params.tier === "PREFERRED") qualityScore = 90;
  else if (params.tier === "TRIAL") qualityScore = 70;

  const overallScore = Math.round(
    punctualityScore * 0.35 +
      incidentFreedomScore * 0.3 +
      budgetAdherenceScore * 0.2 +
      qualityScore * 0.15
  );

  let reliabilityGrade: "ELITE" | "RELIABLE" | "WATCHLIST" | "RISK" = "RELIABLE";
  if (overallScore >= 90) reliabilityGrade = "ELITE";
  else if (overallScore >= 75) reliabilityGrade = "RELIABLE";
  else if (overallScore >= 60) reliabilityGrade = "WATCHLIST";
  else reliabilityGrade = "RISK";

  const isSparseData = params.checkInTotal < 3 && params.totalEngagements < 3;
  const isRepeatedlyLate = params.lateCheckIns >= 2;
  const isRepeatedlyOverBudget = costVariancePaise > 0n;

  return {
    overallScore,
    reliabilityGrade,
    isSparseData,
    isRepeatedlyLate,
    isRepeatedlyOverBudget,
    costVariancePaise,
  };
}

describe("Vendor Reliability Engine", () => {
  it("rates flawless elite vendor with 95+ score", () => {
    const metrics = calculateVendorReliability({
      checkInTotal: 10,
      onTimeCheckIns: 10,
      lateCheckIns: 0,
      incidentCount: 0,
      contractedPaise: 50000000n, // ₹5,00,000
      invoicedPaise: 50000000n,
      tier: "ELITE",
      totalEngagements: 5,
    });

    expect(metrics.overallScore).toBe(100);
    expect(metrics.reliabilityGrade).toBe("ELITE");
    expect(metrics.isSparseData).toBe(false);
    expect(metrics.isRepeatedlyLate).toBe(false);
    expect(metrics.isRepeatedlyOverBudget).toBe(false);
  });

  it("flags sparse data when vendor has fewer than 3 events", () => {
    const metrics = calculateVendorReliability({
      checkInTotal: 1,
      onTimeCheckIns: 1,
      lateCheckIns: 0,
      incidentCount: 0,
      contractedPaise: 10000000n,
      invoicedPaise: 10000000n,
      tier: "PREFERRED",
      totalEngagements: 1,
    });

    expect(metrics.isSparseData).toBe(true);
  });

  it("detects repeat late arrivals and downgrades to watchlist/risk", () => {
    const metrics = calculateVendorReliability({
      checkInTotal: 4,
      onTimeCheckIns: 2,
      lateCheckIns: 2, // 2 late arrivals -> repeatedly late
      incidentCount: 1,
      contractedPaise: 20000000n,
      invoicedPaise: 20000000n,
      tier: "STANDARD",
      totalEngagements: 4,
    });

    expect(metrics.isRepeatedlyLate).toBe(true);
    expect(metrics.overallScore).toBeLessThan(75);
    expect(metrics.reliabilityGrade === "WATCHLIST" || metrics.reliabilityGrade === "RISK").toBe(true);
  });

  it("detects cost overruns and penalizes budget adherence score", () => {
    // Contract: ₹10,00,000 (100,000,000 paise). Invoiced: ₹12,00,000 (20% overrun)
    const metrics = calculateVendorReliability({
      checkInTotal: 5,
      onTimeCheckIns: 5,
      lateCheckIns: 0,
      incidentCount: 0,
      contractedPaise: 100000000n,
      invoicedPaise: 120000000n, // +₹2,00,000 overrun
      tier: "PREFERRED",
      totalEngagements: 3,
    });

    expect(metrics.isRepeatedlyOverBudget).toBe(true);
    expect(metrics.costVariancePaise).toBe(20000000n);
    expect(metrics.overallScore).toBeLessThan(95);
  });
});
