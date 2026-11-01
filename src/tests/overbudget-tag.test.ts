import { describe, it, expect } from "vitest";
import {
  resolveClientBudgetPaise,
  compareBudgets,
  BUDGET_RANGE_CEILINGS_PAISE,
  formatPaiseToINR,
} from "@/lib/services/budget-comparison";

describe("Budget Comparison & Overbudget Tag Detection", () => {
  describe("resolveClientBudgetPaise", () => {
    it("resolves budget range ceilings accurately in paise", () => {
      expect(resolveClientBudgetPaise("below_25_lakh")).toBe(250000000n); // ₹25L
      expect(resolveClientBudgetPaise("25_50_lakh")).toBe(500000000n);   // ₹50L
      expect(resolveClientBudgetPaise("50_lakh_1_crore")).toBe(1000000000n); // ₹1Cr
      expect(resolveClientBudgetPaise("1_2_crore")).toBe(2000000000n);   // ₹2Cr
      expect(resolveClientBudgetPaise("2_5_crore")).toBe(5000000000n);   // ₹5Cr
    });

    it("prioritizes custom explicit client target budget over budget range", () => {
      const customPaise = 350000000n; // ₹35L
      expect(resolveClientBudgetPaise("below_25_lakh", customPaise)).toBe(350000000n);
      expect(resolveClientBudgetPaise("25_50_lakh", "400000000")).toBe(400000000n);
    });

    it("returns null when budget range is flexible/not decided and no custom budget given", () => {
      expect(resolveClientBudgetPaise("not_decided")).toBeNull();
      expect(resolveClientBudgetPaise(undefined, null)).toBeNull();
    });
  });

  describe("compareBudgets", () => {
    it("flags isOverBudget: true when estimated budget exceeds client budget", () => {
      // Estimated: ₹65 Lakhs (650,000,000 paise)
      // Client Budget: ₹50 Lakhs (500,000,000 paise via 25_50_lakh)
      const res = compareBudgets(650000000n, null, "25_50_lakh");

      expect(res.isOverBudget).toBe(true);
      expect(res.overBudgetPaise).toBe(150000000n); // ₹15 Lakhs over
      expect(res.clientBudgetPaise).toBe(500000000n);
      expect(res.percentageOver).toBe(30); // 30% over budget
      expect(res.formattedDifference).toContain("15,00,000");
    });

    it("flags isOverBudget: true when estimated exceeds custom client target", () => {
      // Estimated: ₹45 Lakhs (450,000,000 paise)
      // Client Budget: ₹30 Lakhs (300,000,000 paise)
      const res = compareBudgets("450000000", "300000000");

      expect(res.isOverBudget).toBe(true);
      expect(res.overBudgetPaise).toBe(150000000n);
      expect(res.percentageOver).toBe(50);
    });

    it("flags isOverBudget: false when estimated budget is within or equal to client budget", () => {
      // Estimated: ₹40 Lakhs (400,000,000 paise)
      // Client Budget: ₹50 Lakhs (500,000,000 paise via 25_50_lakh)
      const resUnder = compareBudgets(400000000n, null, "25_50_lakh");
      expect(resUnder.isOverBudget).toBe(false);
      expect(resUnder.overBudgetPaise).toBe(0n);
      expect(resUnder.percentageOver).toBe(0);

      // Exact match: ₹50 Lakhs
      const resExact = compareBudgets(500000000n, 500000000n);
      expect(resExact.isOverBudget).toBe(false);
      expect(resExact.overBudgetPaise).toBe(0n);
    });

    it("handles zero or null client budget safely without throwing", () => {
      const resNoBudget = compareBudgets(450000000n, null, "not_decided");
      expect(resNoBudget.isOverBudget).toBe(false);
      expect(resNoBudget.clientBudgetPaise).toBeNull();
      expect(resNoBudget.overBudgetPaise).toBe(0n);
    });
  });

  describe("formatPaiseToINR", () => {
    it("formats paise integers to formatted Indian Rupees correctly", () => {
      expect(formatPaiseToINR(1000000000n)).toContain("1,00,00,000");
      expect(formatPaiseToINR(250000000n)).toContain("25,00,000");
      expect(formatPaiseToINR(0n)).toBe("₹0");
      expect(formatPaiseToINR(null)).toBe("₹0");
    });
  });
});
