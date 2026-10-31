import { describe, it, expect } from "vitest";

interface ReconcileParams {
  contractAmountPaise: bigint;
  approvedExtrasPaise: bigint;
  invoicedTotalPaise: bigint;
  paidToDatePaise: bigint;
  approvedExtrasAllowed?: boolean;
}

interface ReconciliationOutput {
  contractAmountPaise: bigint;
  approvedExtrasPaise: bigint;
  totalApprovedCommitmentPaise: bigint;
  invoicedTotalPaise: bigint;
  paidToDatePaise: bigint;
  remainingPayablePaise: bigint;
  variancePaise: bigint;
  varianceStatus: "EXACT_MATCH" | "UNDER_BUDGET" | "OVER_BUDGET";
  variancePercentage: number;
  requiresFinanceApproval: boolean;
  explanation: string;
}

export function evaluateInvoiceReconciliation(
  params: ReconcileParams
): ReconciliationOutput {
  const extrasAllowed = params.approvedExtrasAllowed ?? true;
  const approvedExtras = extrasAllowed ? params.approvedExtrasPaise : 0n;
  const totalApprovedCommitmentPaise =
    params.contractAmountPaise + approvedExtras;
  const variancePaise =
    params.invoicedTotalPaise - totalApprovedCommitmentPaise;

  let varianceStatus: ReconciliationOutput["varianceStatus"] = "EXACT_MATCH";
  let requiresFinanceApproval = false;
  let explanation = "";

  if (variancePaise === 0n) {
    varianceStatus = "EXACT_MATCH";
    explanation = "Exact match with approved contract commitments (₹0 variance).";
  } else if (variancePaise < 0n) {
    varianceStatus = "UNDER_BUDGET";
    explanation = `Favorable variance: Invoiced total is below committed contract budget.`;
  } else {
    varianceStatus = "OVER_BUDGET";
    requiresFinanceApproval = true;
    explanation = `Overrun detected: Invoice exceeds approved commitments. Requires explicit finance sign-off.`;
  }

  const remainingPayablePaise =
    params.invoicedTotalPaise > params.paidToDatePaise
      ? params.invoicedTotalPaise - params.paidToDatePaise
      : 0n;

  const variancePercentage =
    totalApprovedCommitmentPaise > 0n
      ? Number((variancePaise * 10000n) / totalApprovedCommitmentPaise) / 100
      : 0;

  return {
    contractAmountPaise: params.contractAmountPaise,
    approvedExtrasPaise: approvedExtras,
    totalApprovedCommitmentPaise,
    invoicedTotalPaise: params.invoicedTotalPaise,
    paidToDatePaise: params.paidToDatePaise,
    remainingPayablePaise,
    variancePaise,
    varianceStatus,
    variancePercentage,
    requiresFinanceApproval,
    explanation,
  };
}

describe("Deterministic Invoice Reconciliation Engine", () => {
  it("approves exact match with zero variance without requiring approval flag", () => {
    // Contract: ₹80,00,000 (800,000,000 paise), Invoiced: ₹80,00,000
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 800000000n,
      approvedExtrasPaise: 0n,
      invoicedTotalPaise: 800000000n,
      paidToDatePaise: 400000000n,
    });

    expect(result.varianceStatus).toBe("EXACT_MATCH");
    expect(result.variancePaise).toBe(0n);
    expect(result.variancePercentage).toBe(0);
    expect(result.requiresFinanceApproval).toBe(false);
    expect(result.remainingPayablePaise).toBe(400000000n);
  });

  it("handles approved scope extras that expand commitment legitimately", () => {
    // Contract: ₹80,00,000, Approved Extra: ₹2,40,000 (24,000,000 paise)
    // Invoiced: ₹82,40,000 (824,000,000 paise)
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 800000000n,
      approvedExtrasPaise: 24000000n,
      invoicedTotalPaise: 824000000n,
      paidToDatePaise: 0n,
      approvedExtrasAllowed: true,
    });

    expect(result.totalApprovedCommitmentPaise).toBe(824000000n);
    expect(result.varianceStatus).toBe("EXACT_MATCH");
    expect(result.variancePaise).toBe(0n);
    expect(result.requiresFinanceApproval).toBe(false);
    expect(result.remainingPayablePaise).toBe(824000000n);
  });

  it("flags favorable under-budget variance without blocking approval", () => {
    // Contract: ₹35,00,000, Invoiced: ₹33,50,000 (vendor discount/unutilized item)
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 350000000n,
      approvedExtrasPaise: 0n,
      invoicedTotalPaise: 335000000n,
      paidToDatePaise: 175000000n,
    });

    expect(result.varianceStatus).toBe("UNDER_BUDGET");
    expect(result.variancePaise).toBe(-15000000n); // ₹1.5 Lakh favorable
    expect(result.variancePercentage).toBeCloseTo(-4.28, 1);
    expect(result.requiresFinanceApproval).toBe(false);
    expect(result.remainingPayablePaise).toBe(160000000n);
  });

  it("STRICT INVARIANT: flags positive overrun variance and requires explicit finance sign-off", () => {
    // Contract: ₹20,00,000 (200,000,000 paise)
    // Invoiced: ₹22,50,000 (225,000,000 paise) — unapproved ₹2.5 Lakh overrun
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 200000000n,
      approvedExtrasPaise: 0n,
      invoicedTotalPaise: 225000000n,
      paidToDatePaise: 100000000n,
    });

    expect(result.varianceStatus).toBe("OVER_BUDGET");
    expect(result.variancePaise).toBe(25000000n);
    expect(result.variancePercentage).toBe(12.5);
    // MUST require finance approval; never auto-approved
    expect(result.requiresFinanceApproval).toBe(true);
    expect(result.explanation).toContain("Overrun detected");
  });

  it("disallows approved extras when approvedExtrasAllowed option is false", () => {
    // Contract: ₹80,00,000, Extras: ₹2,40,000, Invoiced: ₹82,40,000
    // With approvedExtrasAllowed = false, total commitment remains ₹80,00,000
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 800000000n,
      approvedExtrasPaise: 24000000n,
      invoicedTotalPaise: 824000000n,
      paidToDatePaise: 0n,
      approvedExtrasAllowed: false,
    });

    expect(result.totalApprovedCommitmentPaise).toBe(800000000n);
    expect(result.varianceStatus).toBe("OVER_BUDGET");
    expect(result.variancePaise).toBe(24000000n);
    expect(result.requiresFinanceApproval).toBe(true);
  });

  it("guarantees remainingPayable does not drop below zero when overpaid", () => {
    // Total invoiced: ₹10,00,000, Paid: ₹10,00,000
    const result = evaluateInvoiceReconciliation({
      contractAmountPaise: 100000000n,
      approvedExtrasPaise: 0n,
      invoicedTotalPaise: 100000000n,
      paidToDatePaise: 120000000n, // Edge case: paid more than invoice
    });

    expect(result.remainingPayablePaise).toBe(0n);
  });
});
