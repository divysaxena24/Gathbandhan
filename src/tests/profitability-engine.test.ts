import { describe, it, expect } from "vitest";

interface CategoryFinancials {
  category: string;
  committedPaise: bigint;
  invoicedPaise: bigint;
  paidPaise: bigint;
}

interface ProfitabilityCalculationInput {
  contractedRevenuePaise: bigint;
  collectedRevenuePaise: bigint;
  committedVendorCostsPaise: bigint;
  actualInvoicedCostsPaise: bigint;
  paidToVendorsPaise: bigint;
  approvedExpensesPaise: bigint;
  categories: CategoryFinancials[];
}

export function computeProfitabilityMetrics(input: ProfitabilityCalculationInput) {
  const pendingReceivablesPaise =
    input.contractedRevenuePaise > input.collectedRevenuePaise
      ? input.contractedRevenuePaise - input.collectedRevenuePaise
      : 0n;

  const pendingPayablesPaise =
    input.actualInvoicedCostsPaise > input.paidToVendorsPaise
      ? input.actualInvoicedCostsPaise - input.paidToVendorsPaise
      : 0n;

  const totalProjectedCostsPaise =
    input.committedVendorCostsPaise + input.approvedExpensesPaise;
  const totalActualCostsPaise =
    input.actualInvoicedCostsPaise + input.approvedExpensesPaise;

  const projectedProfitPaise =
    input.contractedRevenuePaise - totalProjectedCostsPaise;
  const projectedMarginPercentage =
    input.contractedRevenuePaise > 0n
      ? Number((projectedProfitPaise * 10000n) / input.contractedRevenuePaise) / 100
      : 0;

  const realizedProfitPaise =
    input.collectedRevenuePaise - totalActualCostsPaise;
  const realizedMarginPercentage =
    input.collectedRevenuePaise > 0n
      ? Number((realizedProfitPaise * 10000n) / input.collectedRevenuePaise) / 100
      : 0;

  return {
    contractedRevenuePaise: input.contractedRevenuePaise,
    collectedRevenuePaise: input.collectedRevenuePaise,
    pendingReceivablesPaise,
    committedVendorCostsPaise: input.committedVendorCostsPaise,
    actualInvoicedCostsPaise: input.actualInvoicedCostsPaise,
    paidToVendorsPaise: input.paidToVendorsPaise,
    pendingPayablesPaise,
    approvedExpensesPaise: input.approvedExpensesPaise,
    totalProjectedCostsPaise,
    totalActualCostsPaise,
    projectedProfitPaise,
    projectedMarginPercentage,
    realizedProfitPaise,
    realizedMarginPercentage,
    categoryBreakdown: input.categories,
  };
}

describe("Profitability Calculation Engine", () => {
  it("calculates accurate profit and margin for Sharma Royal Wedding (₹2 Crore budget)", () => {
    // Contracted Revenue: ₹2,00,00,000 (2,000,000,000 paise)
    // Collected so far: ₹1,40,00,000 (1,400,000,000 paise)
    // Committed Vendor Costs: ₹1,50,00,000 (1,500,000,000 paise)
    // Actual Invoiced Costs: ₹70,00,000 (700,000,000 paise)
    // Paid to Vendors: ₹57,50,000 (575,000,000 paise)
    // Approved Expenses: ₹5,00,000 (50,000,000 paise)
    const metrics = computeProfitabilityMetrics({
      contractedRevenuePaise: 2000000000n,
      collectedRevenuePaise: 1400000000n,
      committedVendorCostsPaise: 1500000000n,
      actualInvoicedCostsPaise: 700000000n,
      paidToVendorsPaise: 575000000n,
      approvedExpensesPaise: 50000000n,
      categories: [
        {
          category: "Catering",
          committedPaise: 800000000n,
          invoicedPaise: 400000000n,
          paidPaise: 400000000n,
        },
        {
          category: "Decoration",
          committedPaise: 350000000n,
          invoicedPaise: 175000000n,
          paidPaise: 175000000n,
        },
      ],
    });

    // Receivables: 200 Lakh - 140 Lakh = 60 Lakh
    expect(metrics.pendingReceivablesPaise).toBe(600000000n);

    // Payables: 70 Lakh invoiced - 57.5 Lakh paid = 12.5 Lakh
    expect(metrics.pendingPayablesPaise).toBe(125000000n);

    // Total Projected Cost: 150 Lakh + 5 Lakh = 155 Lakh
    expect(metrics.totalProjectedCostsPaise).toBe(1550000000n);

    // Projected Profit: 200 Lakh - 155 Lakh = 45 Lakh
    expect(metrics.projectedProfitPaise).toBe(450000000n);

    // Projected Margin: 45 / 200 = 22.50%
    expect(metrics.projectedMarginPercentage).toBe(22.5);

    // Total Actual Cost to Date: 70 Lakh + 5 Lakh = 75 Lakh
    expect(metrics.totalActualCostsPaise).toBe(750000000n);

    // Realized Profit: 140 Lakh collected - 75 Lakh actual cost = 65 Lakh
    expect(metrics.realizedProfitPaise).toBe(650000000n);

    // Realized Margin: 65 / 140 ≈ 46.42%
    expect(metrics.realizedMarginPercentage).toBeCloseTo(46.42, 1);
  });

  it("handles zero revenue boundary cases safely without dividing by zero", () => {
    const metrics = computeProfitabilityMetrics({
      contractedRevenuePaise: 0n,
      collectedRevenuePaise: 0n,
      committedVendorCostsPaise: 50000000n,
      actualInvoicedCostsPaise: 20000000n,
      paidToVendorsPaise: 0n,
      approvedExpensesPaise: 0n,
      categories: [],
    });

    expect(metrics.projectedProfitPaise).toBe(-50000000n);
    expect(metrics.projectedMarginPercentage).toBe(0);
    expect(metrics.realizedProfitPaise).toBe(-20000000n);
    expect(metrics.realizedMarginPercentage).toBe(0);
  });

  it("calculates exact negative margins in case of cost overruns", () => {
    // Contracted: 1 Crore, Projected Costs: 1.2 Crore (20 Lakh loss)
    const metrics = computeProfitabilityMetrics({
      contractedRevenuePaise: 1000000000n,
      collectedRevenuePaise: 1000000000n,
      committedVendorCostsPaise: 1200000000n,
      actualInvoicedCostsPaise: 1200000000n,
      paidToVendorsPaise: 1200000000n,
      approvedExpensesPaise: 0n,
      categories: [],
    });

    expect(metrics.projectedProfitPaise).toBe(-200000000n);
    expect(metrics.projectedMarginPercentage).toBe(-20.0);
    expect(metrics.realizedProfitPaise).toBe(-200000000n);
    expect(metrics.realizedMarginPercentage).toBe(-20.0);
  });

  it("ensures pending payables and receivables never underflow to negative values", () => {
    // If client overpaid or vendor paid in excess
    const metrics = computeProfitabilityMetrics({
      contractedRevenuePaise: 100000000n,
      collectedRevenuePaise: 120000000n, // Client paid more than milestone
      committedVendorCostsPaise: 80000000n,
      actualInvoicedCostsPaise: 80000000n,
      paidToVendorsPaise: 90000000n, // Advance paid more than invoice
      approvedExpensesPaise: 0n,
      categories: [],
    });

    expect(metrics.pendingReceivablesPaise).toBe(0n);
    expect(metrics.pendingPayablesPaise).toBe(0n);
  });
});
