/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  detectInclusionGaps,
  scoreQuotes,
  compareQuotes,
} from "@/modules/vendors/services/comparison-engine";
import { Quote } from "@/modules/vendors/types";

describe("Comparison Engine", () => {
  const quoteA: Quote & {
    vendor: { name: string; averageRating: string | null; totalWeddings: number };
  } = {
    id: "quote-a",
    quoteRequestId: "req-1",
    vendorId: "vendor-a",
    status: "VERIFIED",
    submittedAt: new Date(),
    validUntil: new Date(),
    currency: "INR",
    rawDocumentUrl: null,
    rawDocumentName: null,
    rawDocumentText: null,
    extractionStatus: "COMPLETED",
    confidenceScore: "0.95",
    extractionNotes: null,
    reviewedById: "user-1",
    reviewedAt: new Date(),
    basePricePaise: BigInt(0),
    travelFeePaise: BigInt(0),
    overtimeHourlyRatePaise: BigInt(0),
    taxRule: "GST_18",
    serviceChargeRule: "NONE",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    vendor: {
      name: "Vendor Alpha",
      averageRating: "4.90",
      totalWeddings: 25,
    } as any,
    items: [
      {
        id: "a-1",
        quoteId: "quote-a",
        name: "Stage & Mandap Setup",
        category: "Structures",
        quantity: 1,
        unit: "setup",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(50000000), // ₹5,00,000 = 50,000,000 paise
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "a-2",
        quoteId: "quote-a",
        name: "Sound & DJ Trussing",
        category: "Audio",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(20000000), // ₹2,00,000 = 20,000,000 paise
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "a-3",
        quoteId: "quote-a",
        name: "Generator Fuel Backup",
        category: "Power",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(5000000),
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const quoteB: Quote & {
    vendor: { name: string; averageRating: string | null; totalWeddings: number };
  } = {
    id: "quote-b",
    quoteRequestId: "req-1",
    vendorId: "vendor-b",
    status: "NEEDS_REVIEW", // Extracted, not yet reviewed
    submittedAt: new Date(),
    validUntil: new Date(),
    currency: "INR",
    rawDocumentUrl: null,
    rawDocumentName: null,
    rawDocumentText: null,
    extractionStatus: "COMPLETED",
    confidenceScore: "0.82",
    extractionNotes: null,
    reviewedById: null,
    reviewedAt: null,
    basePricePaise: BigInt(0),
    travelFeePaise: BigInt(0),
    overtimeHourlyRatePaise: BigInt(0),
    taxRule: "GST_18",
    serviceChargeRule: "NONE",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    vendor: {
      name: "Vendor Beta",
      averageRating: "4.40",
      totalWeddings: 8,
    } as any,
    items: [
      {
        id: "b-1",
        quoteId: "quote-b",
        name: "Stage & Mandap Setup",
        category: "Structures",
        quantity: 1,
        unit: "setup",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(40000000), // ₹4,00,000 = 40,000,000 paise (cheaper base)
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "b-2",
        quoteId: "quote-b",
        name: "Sound & DJ Trussing",
        category: "Audio",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(15000000),
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "OPTIONAL", // Optional add-on!
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "b-3",
        quoteId: "quote-b",
        name: "Generator Fuel Backup",
        category: "Power",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(0),
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "EXCLUDED", // Excluded!
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  it("detects inclusion gaps across competing quotes", () => {
    const gaps = detectInclusionGaps([quoteA, quoteB]);

    // Generator Fuel Backup is INCLUDED in A but EXCLUDED in B
    const genGap = gaps.find((g) => g.itemName === "Generator Fuel Backup")!;
    expect(genGap).toBeDefined();
    expect(genGap.statusByQuote["quote-a"]).toBe("INCLUDED");
    expect(genGap.statusByQuote["quote-b"]).toBe("EXCLUDED");
    expect(genGap.riskDescription).toContain("Explicitly excluded");

    // Sound & DJ Trussing is INCLUDED in A but OPTIONAL in B
    const soundGap = gaps.find((g) => g.itemName === "Sound & DJ Trussing")!;
    expect(soundGap).toBeDefined();
    expect(soundGap.statusByQuote["quote-b"]).toBe("OPTIONAL");
  });

  it("calculates multi-criteria weighted scores and penalizes unreviewed quotes", () => {
    const scores = scoreQuotes([quoteA, quoteB], { guestCount: 400 });

    expect(scores).toHaveLength(2);

    const scoreA = scores.find((s) => s.quoteId === "quote-a")!;
    const scoreB = scores.find((s) => s.quoteId === "quote-b")!;

    // Quote A has 100% inclusions
    expect(scoreA.inclusionsScore).toBe(100);

    // Quote B has only 1 of 3 items included (33%)
    expect(scoreB.inclusionsScore).toBeLessThan(50);

    // Quote B is NEEDS_REVIEW, so it receives a reliability penalty and warning flag
    expect(scoreB.flags).toContain("Extracted quote requires human review before selection");

    // Quote A with higher rating and full inclusions should rank #1
    expect(scoreA.rank).toBe(1);
    expect(scoreB.rank).toBe(2);
  });

  it("runs full side-by-side comparison", () => {
    const comparison = compareQuotes(
      [quoteA, quoteB],
      "req-1",
      "wed-1",
      "DECORATION",
      { guestCount: 400 }
    );

    expect(comparison.quotes).toHaveLength(2);
    expect(comparison.scores).toHaveLength(2);
    expect(comparison.inclusionGaps.length).toBeGreaterThan(0);
  });
});
