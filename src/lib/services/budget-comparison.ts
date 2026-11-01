// ============================================================
// Gathbandhan — Budget Comparison & Overbudget Detection Engine
// Compares estimated wedding budget against client target budget
// ============================================================

import { BudgetRange } from "@/types/wedding";

/**
 * Standard ceiling values for each client budget tier in integer paise (1 INR = 100 paise)
 */
export const BUDGET_RANGE_CEILINGS_PAISE: Record<string, bigint> = {
  below_25_lakh: 250000000n,      // ₹25 Lakhs (25,00,000 INR)
  "25_50_lakh": 500000000n,       // ₹50 Lakhs (50,00,000 INR)
  "50_lakh_1_crore": 1000000000n, // ₹1 Crore (1,00,00,000 INR)
  "1_2_crore": 2000000000n,       // ₹2 Crores (2,00,00,000 INR)
  "2_5_crore": 5000000000n,       // ₹5 Crores (5,00,00,000 INR)
  above_5_crore: 5000000000n,     // ₹5 Crores baseline (5,00,00,000 INR)
};

export const BUDGET_RANGE_LABELS: Record<string, string> = {
  below_25_lakh: "Under ₹25 Lakhs",
  "25_50_lakh": "₹25 Lakhs – ₹50 Lakhs",
  "50_lakh_1_crore": "₹50 Lakhs – ₹1 Crore",
  "1_2_crore": "₹1 Crore – ₹2 Crores",
  "2_5_crore": "₹2 Crores – ₹5 Crores",
  above_5_crore: "₹5 Crores+",
  not_decided: "Flexible / Guidance Requested",
};

export interface BudgetComparisonResult {
  estimatedBudgetPaise: bigint;
  clientBudgetPaise: bigint | null;
  isOverBudget: boolean;
  overBudgetPaise: bigint;
  differencePaise: bigint; // estimated - client (positive if over, negative if under)
  percentageOver: number;
  formattedEstimated: string;
  formattedClientBudget: string | null;
  formattedDifference: string;
  formattedOverBudget: string;
}

/**
 * Formats integer paise into a human-readable Indian Rupee string (₹X,XX,XXX)
 */
export function formatPaiseToINR(paise: bigint | number | string | null | undefined): string {
  if (paise === null || paise === undefined || paise === "") return "₹0";
  try {
    const p = typeof paise === "bigint" ? paise : BigInt(String(paise).split(".")[0]);
    const inr = Number(p) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(inr);
  } catch {
    return "₹0";
  }
}

/**
 * Resolves the client's budget ceiling in integer paise from either an explicit number
 * or a selected budget range.
 */
export function resolveClientBudgetPaise(
  budgetRange?: string | null,
  customClientBudget?: string | number | bigint | null
): bigint | null {
  // 1. Explicit numeric target budget takes priority if provided
  if (customClientBudget !== undefined && customClientBudget !== null && customClientBudget !== "") {
    try {
      const val = typeof customClientBudget === "bigint"
        ? customClientBudget
        : BigInt(String(customClientBudget).split(".")[0]);
      if (val > 0n) return val;
    } catch {
      // Fall through to range mapping
    }
  }

  // 2. Budget range ceiling lookup
  if (budgetRange && BUDGET_RANGE_CEILINGS_PAISE[budgetRange]) {
    return BUDGET_RANGE_CEILINGS_PAISE[budgetRange];
  }

  return null;
}

/**
 * Compares our calculated estimated budget against the client budget.
 * Returns true for `isOverBudget` if estimatedBudget > clientBudget.
 */
export function compareBudgets(
  estimatedBudgetInput: string | number | bigint | null | undefined,
  clientBudgetInput?: string | number | bigint | null,
  budgetRange?: string | null
): BudgetComparisonResult {
  let estimated = 0n;
  try {
    if (estimatedBudgetInput !== null && estimatedBudgetInput !== undefined && estimatedBudgetInput !== "") {
      estimated = typeof estimatedBudgetInput === "bigint"
        ? estimatedBudgetInput
        : BigInt(String(estimatedBudgetInput).split(".")[0]);
    }
  } catch {
    estimated = 0n;
  }

  const clientBudget = resolveClientBudgetPaise(budgetRange, clientBudgetInput);

  if (!clientBudget || clientBudget <= 0n) {
    return {
      estimatedBudgetPaise: estimated,
      clientBudgetPaise: null,
      isOverBudget: false,
      overBudgetPaise: 0n,
      differencePaise: 0n,
      percentageOver: 0,
      formattedEstimated: formatPaiseToINR(estimated),
      formattedClientBudget: null,
      formattedDifference: "₹0",
      formattedOverBudget: "₹0",
    };
  }

  const differencePaise = estimated - clientBudget;
  const isOverBudget = differencePaise > 0n;
  const overBudgetPaise = isOverBudget ? differencePaise : 0n;
  const percentageOver =
    isOverBudget && clientBudget > 0n
      ? Math.round(Number((overBudgetPaise * 10000n) / clientBudget)) / 100
      : 0;

  return {
    estimatedBudgetPaise: estimated,
    clientBudgetPaise: clientBudget,
    isOverBudget,
    overBudgetPaise,
    differencePaise,
    percentageOver,
    formattedEstimated: formatPaiseToINR(estimated),
    formattedClientBudget: formatPaiseToINR(clientBudget),
    formattedDifference: formatPaiseToINR(
      overBudgetPaise > 0n ? overBudgetPaise : -differencePaise
    ),
    formattedOverBudget: formatPaiseToINR(overBudgetPaise),
  };
}
