import { describe, it, expect } from "vitest";
import {
  paiseToRupees,
  rupeesToPaise,
  formatINR,
  formatINRCompact,
} from "@/lib/money";

describe("Money utilities", () => {
  describe("paiseToRupees", () => {
    it("converts paise to rupees", () => {
      expect(paiseToRupees(10000)).toBe(100);
      expect(paiseToRupees(BigInt(20000000000))).toBe(200000000); // 20 crore
      expect(paiseToRupees(150)).toBe(1.5);
      expect(paiseToRupees(0)).toBe(0);
    });
  });

  describe("rupeesToPaise", () => {
    it("converts rupees to paise", () => {
      expect(rupeesToPaise(100)).toBe(BigInt(10000));
      expect(rupeesToPaise(200000000)).toBe(BigInt(20000000000)); // 2 crore
      expect(rupeesToPaise(1.5)).toBe(BigInt(150));
      expect(rupeesToPaise(0)).toBe(BigInt(0));
    });

    it("handles rounding correctly", () => {
      // 99.999 rupees → 9999.9 paise → rounds to 10000 paise
      expect(rupeesToPaise(99.999)).toBe(BigInt(10000));
    });
  });

  describe("formatINR", () => {
    it("formats paise as INR with Indian grouping", () => {
      const result = formatINR(10000);
      expect(result).toContain("100");
    });

    it("formats large amounts", () => {
      const result = formatINR(BigInt(20000000000)); // 2 crore
      expect(result).toContain("20,00,00,000");
    });

    it("formats zero", () => {
      const result = formatINR(0);
      expect(result).toContain("0");
    });
  });

  describe("formatINRCompact", () => {
    it("formats crore amounts", () => {
      const result = formatINRCompact(BigInt(20000000000)); // 2 crore
      expect(result).toContain("Cr");
    });

    it("formats lakh amounts", () => {
      const result = formatINRCompact(BigInt(1500000000)); // 1.5 crore
      expect(result).toContain("Cr");
    });

    it("formats thousands", () => {
      const result = formatINRCompact(5000000); // 50k
      expect(result).toContain("K");
    });

    it("formats small amounts without compact", () => {
      const result = formatINRCompact(5000); // 50 rupees
      expect(result).toContain("50");
    });
  });
});

