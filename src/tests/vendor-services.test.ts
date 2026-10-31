import { describe, it, expect } from "vitest";
import { extractQuoteFromText } from "@/modules/vendors/services/extraction-adapter";
import {
  createVendorSchema,
  createQuoteRequestSchema,
  reviewQuoteSchema,
} from "@/modules/vendors/validation";

describe("Vendor & Quote Services", () => {
  describe("Extraction Adapter", () => {
    it("extracts catering items, detects 5% GST, and flags for human review", async () => {
      const sampleText = `
        Royal Rajasthani Caterers - Wedding Proposal
        Guest estimate: 400 guests
        Grand Rajasthani Royal Buffet: ₹3,200 per plate
        Includes welcome drinks and live food counters.
        Midnight snacks available.
        Outstation travel and logistics: ₹35,000.
      `;

      const result = await extractQuoteFromText(sampleText, "royal_caterers.pdf");

      expect(result.requiresReview).toBe(true);
      expect(result.suggestedTaxRule).toBe("GST_5");
      expect(result.items.length).toBeGreaterThanOrEqual(2);

      const buffetItem = result.items.find((i) => i.name.includes("Buffet"))!;
      expect(buffetItem).toBeDefined();
      expect(buffetItem.isPerGuest).toBe(true);
      expect(buffetItem.unitPricePaise).toBe(BigInt(320000)); // ₹3,200
      expect(buffetItem.taxPercent).toBe(5);
    });

    it("extracts decor proposal with 18% GST and identifies exclusions", async () => {
      const sampleText = `
        Lakeside Decor Studio
        Palace Mandap setup with imported exotic florals.
        Ambient trussing & lighting included.
        Generator fuel charged as per actuals (excluded from base package).
      `;

      const result = await extractQuoteFromText(sampleText, "decor_quote.pdf");

      expect(result.requiresReview).toBe(true);
      expect(result.suggestedTaxRule).toBe("GST_18");

      const mandapItem = result.items.find((i) => i.name.includes("Mandap"))!;
      expect(mandapItem).toBeDefined();
      expect(mandapItem.fixedChargePaise).toBeGreaterThan(BigInt(0));

      const genItem = result.items.find((i) => i.name.includes("Generator"))!;
      expect(genItem.inclusionStatus).toBe("EXCLUDED");
    });
  });

  describe("Validation Schemas", () => {
    it("validates vendor creation", () => {
      const valid = createVendorSchema.safeParse({
        name: "Maharaja Feast Catering",
        category: "CATERING",
        phone: "+919876543210",
        city: "Udaipur",
      });
      expect(valid.success).toBe(true);

      const invalid = createVendorSchema.safeParse({
        name: "X", // too short
        category: "INVALID_CAT",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates quote request creation with budget in paise", () => {
      const valid = createQuoteRequestSchema.safeParse({
        weddingId: "123e4567-e89b-12d3-a456-426614174000",
        category: "DECORATION",
        title: "Royal Mandap & Floral Decor",
        targetBudgetPaise: "50000000",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.targetBudgetPaise).toBe(BigInt(50000000));
      }
    });

    it("validates reviewQuoteSchema allowing status transition to VERIFIED", () => {
      const valid = reviewQuoteSchema.safeParse({
        status: "VERIFIED",
        notes: "Planner reviewed and confirmed all line items with vendor",
      });
      expect(valid.success).toBe(true);
    });
  });
});
