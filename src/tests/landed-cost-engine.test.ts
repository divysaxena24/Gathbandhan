/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  calculateLandedCost,
  calculateGuestSensitivity,
} from "@/modules/vendors/services/landed-cost-engine";
import { Quote } from "@/modules/vendors/types";

describe("Landed Cost Engine", () => {
  const mockCateringQuote: Quote & { vendor: { name: string } } = {
    id: "quote-1",
    quoteRequestId: "req-1",
    vendorId: "vendor-1",
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
    travelFeePaise: BigInt(5000000), // ₹50,000 travel fee = 5,000,000 paise
    overtimeHourlyRatePaise: BigInt(1500000), // ₹15,000/hr = 1,500,000 paise
    taxRule: "GST_5",
    serviceChargeRule: "NONE",
    notes: "Luxury Rajasthani royal menu",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    vendor: { name: "Royal Rajasthani Caterers" } as any,
    items: [
      {
        id: "item-1",
        quoteId: "quote-1",
        name: "Royal Thali Buffet",
        category: "Food",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(300000), // ₹3,000 per plate = 300,000 paise
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00", // 5% GST
        serviceChargePercent: "5.00", // 5% Service charge
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "item-2",
        quoteId: "quote-1",
        name: "Welcome Drink Counter",
        category: "Beverage",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(50000), // ₹500 per plate = 50,000 paise
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "item-3",
        quoteId: "quote-1",
        name: "Vintage Brass Counters & Chafing Setup",
        category: "Equipment",
        quantity: 1,
        unit: "setup",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(10000000), // ₹1,00,000 fixed charge = 10,000,000 paise
        isPerGuest: false,
        taxPercent: "18.00", // 18% GST on equipment
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  it("calculates exact landed cost for 400 guests without overtime", () => {
    const result = calculateLandedCost(mockCateringQuote, { guestCount: 400 });

    // Item 1: Royal Thali Buffet (400 guests @ ₹3,000 = ₹12,00,000 = 120,000,000 paise)
    // Service charge (5%): ₹60,000 = 6,000,000 paise
    // GST (5% on ₹12,60,000): ₹63,000 = 6,300,000 paise
    // Item 1 Total: ₹13,23,000 = 132,300,000 paise
    const item1 = result.itemBreakdowns.find((i) => i.id === "item-1")!;
    expect(item1.subtotalPaise).toBe(BigInt(120000000));
    expect(item1.serviceChargePaise).toBe(BigInt(6000000));
    expect(item1.taxPaise).toBe(BigInt(6300000));
    expect(item1.totalPaise).toBe(BigInt(132300000));

    // Item 2: Welcome Drink (400 guests @ ₹500 = ₹2,00,000 = 20,000,000 paise)
    // Service charge (0%): 0 paise
    // GST (5% on ₹2,00,000): ₹10,000 = 1,000,000 paise
    // Item 2 Total: ₹2,10,000 = 21,000,000 paise
    const item2 = result.itemBreakdowns.find((i) => i.id === "item-2")!;
    expect(item2.subtotalPaise).toBe(BigInt(20000000));
    expect(item2.taxPaise).toBe(BigInt(1000000));
    expect(item2.totalPaise).toBe(BigInt(21000000));

    // Item 3: Equipment Setup (Fixed ₹1,00,000 = 10,000,000 paise)
    // GST (18% on ₹1,00,000): ₹18,000 = 1,800,000 paise
    // Item 3 Total: ₹1,18,000 = 11,800,000 paise
    const item3 = result.itemBreakdowns.find((i) => i.id === "item-3")!;
    expect(item3.subtotalPaise).toBe(BigInt(10000000));
    expect(item3.taxPaise).toBe(BigInt(1800000));
    expect(item3.totalPaise).toBe(BigInt(11800000));

    // Total Items: 132,300,000 + 21,000,000 + 11,800,000 = 165,100,000 paise (₹16,51,000)
    // Travel Fee: 5,000,000 paise (₹50,000)
    // Total Landed Cost: 170,100,000 paise (₹17,01,000)
    expect(result.travelFeePaise).toBe(BigInt(5000000));
    expect(result.overtimePaise).toBe(BigInt(0));
    expect(result.totalLandedCostPaise).toBe(BigInt(170100000));

    // Effective Cost per Guest: 170,100,000 / 400 = 425,250 paise (₹4,252.50)
    expect(result.costPerGuestPaise).toBe(BigInt(425250));
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("calculates landed cost with overtime hours", () => {
    // 2 hours of overtime @ ₹15,000/hr = ₹30,000 = 3,000,000 paise
    const result = calculateLandedCost(mockCateringQuote, {
      guestCount: 400,
      overtimeHours: 2,
    });

    expect(result.overtimePaise).toBe(BigInt(3000000));
    expect(result.totalLandedCostPaise).toBe(BigInt(173100000));
  });

  it("calculates guest sensitivity across multiple scenarios (250, 400, 600)", () => {
    const scenarios = calculateGuestSensitivity(mockCateringQuote, [250, 400, 600]);
    expect(scenarios).toHaveLength(3);

    // Landed cost must strictly scale monotonically with guest count
    expect(scenarios[0].totalLandedCostPaise).toBeLessThan(scenarios[1].totalLandedCostPaise);
    expect(scenarios[1].totalLandedCostPaise).toBeLessThan(scenarios[2].totalLandedCostPaise);

    // Fixed costs amortize across higher guest counts, so cost per guest should decrease
    expect(scenarios[2].costPerGuestPaise).toBeLessThan(scenarios[0].costPerGuestPaise);
  });
});
