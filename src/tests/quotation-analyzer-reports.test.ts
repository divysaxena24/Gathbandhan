import { describe, it, expect, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { generatePdfReport } from "@/lib/reports/pdf-report-service";
import { generateExcelReport, sanitizeForExcel } from "@/lib/reports/excel-report-service";
import {
  generateSafeReportFilename,
  saveTemporaryReport,
  cleanupExpiredReports,
  clearAllTemporaryReports,
} from "@/lib/reports/temp-report-storage";
import { resolveReportData } from "@/lib/reports/report-data-service";
import { POST as exportPdfRoute } from "@/app/api/quotation-analyzer/export/pdf/route";
import { POST as exportExcelRoute } from "@/app/api/quotation-analyzer/export/excel/route";
import { compareAnalyzedQuotations } from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { setCachedAnalysis, clearAnalysisCache } from "@/lib/ai/quotation-analyzer-service";

function createMockQuotation(params: {
  uploadId: string;
  vendorName: string;
  category?: string;
  currency?: string;
  grandTotal?: number;
  inclusionsCount?: number;
  advancePercentage?: number;
  isMathValid?: boolean;
}): QuotationAnalysisResult {
  return {
    success: true,
    uploadId: params.uploadId,
    originalName: `${params.vendorName.replace(/\s+/g, "_")}.pdf`,
    analyzedAt: new Date().toISOString(),
    modelUsed: "mock-model",
    vendorDetails: {
      vendorName: params.vendorName,
      category: params.category || "Catering",
      contactPhone: "+91 9999999999",
      contactEmail: "info@vendor.com",
      address: "Mumbai",
      website: "https://vendor.com",
      quotationNumber: `QT-${params.uploadId}`,
      quotationDate: "2026-10-15",
      validityDate: "2026-11-15",
      sourcePage: 1,
      evidenceSnippet: "Quotation issued by vendor",
    },
    commercialDetails: {
      currency: params.currency || "INR",
      lineItems: [
        {
          description: "=CMD|' /C calc'!A0", // Test formula injection in line items!
          quantity: 2,
          unit: "unit",
          unitPrice: 50000,
          statedAmount: 100000,
          sourcePage: 1,
          evidenceSnippet: "Line item description",
          isExplicit: true,
        },
      ],
      statedSubtotal: params.grandTotal || 100000,
      discounts: [],
      totalDiscount: 0,
      taxes: [],
      totalTax: 0,
      additionalCharges: [],
      statedGrandTotal: params.grandTotal || 100000,
      paymentSchedule: [
        {
          milestone: "Advance",
          percentage: params.advancePercentage || 25,
          statedAmount: 25000,
          dueDate: "Upon signing",
          sourcePage: 2,
          evidenceSnippet: "Advance on signing",
        },
      ],
      advancePayment: {
        percentage: params.advancePercentage || 25,
        amount: 25000,
        terms: "Deposit",
        sourcePage: 2,
      },
      cancellationTerms: "50% refund 30 days prior",
      refundTerms: "Partial refund",
      specialConditions: [],
    },
    serviceDetails: {
      servicesIncluded: Array.from({ length: params.inclusionsCount || 5 }, (_, i) => ({
        text: `Inclusion ${i + 1}`,
        sourcePage: 1,
        evidence: `Included ${i + 1}`,
      })),
      servicesExcluded: [{ text: "External Alcohol", sourcePage: 2, evidence: "Client arranges drinks" }],
      deliverables: [{ text: "Menu Tasting for 4", sourcePage: 2, evidence: "Tasting session included" }],
      guestLimit: 400,
      eventDates: ["2026-12-20"],
      coverageHours: 8,
      setupDetails: "Setup 3 hours prior",
      dismantlingDetails: "Dismantling within 2 hours",
      overtimeCharges: "Rs. 5,000/hr",
      optionalAddons: [],
    },
    financialAudit: {
      isValid: params.isMathValid ?? true,
      statedSubtotal: params.grandTotal || 100000,
      calculatedSubtotal: params.grandTotal || 100000,
      subtotalDiscrepancy: 0,
      subtotalMatches: true,
      statedGrandTotal: params.grandTotal || 100000,
      calculatedGrandTotal: params.grandTotal || 100000,
      grandTotalDiscrepancy: 0,
      grandTotalMatches: true,
      lineItemAudits: [],
      hasLineItemDiscrepancies: false,
      discrepancyFlags: params.isMathValid === false
        ? [{ type: "LINE_ITEM_MATH", severity: "warning", message: "Discrepancy in totals" }]
        : [],
      missingInformationFlags: [],
    },
    sourcePageCount: 2,
    conflictsAndWarnings: [],
    missingFields: [],
    error: null,
  };
}

describe("Milestone 5: PDF and Excel Report Generation Engine", () => {
  beforeEach(async () => {
    clearAnalysisCache();
    await clearAllTemporaryReports();
  });

  describe("Spreadsheet Formula Injection Protection", () => {
    it("neutralizes strings starting with '=', '+', '-', '@', tab, or carriage return", () => {
      expect(sanitizeForExcel("=SUM(A1:B10)")).toBe("'=SUM(A1:B10)");
      expect(sanitizeForExcel("+123456789")).toBe("'+123456789");
      expect(sanitizeForExcel("-cmd|'/C calc'!A0")).toBe("'-cmd|'/C calc'!A0");
      expect(sanitizeForExcel("@HYPERLINK('http://evil.com')")).toBe("'@HYPERLINK('http://evil.com')");
      expect(sanitizeForExcel("\tLeadingTab")).toBe("'\tLeadingTab");
      expect(sanitizeForExcel("Normal Vendor Name")).toBe("Normal Vendor Name");
      expect(sanitizeForExcel(12345)).toBe(12345);
      expect(sanitizeForExcel(null)).toBeNull();
    });
  });

  describe("Excel Workbook Generation (8 Required Sheets)", () => {
    it("generates a structured .xlsx workbook with all 8 sheets and correct contents", async () => {
      const q1 = createMockQuotation({ uploadId: "v1", vendorName: "Royal Feast Caterers", grandTotal: 120000 });
      const q2 = createMockQuotation({ uploadId: "v2", vendorName: "Saffron Table", grandTotal: 150000 });

      const comparison = await compareAnalyzedQuotations([q1, q2]);
      const excelBuffer = await generateExcelReport({
        comparisonResult: comparison,
        analyzedQuotations: [q1, q2],
        metadata: {
          eventName: "Kavya & Rohan Wedding",
          eventDate: "2026-12-20",
          preparedBy: "Lead Planner Gathbandhan",
        },
      });

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(1000);

      // Verify the generated Excel with ExcelJS reader
      const readWb = new ExcelJS.Workbook();
      await readWb.xlsx.load(excelBuffer);

      const sheetNames = readWb.worksheets.map((s) => s.name);
      expect(sheetNames).toContain("Executive Summary");
      expect(sheetNames).toContain("Vendor Comparison");
      expect(sheetNames).toContain("Commercial Details");
      expect(sheetNames).toContain("Service Scope");
      expect(sheetNames).toContain("Payment & Terms");
      expect(sheetNames).toContain("Financial Audit");
      expect(sheetNames).toContain("Evidence & Sources");
      expect(sheetNames).toContain("Scoring Methodology");
      expect(sheetNames).toHaveLength(8);

      // Check Executive Summary contains recommendation
      const execSheet = readWb.getWorksheet("Executive Summary")!;
      const execText = JSON.stringify(execSheet.getSheetValues());
      expect(execText).toContain(comparison.recommendation.recommendedVendorName);

      // Check Formula Injection Protection on Commercial Details
      const commSheet = readWb.getWorksheet("Commercial Details")!;
      const commText = JSON.stringify(commSheet.getSheetValues());
      expect(commText).toContain("'=CMD|' /C calc'!A0"); // Neutralized formula injection!
    });
  });

  describe("PDF Report Generation", () => {
    it("generates a valid, multi-page, client-ready PDF document with cover page and executive summary", async () => {
      const q1 = createMockQuotation({ uploadId: "v1", vendorName: "Royal Feast Caterers", grandTotal: 120000 });
      const q2 = createMockQuotation({ uploadId: "v2", vendorName: "Saffron Table", grandTotal: 150000 });

      const comparison = await compareAnalyzedQuotations([q1, q2]);
      const pdfBuffer = await generatePdfReport({
        comparisonResult: comparison,
        analyzedQuotations: [q1, q2],
        metadata: {
          eventName: "Kavya & Rohan Wedding",
          eventDate: "2026-12-20",
          preparedBy: "Lead Planner Gathbandhan",
        },
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(2000);

      // PDF signature check
      const headerStr = pdfBuffer.slice(0, 5).toString("utf8");
      expect(headerStr).toBe("%PDF-");

      // Load using pdf-lib to verify valid PDF structure and page count
      const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuffer));
      expect(loadedPdf.getPageCount()).toBeGreaterThanOrEqual(2);
    });

    it("handles different currencies, provisional recommendations, and audit discrepancies in reports", async () => {
      // Different currencies & close pricing (provisional) & math discrepancy
      const q1 = createMockQuotation({
        uploadId: "cur1",
        vendorName: "London Caterers",
        currency: "GBP",
        grandTotal: 10000,
        isMathValid: true,
      });
      const q2 = createMockQuotation({
        uploadId: "cur2",
        vendorName: "Mumbai Banquets",
        currency: "INR",
        grandTotal: 1050000,
        isMathValid: false, // Discrepancy
      });

      const comparison = await compareAnalyzedQuotations([q1, q2]);
      expect(comparison.currencyCompatibility.isCompatible).toBe(false);

      // 1. Generate Excel
      const excelBuf = await generateExcelReport({
        comparisonResult: comparison,
        analyzedQuotations: [q1, q2],
      });
      const readWb = new ExcelJS.Workbook();
      await readWb.xlsx.load(excelBuf);

      const auditSheet = readWb.getWorksheet("Financial Audit")!;
      const auditValues = JSON.stringify(auditSheet.getSheetValues());
      expect(auditValues).toContain("DISCREPANCY FLAGGED");

      // 2. Generate PDF
      const pdfBuf = await generatePdfReport({
        comparisonResult: comparison,
        analyzedQuotations: [q1, q2],
      });
      const loadedPdf = await PDFDocument.load(new Uint8Array(pdfBuf));
      expect(loadedPdf.getPageCount()).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Temporary Report Storage & Safe Filenames", () => {
    it("generates safe, path-traversal-free filenames", () => {
      const { filename: pdfName } = generateSafeReportFilename("pdf", "../../../malicious_name");
      expect(pdfName).not.toContain("..");
      expect(pdfName).toMatch(/^Gathbandhan_Quotation_Comparison_.*\.pdf$/);

      const { filename: xlsxName } = generateSafeReportFilename("xlsx", "Royal Feast Catering");
      expect(xlsxName).toMatch(/^Gathbandhan_Quotation_Comparison_Royal_Feast_Catering_.*\.xlsx$/);
    });

    it("saves temporary report and cleans up expired files", async () => {
      const dummyBuffer = Buffer.from("dummy test report data");
      const { filePath, filename } = await saveTemporaryReport(dummyBuffer, "test_report_cleanup.pdf");

      expect(filePath).toBeDefined();
      expect(filename).toBe("test_report_cleanup.pdf");

      // Cleanup with negative or 0ms maxAge will clean the file immediately
      const cleaned = await cleanupExpiredReports(-1);
      expect(cleaned).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Export API Routes", () => {
    it("POST /api/quotation-analyzer/export/pdf returns valid PDF download response", async () => {
      const q1 = createMockQuotation({ uploadId: "id1", vendorName: "Vendor One" });
      const q2 = createMockQuotation({ uploadId: "id2", vendorName: "Vendor Two" });

      setCachedAnalysis("id1", q1);
      setCachedAnalysis("id2", q2);

      const req = new Request("http://localhost:3000/api/quotation-analyzer/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ["id1", "id2"] }),
      });

      const res = await exportPdfRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");

      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBeGreaterThan(1000);
    });

    it("POST /api/quotation-analyzer/export/excel returns valid Excel download response", async () => {
      const q1 = createMockQuotation({ uploadId: "id1", vendorName: "Vendor One" });
      const q2 = createMockQuotation({ uploadId: "id2", vendorName: "Vendor Two" });

      setCachedAnalysis("id1", q1);
      setCachedAnalysis("id2", q2);

      const req = new Request("http://localhost:3000/api/quotation-analyzer/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ["id1", "id2"] }),
      });

      const res = await exportExcelRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");

      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBeGreaterThan(1000);
    });

    it("rejects invalid request payloads with 400 status", async () => {
      const badReq = new Request("http://localhost:3000/api/quotation-analyzer/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ["single-id"] }), // fewer than 2
      });

      const badRes = await exportPdfRoute(badReq);
      expect(badRes.status).toBe(400);
      const json = await badRes.json();
      expect(json.success).toBe(false);
    });
  });
});
