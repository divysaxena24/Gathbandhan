import { describe, it, expect } from "vitest";

// Pure unit test calculations for Season Analytics logic

function calculatePackageMargin(revenuePaise: bigint, costPaise: bigint): number {
  if (revenuePaise <= 0n) return 0;
  const profit = revenuePaise - costPaise;
  return Number((profit * 10000n) / revenuePaise) / 100;
}

function calculateCompositeRiskScore(
  overdueTasks: number,
  atRiskTasks: number,
  lateCheckIns: number,
  unresolvedIncidents: number,
  criticalIncidents: number
): { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } {
  const raw =
    overdueTasks * 10 +
    atRiskTasks * 4 +
    lateCheckIns * 15 +
    unresolvedIncidents * 15 +
    criticalIncidents * 30;

  const score = Math.min(100, raw);
  let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 75) level = "CRITICAL";
  else if (score >= 50) level = "HIGH";
  else if (score >= 20) level = "MEDIUM";

  return { score, level };
}

describe("Season Analytics & Profitability Engine", () => {
  it("calculates exact package margins without floating-point errors", () => {
    // Luxury Full-Service: ₹2,00,00,000 revenue (20,000,000,00 paise), ₹1,40,00,000 cost (14,000,000,00 paise)
    // Profit = ₹60,00,000 (30.00% margin)
    const rev1 = 2000000000n;
    const cost1 = 1400000000n;
    const margin1 = calculatePackageMargin(rev1, cost1);
    expect(margin1).toBe(30);

    // Partial Planning: ₹80,00,000 revenue, ₹60,00,000 cost -> ₹20,00,000 profit (25.00% margin)
    const rev2 = 800000000n;
    const cost2 = 600000000n;
    const margin2 = calculatePackageMargin(rev2, cost2);
    expect(margin2).toBe(25);

    // Day-Of Coordination: ₹25,00,000 revenue, ₹15,00,000 cost -> ₹10,00,000 profit (40.00% margin)
    const rev3 = 250000000n;
    const cost3 = 150000000n;
    const margin3 = calculatePackageMargin(rev3, cost3);
    expect(margin3).toBe(40);
  });

  it("identifies highest margin package deterministically", () => {
    const packages = [
      { name: "FULL_SERVICE", margin: calculatePackageMargin(2000000000n, 1400000000n) }, // 30%
      { name: "PARTIAL", margin: calculatePackageMargin(800000000n, 600000000n) }, // 25%
      { name: "DAY_OF", margin: calculatePackageMargin(250000000n, 150000000n) }, // 40%
    ];

    const sorted = [...packages].sort((a, b) => b.margin - a.margin);
    expect(sorted[0].name).toBe("DAY_OF");
    expect(sorted[0].margin).toBe(40);
  });

  it("computes operational risk score accurately across incidents and late check-ins", () => {
    // Wedding with 2 overdue tasks (20), 1 late check-in (15), 1 critical incident (15+30=45) -> total = 80 -> CRITICAL
    const severeRisk = calculateCompositeRiskScore(2, 0, 1, 1, 1);
    expect(severeRisk.score).toBe(80);
    expect(severeRisk.level).toBe("CRITICAL");

    // Clean wedding with 0 overdue tasks and 0 incidents -> LOW
    const lowRisk = calculateCompositeRiskScore(0, 0, 0, 0, 0);
    expect(lowRisk.score).toBe(0);
    expect(lowRisk.level).toBe("LOW");

    // Moderate wedding with 2 at-risk tasks (8) and 1 late check-in (15) -> 23 -> MEDIUM
    const medRisk = calculateCompositeRiskScore(0, 2, 1, 0, 0);
    expect(medRisk.score).toBe(23);
    expect(medRisk.level).toBe("MEDIUM");
  });

  it("caps operational risk score at 100", () => {
    const excessiveRisk = calculateCompositeRiskScore(10, 5, 5, 5, 5);
    expect(excessiveRisk.score).toBe(100);
    expect(excessiveRisk.level).toBe("CRITICAL");
  });
});
