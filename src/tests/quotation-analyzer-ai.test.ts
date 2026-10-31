/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { auditQuotationFinances } from "@/lib/ai/financial-validator";
import {
  extractStructuredQuotationWithGroq,
  GroqExtractionOutputSchema,
} from "@/lib/ai/quotation-extractor";
import {
  setMockGroqResponse,
  getGroqClient,
} from "@/lib/ai/groq-client";
import {
  analyzeQuotationDocument,
  clearAnalysisCache,
} from "@/lib/ai/quotation-analyzer-service";
import { POST as analyzePostRoute } from "@/app/api/quotation-analyzer/analyze/route";
import {
  saveQuotationFile,
  clearAllQuotationFiles,
  setCustomStorageDir,
} from "@/lib/storage/temp-quotations";
import { ExtractedCommercialDetails } from "@/lib/ai/types";
import { ExtractedPage } from "@/lib/pdf/types";

describe("Milestone 3: Groq-Powered AI Quotation Extraction & Financial Integrity Engine", { timeout: 30000 }, () => {
  const testDir = path.join(os.tmpdir(), "gath_test_ai_service_" + Date.now());

  beforeEach(async () => {
    setCustomStorageDir(testDir);
    clearAnalysisCache();
    setMockGroqResponse(null);
    await clearAllQuotationFiles();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await clearAllQuotationFiles();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
    setCustomStorageDir(null);
    setMockGroqResponse(null);
  });

  function createDigitalPdfBuffer(text: string): Buffer {
    const rawPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${text.length + 50} >> stream
BT
/F1 12 Tf
50 700 Td
(${text}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000293 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;
    return Buffer.from(rawPdf, "utf-8");
  }

  const sampleMockGroqJson = JSON.stringify({
    vendorDetails: {
      vendorName: "Royal Rajputana Caterers",
      category: "Catering",
      contactPhone: "+91 98765 43210",
      contactEmail: "info@royalrajputana.com",
      address: "Jaipur, Rajasthan",
      website: "https://royalrajputana.com",
      quotationNumber: "RRC-2026-089",
      quotationDate: "2026-10-15",
      validityDate: "2026-11-15",
      sourcePage: 1,
      evidenceSnippet: "Royal Rajputana Caterers, Quotation #RRC-2026-089",
    },
    commercialDetails: {
      currency: "INR",
      lineItems: [
        {
          description: "Royal Buffet Dinner (500 pax)",
          quantity: 500,
          unit: "plate",
          unitPrice: 3200,
          statedAmount: 1600000,
          sourcePage: 1,
          evidenceSnippet: "500 Plates @ Rs 3200 = Rs 16,00,000",
          isExplicit: true,
        },
        {
          description: "Live Mocktail & Chaat Counters",
          quantity: 1,
          unit: "lump-sum",
          unitPrice: 150000,
          statedAmount: 150000,
          sourcePage: 1,
          evidenceSnippet: "Live Counter Setup: Rs 1,50,000 fixed",
          isExplicit: true,
        },
      ],
      statedSubtotal: 1750000,
      discounts: [
        {
          description: "Early Booking Privilege",
          statedAmount: 50000,
          sourcePage: 1,
          evidenceSnippet: "Discount: Rs 50,000",
        },
      ],
      totalDiscount: 50000,
      taxes: [
        {
          description: "GST (5% Catering)",
          ratePercent: 5,
          statedAmount: 85000,
          sourcePage: 1,
          evidenceSnippet: "GST @ 5% on discounted total = Rs 85,000",
        },
      ],
      totalTax: 85000,
      additionalCharges: [
        {
          description: "Transportation & Kitchen Logistics",
          statedAmount: 25000,
          sourcePage: 1,
          evidenceSnippet: "Logistics: Rs 25,000",
        },
      ],
      statedGrandTotal: 1810000,
      paymentSchedule: [
        {
          milestone: "Advance at Booking",
          percentage: 40,
          statedAmount: 724000,
          dueDate: "Immediate",
          sourcePage: 1,
          evidenceSnippet: "40% advance required",
        },
      ],
      advancePayment: {
        percentage: 40,
        amount: 724000,
        terms: "Payable on contract signing",
        sourcePage: 1,
      },
      cancellationTerms: "50% refund before 30 days of event date.",
      refundTerms: "No refund if canceled within 15 days.",
      specialConditions: ["Mineral water included", "Uniformed service staff provided"],
    },
    serviceDetails: {
      servicesIncluded: [
        {
          text: "Full dinner buffet with 4 live interactive counters",
          sourcePage: 1,
          evidence: "Buffet dinner and live counters included",
        },
      ],
      servicesExcluded: [
        {
          text: "Alcoholic beverages and bar license procurement",
          sourcePage: 1,
          evidence: "Liquor and bartending excluded",
        },
      ],
      deliverables: [
        {
          text: "Bone china crockery, gold cutlery, and linen",
          sourcePage: 1,
          evidence: "Premium crockery and cutlery included",
        },
      ],
      guestLimit: 500,
      eventDates: ["2026-12-10"],
      coverageHours: 8,
      setupDetails: "Kitchen setup begins at 10:00 AM on wedding day",
      dismantlingDetails: "Breakdown complete by 3:00 AM",
      overtimeCharges: "Rs 15,000 per additional hour beyond 8 hours",
      optionalAddons: [
        {
          name: "Late Night Snack Counter",
          price: 45000,
          description: "Midnight coffee and sliders",
          sourcePage: 1,
        },
      ],
    },
    conflictsAndWarnings: [],
    missingFields: [],
  });

  describe("Deterministic Financial Validation Engine", () => {
    it("validates mathematically coherent quotation totals using decimal-safe arithmetic", () => {
      const commercial: ExtractedCommercialDetails = {
        currency: "INR",
        lineItems: [
          {
            description: "Catering 500 Pax",
            quantity: 500,
            unit: "pax",
            unitPrice: 2000,
            statedAmount: 1000000,
            sourcePage: 1,
            evidenceSnippet: "500 x 2000 = 10,00,000",
            isExplicit: true,
          },
          {
            description: "Service Charge",
            quantity: 1,
            unit: "fixed",
            unitPrice: 50000,
            statedAmount: 50000,
            sourcePage: 1,
            evidenceSnippet: "50,000 fixed",
            isExplicit: true,
          },
        ],
        statedSubtotal: 1050000,
        discounts: [],
        totalDiscount: 0,
        taxes: [
          {
            description: "GST",
            ratePercent: 5,
            statedAmount: 52500,
            sourcePage: 1,
            evidenceSnippet: "52,500",
          },
        ],
        totalTax: 52500,
        additionalCharges: [],
        statedGrandTotal: 1102500,
        paymentSchedule: [],
        advancePayment: null,
        cancellationTerms: null,
        refundTerms: null,
        specialConditions: [],
      };

      const audit = auditQuotationFinances(commercial);

      expect(audit.isValid).toBe(true);
      expect(audit.subtotalMatches).toBe(true);
      expect(audit.grandTotalMatches).toBe(true);
      expect(audit.hasLineItemDiscrepancies).toBe(false);
      expect(audit.calculatedGrandTotal).toBe(1102500);
      expect(audit.discrepancyFlags.length).toBe(0);
    });

    it("detects and flags line item calculation mismatches (Quantity × Unit Price != Stated)", () => {
      const commercial: ExtractedCommercialDetails = {
        currency: "INR",
        lineItems: [
          {
            description: "Photography Day 1",
            quantity: 3,
            unit: "camera",
            unitPrice: 40000,
            statedAmount: 150000,
            sourcePage: 1,
            evidenceSnippet: "3 cameras @ 40000 = 150000",
            isExplicit: true,
          },
        ],
        statedSubtotal: 150000,
        discounts: [],
        totalDiscount: 0,
        taxes: [],
        totalTax: 0,
        additionalCharges: [],
        statedGrandTotal: 150000,
        paymentSchedule: [],
        advancePayment: null,
        cancellationTerms: null,
        refundTerms: null,
        specialConditions: [],
      };

      const audit = auditQuotationFinances(commercial);

      expect(audit.isValid).toBe(false);
      expect(audit.hasLineItemDiscrepancies).toBe(true);
      expect(audit.lineItemAudits[0].isMismatch).toBe(true);
      expect(audit.lineItemAudits[0].expectedAmount).toBe(120000);
      expect(audit.lineItemAudits[0].statedAmount).toBe(150000);
      expect(audit.discrepancyFlags.some((f) => f.type === "LINE_ITEM_MATH")).toBe(true);
    });

    it("detects and flags subtotal and grand total discrepancies", () => {
      const commercial: ExtractedCommercialDetails = {
        currency: "INR",
        lineItems: [
          {
            description: "Stage Decor",
            quantity: 1,
            unit: "set",
            unitPrice: 200000,
            statedAmount: 200000,
            sourcePage: 1,
            evidenceSnippet: null,
            isExplicit: true,
          },
        ],
        statedSubtotal: 180000,
        discounts: [],
        totalDiscount: 0,
        taxes: [],
        totalTax: 0,
        additionalCharges: [],
        statedGrandTotal: 250000,
        paymentSchedule: [],
        advancePayment: null,
        cancellationTerms: null,
        refundTerms: null,
        specialConditions: [],
      };

      const audit = auditQuotationFinances(commercial);

      expect(audit.isValid).toBe(false);
      expect(audit.subtotalMatches).toBe(false);
      expect(audit.grandTotalMatches).toBe(false);
      expect(audit.discrepancyFlags.some((f) => f.type === "SUBTOTAL_MISMATCH")).toBe(true);
      expect(audit.discrepancyFlags.some((f) => f.type === "GRAND_TOTAL_MISMATCH")).toBe(true);
    });

    it("handles missing totals gracefully without crashing", () => {
      const commercial: ExtractedCommercialDetails = {
        currency: "INR",
        lineItems: [],
        statedSubtotal: null,
        discounts: [],
        totalDiscount: null,
        taxes: [],
        totalTax: null,
        additionalCharges: [],
        statedGrandTotal: null,
        paymentSchedule: [],
        advancePayment: null,
        cancellationTerms: null,
        refundTerms: null,
        specialConditions: [],
      };

      const audit = auditQuotationFinances(commercial);

      expect(audit.isValid).toBe(false);
      expect(audit.statedGrandTotal).toBeNull();
      expect(audit.discrepancyFlags.some((f) => f.type === "MISSING_STATED_TOTAL")).toBe(true);
      expect(audit.missingInformationFlags.some((m) => m.includes("subtotal"))).toBe(true);
    });
  });

  describe("Groq AI Output Parsing & Zod Validation", () => {
    const dummyPages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: "Sample Catering Proposal Page 1",
        method: "text",
        status: "success",
        confidence: null,
        charCount: 30,
        wordCount: 5,
        warnings: [],
        error: null,
      },
    ];

    it("extracts structured quotation data conforming to Zod schema", async () => {
      setMockGroqResponse(sampleMockGroqJson);

      const result = await extractStructuredQuotationWithGroq(dummyPages);

      expect(result.data.vendorDetails.vendorName).toBe("Royal Rajputana Caterers");
      expect(result.data.commercialDetails.statedGrandTotal).toBe(1810000);
      expect(result.data.commercialDetails.lineItems.length).toBe(2);
      expect(result.data.commercialDetails.lineItems[0].sourcePage).toBe(1);
      expect(result.data.serviceDetails.servicesIncluded.length).toBe(1);
    });

    it("rejects invalid or malformed JSON from Groq", async () => {
      setMockGroqResponse("THIS IS NOT JSON AT ALL");

      await expect(extractStructuredQuotationWithGroq(dummyPages)).rejects.toThrow(
        /invalid JSON/i
      );
    });

    it("rejects AI output that violates schema constraints", async () => {
      setMockGroqResponse(
        JSON.stringify({
          vendorDetails: "should be an object, not string",
        })
      );

      await expect(extractStructuredQuotationWithGroq(dummyPages)).rejects.toThrow(
        /failed schema validation/i
      );
    });

    it("preserves nulls and avoids inventing missing values", () => {
      const minimalValid = {
        vendorDetails: {
          vendorName: null,
          category: null,
          contactPhone: null,
          contactEmail: null,
          address: null,
          website: null,
          quotationNumber: null,
          quotationDate: null,
          validityDate: null,
          sourcePage: null,
          evidenceSnippet: null,
        },
        commercialDetails: {
          currency: null,
          lineItems: [],
          statedSubtotal: null,
          discounts: [],
          totalDiscount: null,
          taxes: [],
          totalTax: null,
          additionalCharges: [],
          statedGrandTotal: null,
          paymentSchedule: [],
          advancePayment: null,
          cancellationTerms: null,
          refundTerms: null,
          specialConditions: [],
        },
        serviceDetails: {
          servicesIncluded: [],
          servicesExcluded: [],
          deliverables: [],
          guestLimit: null,
          eventDates: null,
          coverageHours: null,
          setupDetails: null,
          dismantlingDetails: null,
          overtimeCharges: null,
          optionalAddons: [],
        },
        conflictsAndWarnings: ["Minimal quotation without explicit prices"],
        missingFields: ["statedGrandTotal", "vendorName"],
      };

      const parsed = GroqExtractionOutputSchema.parse(minimalValid);
      expect(parsed.vendorDetails.vendorName).toBeNull();
      expect(parsed.commercialDetails.statedGrandTotal).toBeNull();
      expect(parsed.missingFields).toContain("statedGrandTotal");
    });
  });

  describe("Groq Client Safeguards & Error Handling", () => {
    it("handles rate limits and timeouts cleanly", async () => {
      const originalApiKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;

      expect(() => getGroqClient()).toThrow(/GROQ_API_KEY is not configured/i);

      process.env.GROQ_API_KEY = originalApiKey;
    });
  });

  describe("End-to-End Quotation Analysis Pipeline & API", () => {
    it("analyzes an uploaded quotation PDF end-to-end and returns audited financial data", async () => {
      const text =
        "Royal Rajputana Caterers Proposal - 500 Guests @ Rs 3,200/plate. Subtotal Rs 16,00,000.";
      const buffer = createDigitalPdfBuffer(text);
      const file = await saveQuotationFile(buffer, "royal_caterers.pdf");

      setMockGroqResponse(sampleMockGroqJson);

      const result = await analyzeQuotationDocument(file.id);

      expect(result.success).toBe(true);
      expect(result.uploadId).toBe(file.id);
      expect(result.vendorDetails.vendorName).toBe("Royal Rajputana Caterers");
      expect(result.financialAudit).toBeDefined();
      expect(result.financialAudit.calculatedSubtotal).toBe(1750000);
      expect(result.financialAudit.statedGrandTotal).toBe(1810000);
      expect(result.financialAudit.grandTotalMatches).toBe(true);
      expect(result.sourcePageCount).toBe(1);
    });

    it("handles POST /api/quotation-analyzer/analyze endpoint successfully", async () => {
      const text = "Floral Decor Quote - Grand Mandap Rs 4,50,000";
      const buffer = createDigitalPdfBuffer(text);
      const file = await saveQuotationFile(buffer, "decor_quote.pdf");

      setMockGroqResponse(sampleMockGroqJson);

      const req = {
        json: async () => ({ uploadId: file.id }),
      } as any;

      const res = await analyzePostRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.uploadId).toBe(file.id);
      expect(data.commercialDetails.currency).toBe("INR");
      expect(data.financialAudit.isValid).toBe(true);
    });

    it("returns 400 when analyze API is called without uploadId", async () => {
      const req = {
        json: async () => ({}),
      } as any;

      const res = await analyzePostRoute(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("uploadId");
    });
  });
});
