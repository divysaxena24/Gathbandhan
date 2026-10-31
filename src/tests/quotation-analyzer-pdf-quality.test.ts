import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import zlib from "zlib";
import fs from "fs";
import path from "path";
import {
  generatePdfReport,
  resolveCleanCategory,
  getConfidenceDescription,
  truncateWithEllipsis,
} from "@/lib/reports/pdf-report-service";
import { compareAnalyzedQuotations } from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";

function decodeHex(hexStr: string): string {
  let str = "";
  for (let i = 0; i < hexStr.length; i += 2) {
    str += String.fromCharCode(parseInt(hexStr.substring(i, i + 2), 16));
  }
  return str;
}

function extractPdfText(loadedDoc: PDFDocument, pageIndex: number): string {
  const page = loadedDoc.getPage(pageIndex);
  const contentsRef = page.node.get(page.node.context.obj("Contents"));
  const target = loadedDoc.context.lookup(contentsRef);
  const streams: any[] = [];
  const targetAny = target as any;
  if (targetAny && typeof targetAny.size === "function") {
    for (let i = 0; i < targetAny.size(); i++) {
      streams.push(loadedDoc.context.lookup(targetAny.get(i)));
    }
  } else if (target) {
    streams.push(target);
  }

  let fullText = "";
  for (const s of streams) {
    if (!s || !s.contents) continue;
    let raw = Buffer.from(s.contents);
    try {
      raw = zlib.inflateSync(raw);
    } catch {
      // uncompressed
    }
    const str = raw.toString("latin1");
    const hexMatches = str.match(/<([0-9a-fA-F]+)>/g);
    if (hexMatches) {
      for (const hm of hexMatches) {
        fullText += " " + decodeHex(hm.slice(1, -1));
      }
    }
    const litMatches = str.match(/\(([^)]+)\)/g);
    if (litMatches) {
      for (const lm of litMatches) {
        fullText += " " + lm.slice(1, -1);
      }
    }
  }
  return fullText;
}

function createMockVendor(params: {
  uploadId: string;
  vendorName: string;
  category?: string;
  currency?: string;
  grandTotal: number;
  calculatedTotal?: number;
  inclusionsCount?: number;
  deliverablesCount?: number;
  exclusionsCount?: number;
  advancePercentage?: number;
  cancellationTerms?: string;
  isMathValid?: boolean;
}): QuotationAnalysisResult {
  const lineItems = [
    {
      description: "Complete Premium Wedding Catering Package with Multi-Cuisine Live Food Stations and Royal Service",
      quantity: 500,
      unit: "guests",
      unitPrice: Math.round(params.grandTotal / 500),
      statedAmount: params.grandTotal,
      sourcePage: 1,
      evidenceSnippet: "500 guests complete catering package",
      isExplicit: true,
    },
  ];

  return {
    success: true,
    uploadId: params.uploadId,
    originalName: `${params.vendorName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    analyzedAt: new Date().toISOString(),
    modelUsed: "mock-model",
    vendorDetails: {
      vendorName: params.vendorName,
      category: params.category || "Wedding Catering",
      contactPhone: "+91 9876543210",
      contactEmail: "info@vendor.com",
      address: "Mumbai, Maharashtra, India",
      website: "https://vendor.com",
      quotationNumber: `QT-${params.uploadId}`,
      quotationDate: "2026-10-15",
      validityDate: "2026-11-15",
      sourcePage: 1,
      evidenceSnippet: "Quotation issued by vendor for royal wedding celebration",
    },
    commercialDetails: {
      currency: params.currency || "INR",
      lineItems,
      statedSubtotal: params.grandTotal,
      discounts: [],
      totalDiscount: 0,
      taxes: [
        {
          description: "GST",
          ratePercent: 5,
          statedAmount: params.grandTotal * 0.05,
          sourcePage: 1,
          evidenceSnippet: "5% GST applicable",
        },
      ],
      totalTax: params.grandTotal * 0.05,
      additionalCharges: [],
      statedGrandTotal: params.grandTotal * 1.05,
      paymentSchedule: [
        {
          milestone: "Advance Booking Deposit Required at Contract Execution",
          percentage: params.advancePercentage || 25,
          statedAmount: Math.round(params.grandTotal * ((params.advancePercentage || 25) / 100)),
          dueDate: "Upon signing",
          sourcePage: 2,
          evidenceSnippet: "Advance deposit required on signing",
        },
        {
          milestone: "Midway Milestone Payment upon Final Menu Confirmation and Tasting",
          percentage: 50,
          statedAmount: Math.round(params.grandTotal * 0.5),
          dueDate: "30 days prior to event",
          sourcePage: 2,
          evidenceSnippet: "50% due 30 days prior",
        },
        {
          milestone: "Final Balance Settlement Prior to Event Dispatch",
          percentage: 25,
          statedAmount: Math.round(params.grandTotal * 0.25),
          dueDate: "7 days prior to event",
          sourcePage: 2,
          evidenceSnippet: "Final settlement 7 days prior",
        },
      ],
      advancePayment: {
        percentage: params.advancePercentage || 25,
        amount: Math.round(params.grandTotal * ((params.advancePercentage || 25) / 100)),
        terms: "Advance deposit on contract execution",
        sourcePage: 2,
      },
      cancellationTerms:
        params.cancellationTerms ||
        "100% refund if cancelled > 60 days; 50% refund between 30 and 60 days; strictly non-refundable inside 14 days of wedding.",
      refundTerms: "Refunds processed within 14 business days via bank transfer.",
      specialConditions: ["Client provides dry storage and electrical connection."],
    },
    serviceDetails: {
      servicesIncluded: Array.from({ length: params.inclusionsCount || 6 }, (_, i) => ({
        text: `Included Wedding Service Scope Benefit ${i + 1} with Full Setup and Staffing`,
        sourcePage: 1,
        evidence: `Included benefit ${i + 1}`,
      })),
      servicesExcluded: Array.from({ length: params.exclusionsCount || 2 }, (_, i) => ({
        text: `Excluded Item ${i + 1} (Client obligation)`,
        sourcePage: 2,
        evidence: `Excluded item ${i + 1}`,
      })),
      deliverables: Array.from({ length: params.deliverablesCount || 3 }, (_, i) => ({
        text: `Tangible Physical Deliverable ${i + 1}`,
        sourcePage: 2,
        evidence: `Deliverable ${i + 1}`,
      })),
      guestLimit: 500,
      eventDates: ["2026-12-15"],
      coverageHours: 8,
      setupDetails: "Setup starts 5 hours prior to event",
      dismantlingDetails: "Dismantled within 2 hours post event",
      overtimeCharges: "Rs. 15,000 / hour beyond 8 hours duration",
      optionalAddons: [],
    },
    financialAudit: {
      isValid: params.isMathValid ?? true,
      statedSubtotal: params.grandTotal,
      statedGrandTotal: params.grandTotal * 1.05,
      calculatedSubtotal: params.calculatedTotal || params.grandTotal,
      subtotalDiscrepancy: params.isMathValid === false ? 5000 : 0,
      subtotalMatches: params.isMathValid ?? true,
      grandTotalMatches: params.isMathValid ?? true,
      calculatedGrandTotal: (params.calculatedTotal || params.grandTotal) * 1.05,
      grandTotalDiscrepancy: params.isMathValid === false ? 5250 : 0,
      lineItemAudits: [],
      hasLineItemDiscrepancies: params.isMathValid === false,
      missingInformationFlags: [],
      
      discrepancyFlags:
        params.isMathValid === false
          ? [
              {
                type: "SUBTOTAL_MISMATCH",
                severity: "warning",
                message: "Calculated subtotal deviates by Rs. 5,000 from stated subtotal",
              },
            ]
          : [],
      auditTimestamp: new Date().toISOString(),
    },
    conflictsAndWarnings: [],
    sourcePageCount: 3,
    missingFields: [],
    error: null,
    meta: {
      uploadId: params.uploadId,
      originalFileName: `${params.vendorName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      extractedAt: new Date().toISOString(),
      pageCount: 3,
    },
  };
}

describe("Final PDF Polish Test Suite (2, 4, and 6 Vendors)", () => {
  it("test with 2 vendors, long names, and lengthy commercial terms produces exactly 6 pages", async () => {
    const v1 = createMockVendor({
      uploadId: "v2_1",
      vendorName: "The Grand Royal Heritage Palace Luxury Hospitality & Gourmet Banquet Services Private Limited",
      grandTotal: 280000,
      inclusionsCount: 8,
      deliverablesCount: 4,
      advancePercentage: 20,
      cancellationTerms:
        "Cancellation prior to 90 calendar days forfeits initial 10% administrative deposit; cancellation between 90 and 45 calendar days forfeits 40% of contracted total; strictly 0% refund inside 30 calendar days of wedding date.",
    });

    const v2 = createMockVendor({
      uploadId: "v2_2",
      vendorName: "Bespoke Culinary Artisans & Premium Event Planners of Western India",
      grandTotal: 220000,
      inclusionsCount: 6,
      deliverablesCount: 2,
      advancePercentage: 35,
      cancellationTerms:
        "50% advance deposit non-refundable on booking; 50% remaining due 14 days prior to event; cancellation anytime incurs full forfeiture of deposit.",
    });

    const comparison = await compareAnalyzedQuotations([v1, v2]);
    expect(comparison.vendors).toHaveLength(2);

    const pdfBuffer = await generatePdfReport({
      comparisonResult: comparison,
      analyzedQuotations: [v1, v2],
      metadata: {
        eventName: "Vikram & Ananya Royal Wedding",
        eventDate: "2026-11-20",
        preparedBy: "Gathbandhan Senior Wedding Concierge",
      },
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuffer));
    expect(loadedPdf.getPageCount()).toBe(6);

    // Page 1 Portrait
    const p1 = loadedPdf.getPage(0);
    expect(p1.getWidth()).toBeCloseTo(595.28, 1);
    expect(p1.getHeight()).toBeCloseTo(841.89, 1);

    // Page 3 Landscape
    const p3 = loadedPdf.getPage(2);
    expect(p3.getWidth()).toBeCloseTo(841.89, 1);
    expect(p3.getHeight()).toBeCloseTo(595.28, 1);

    // Verify Page 4: Transparent Scoring Methodology & Common-Basis Calibrated Score
    const p4Text = extractPdfText(loadedPdf, 3);
    expect(p4Text).toContain("Transparent Weighted Scoring Methodology");
    expect(p4Text).toContain("Common-Basis Calibrated Score");
    expect(p4Text).toContain("SCORING COMPARABILITY");

    // Verify Page 5: Deterministic Financial Audit guarantees rows for all evaluated vendors
    const p5Text = extractPdfText(loadedPdf, 4);
    expect(p5Text).toContain("Deterministic Financial Audit");
    expect(p5Text).toContain("Grand Royal Heritage");
    expect(p5Text).toContain("Bespoke Culinary");
    expect(p5Text).toContain("Verified (100%)");

    // Verify Page 6: Evidence provenance & citation snippets
    const p6Text = extractPdfText(loadedPdf, 5);
    expect(p6Text).toContain("Evidence Provenance");
    expect(p6Text).toContain("Missing Information Alerts by Vendor Proposal");
    expect(p6Text).toContain("Page-Level Quotation Citations");
    expect(p6Text).toContain("Line Item");
    expect(p6Text).toContain("FINAL COMMERCIAL ADVISORY STATEMENT");
  });

  it("test with 4 vendors, varying math validity, and complex terms produces exactly 6 pages", async () => {
    const v1 = createMockVendor({
      uploadId: "v4_1",
      vendorName: "Royal Feast Caterers Private Limited",
      grandTotal: 150000,
      inclusionsCount: 10,
      deliverablesCount: 4,
      isMathValid: true,
      advancePercentage: 20,
    });

    const v2 = createMockVendor({
      uploadId: "v4_2",
      vendorName: "Budget Spice Caterers",
      grandTotal: 95000,
      calculatedTotal: 100000,
      inclusionsCount: 5,
      deliverablesCount: 1,
      isMathValid: false,
      advancePercentage: 50,
    });

    const v3 = createMockVendor({
      uploadId: "v4_3",
      vendorName: "Imperial Maharaja Grand Banquets & Royal Heritage Hospitality",
      grandTotal: 320000,
      inclusionsCount: 16,
      deliverablesCount: 6,
      isMathValid: true,
      advancePercentage: 15,
    });

    const v4 = createMockVendor({
      uploadId: "v4_4",
      vendorName: "Saffron Table Luxury Catering",
      grandTotal: 180000,
      inclusionsCount: 9,
      deliverablesCount: 3,
      isMathValid: true,
      advancePercentage: 30,
    });

    const comparison = await compareAnalyzedQuotations([v1, v2, v3, v4]);
    expect(comparison.vendors).toHaveLength(4);

    const pdfBuffer = await generatePdfReport({
      comparisonResult: comparison,
      analyzedQuotations: [v1, v2, v3, v4],
      metadata: {
        eventName: "Aarav & Meera Luxury Wedding Celebration",
        eventDate: "2026-12-28",
        preparedBy: "Lead Planner Gathbandhan",
      },
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuffer));
    expect(loadedPdf.getPageCount()).toBe(6);

    // Verify Page 5: Guaranteed row for each vendor, flags Budget Spice Caterers math variance
    const p5Text = extractPdfText(loadedPdf, 4);
    expect(p5Text).toContain("Royal Feast");
    expect(p5Text).toContain("Budget Spice");
    expect(p5Text).toContain("Imperial Maharaja");
    expect(p5Text).toContain("Saffron Table");
    expect(p5Text).toContain("Flagged");
    expect(p5Text).toContain("Audit Discrepancy & Arithmetic Mismatch Log");

    // Verify Page 6: Evidence snippets for evaluated vendors
    const p6Text = extractPdfText(loadedPdf, 5);
    expect(p6Text).toContain("Royal Feast");
    expect(p6Text).toContain("Budget Spice");
    expect(p6Text).toContain("Imperial Maharaja");
    expect(p6Text).toContain("Saffron Table");
    expect(p6Text).toContain("FINAL COMMERCIAL ADVISORY STATEMENT");
  });

  it("test with 6 vendors, lengthy commercial terms, and multi-tier pricing produces exactly 6 pages", async () => {
    const v1 = createMockVendor({
      uploadId: "v6_1",
      vendorName: "Alpha Premier Catering Group",
      grandTotal: 120000,
      inclusionsCount: 8,
    });
    const v2 = createMockVendor({
      uploadId: "v6_2",
      vendorName: "Beta Royal Heritage Banquets",
      grandTotal: 150000,
      inclusionsCount: 12,
    });
    const v3 = createMockVendor({
      uploadId: "v6_3",
      vendorName: "Gamma Luxury Gourmet Kitchens",
      grandTotal: 180000,
      inclusionsCount: 14,
    });
    const v4 = createMockVendor({
      uploadId: "v6_4",
      vendorName: "Delta Spice Artisans",
      grandTotal: 90000,
      calculatedTotal: 95000,
      isMathValid: false,
      inclusionsCount: 6,
    });
    const v5 = createMockVendor({
      uploadId: "v6_5",
      vendorName: "Epsilon Elite Wedding Feasts",
      grandTotal: 210000,
      inclusionsCount: 15,
    });
    const v6 = createMockVendor({
      uploadId: "v6_6",
      vendorName: "Zeta Traditional Catering Services",
      grandTotal: 110000,
      inclusionsCount: 7,
    });

    const comparison = await compareAnalyzedQuotations([v1, v2, v3, v4, v5, v6]);
    expect(comparison.vendors).toHaveLength(6);

    const pdfBuffer = await generatePdfReport({
      comparisonResult: comparison,
      analyzedQuotations: [v1, v2, v3, v4, v5, v6],
      metadata: {
        eventName: "Mega 6-Vendor Wedding Evaluation",
        eventDate: "2027-01-15",
        preparedBy: "Gathbandhan Automated Concierge",
      },
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuffer));
    expect(loadedPdf.getPageCount()).toBe(6);

    // Verify Page 5: Guaranteed row for all 6 vendors, flags Delta Spice Artisans
    const p5Text = extractPdfText(loadedPdf, 4);
    expect(p5Text).toContain("Alpha Premier");
    expect(p5Text).toContain("Beta Royal");
    expect(p5Text).toContain("Gamma Luxury");
    expect(p5Text).toContain("Delta Spice");
    expect(p5Text).toContain("Epsilon Elite");
    expect(p5Text).toContain("Zeta Traditional");
    expect(p5Text).toContain("Flagged");
    expect(p5Text).toContain("Audit Discrepancy & Arithmetic Mismatch Log");

    // Verify Page 6: Citations and advisory statement present
    const p6Text = extractPdfText(loadedPdf, 5);
    expect(p6Text).toContain("Evidence Provenance");
    expect(p6Text).toContain("FINAL COMMERCIAL ADVISORY STATEMENT");

    // Save a sample PDF to disk for manual inspection
    const outDir = path.resolve(process.cwd(), "scratch");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, "Gathbandhan_6_Vendor_Comparison_Polished.pdf");
    fs.writeFileSync(outPath, pdfBuffer);
    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.statSync(outPath).size).toBeGreaterThan(15000);
  });

  it("test with missing/incomplete audit data explicitly renders unaudited status without omitting rows", async () => {
    const v1 = createMockVendor({
      uploadId: "v_unaudited_1",
      vendorName: "Heritage Castle Events",
      grandTotal: 100000,
    });
    delete (v1 as any).financialAudit;

    const v2 = createMockVendor({
      uploadId: "v_unaudited_2",
      vendorName: "Grand Pavilion Banquets",
      grandTotal: 120000,
    });
    delete (v2 as any).financialAudit;

    const comparison = await compareAnalyzedQuotations([v1, v2]);
    const pdfBuffer = await generatePdfReport({
      comparisonResult: comparison,
      analyzedQuotations: [], // Client provided no quotation data
    });

    const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuffer));
    expect(loadedPdf.getPageCount()).toBe(6);

    const p5Text = extractPdfText(loadedPdf, 4);
    expect(p5Text).toContain("Heritage Castle Events");
    expect(p5Text).toContain("Grand Pavilion Banquets");
    expect(p5Text).toContain("Unaudited");
  });

  it("verifies truncateWithEllipsis boundary helper", async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont("Helvetica");

    const shortText = "Short Text";
    expect(truncateWithEllipsis(shortText, font, 10, 200)).toBe(shortText);

    const longText = "Very Long Detailed Text That Easily Exceeds Allowed Column Width In The PDF Table";
    const truncated = truncateWithEllipsis(longText, font, 10, 80);
    expect(truncated.endsWith("...")).toBe(true);
    expect(font.widthOfTextAtSize(truncated, 10)).toBeLessThanOrEqual(80);
  });
});
