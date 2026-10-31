import ExcelJS from "exceljs";
import { ReportGenerationInput } from "./report-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { getCachedAnalysis } from "@/lib/ai/quotation-analyzer-service";

/**
 * Sanitizes strings against spreadsheet formula injection (CSV/Excel DDE attacks).
 * If a string begins with '=', '+', '-', '@', '\t', or '\r', it prefixes with a single quote.
 */
export function sanitizeForExcel(value: any): any {
  if (typeof value !== "string") return value;
  if (/^[=+\-@\t\r]/.test(value) || /^[=+\-@]/.test(value.trim())) {
    return `'${value}`;
  }
  return value;
}

// Styling Constants
const THEME_CHARCOAL = "FF1E293B"; // Slate 800
const THEME_GOLD = "FFD4AF37"; // Gathbandhan Gold
const THEME_GOLD_LIGHT = "FFFBF8EE"; // Light Gold
const THEME_EMERALD = "FF10B981"; // Emerald Green
const THEME_EMERALD_LIGHT = "FFE6F4EA";
const THEME_AMBER_LIGHT = "FFFEF7E0";
const THEME_ROSE_LIGHT = "FFFCE8E6";
const FONT_FAMILY = "Segoe UI";

function applyHeaderStyle(row: ExcelJS.Row, bgArgb: string = THEME_CHARCOAL, textArgb: string = "FFFFFFFF") {
  row.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: textArgb } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF94A3B8" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
}

function applyDataRowStyle(row: ExcelJS.Row, isEven: boolean = false) {
  row.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 10, color: { argb: "FF1E293B" } };
    if (isEven) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    cell.alignment = { vertical: "middle" };
  });
}

/**
 * Builds the complete 8-sheet Excel Workbook.
 */
export async function generateExcelReport(input: ReportGenerationInput): Promise<Buffer> {
  const { comparisonResult, metadata } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gathbandhan AI Wedding Operations Platform";
  workbook.created = new Date();

  // Retrieve raw quotation analyses for deeper itemized breakdown if not passed directly
  const analyzedQuotations: QuotationAnalysisResult[] =
    input.analyzedQuotations && input.analyzedQuotations.length > 0
      ? input.analyzedQuotations
      : comparisonResult.vendors
          .map((v) => getCachedAnalysis(v.uploadId))
          .filter((q): q is QuotationAnalysisResult => Boolean(q));

  // ==========================================
  // SHEET 1: Executive Summary
  // ==========================================
  const wsExec = workbook.addWorksheet("Executive Summary", {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  // Branding Banner
  wsExec.addRow(["GATHBANDHAN — WEDDING VENDOR QUOTATION COMPARISON REPORT"]);
  wsExec.getRow(1).font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: "FFB45309" } };
  wsExec.addRow([
    `Generated: ${metadata?.generatedAt || new Date().toLocaleString()} | Event: ${
      metadata?.eventName || "Wedding Celebration"
    } | Category: ${comparisonResult.categoryCompatibility.primaryCategory} | Vendors Compared: ${
      comparisonResult.vendors.length
    }`,
  ]);
  wsExec.getRow(2).font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: "FF64748B" } };
  wsExec.addRow([]); // Spacer

  // Section: Single Recommended Vendor
  const rec = comparisonResult.recommendation;
  wsExec.addRow(["★ FINAL STRATEGIC RECOMMENDATION (ADVISORY)"]);
  wsExec.getRow(4).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: "FF0F172A" } };

  wsExec.addRow(["Attribute", "Recommendation Details"]);
  applyHeaderStyle(wsExec.getRow(5), THEME_GOLD, "FF000000");

  const recRows = [
    ["Recommended Vendor", sanitizeForExcel(rec.recommendedVendorName)],
    ["Overall Ranking", `#1 Ranked (Score: ${comparisonResult.scoring.rankings[0]?.totalScore || 0}/100)`],
    ["Confidence & Status", `${rec.confidenceLevel} ${rec.isProvisional ? "(Provisional Match)" : "(Definitive)"}`],
    ["Headline", sanitizeForExcel(rec.headline)],
    ["Executive Summary", sanitizeForExcel(rec.executiveSummary)],
    ["Key Commercial Advantages", sanitizeForExcel(rec.majorAdvantages.join(" • "))],
    ["Commercial Risks & Disadvantages", sanitizeForExcel(rec.commercialDisadvantages.join(" • "))],
    ["Deterministic Financial Audit", sanitizeForExcel(rec.financialAuditAssessment.details)],
    ["Essential Clarification Questions", sanitizeForExcel(rec.questionsToClarifyBeforeSigning.join(" | "))],
    ["Advisory Notice", sanitizeForExcel(rec.advisoryNotice)],
  ];

  recRows.forEach((r, idx) => {
    const row = wsExec.addRow(r);
    applyDataRowStyle(row, idx % 2 === 1);
  });

  wsExec.addRow([]); // Spacer
  wsExec.addRow(["ALL COMPARED VENDORS RANKING SUMMARY"]);
  wsExec.getRow(wsExec.rowCount).font = { name: FONT_FAMILY, size: 11, bold: true };

  const summaryHeader = wsExec.addRow([
    "Rank",
    "Vendor Name",
    "Category",
    "Total Score (/100)",
    "Quoted Grand Total",
    "Currency",
    "Math Audit Status",
    "Discrepancies Count",
    "Inclusions",
    "Advance Required",
  ]);
  applyHeaderStyle(summaryHeader);

  comparisonResult.scoring.rankings.forEach((rankItem, idx) => {
    const v = comparisonResult.vendors.find((item) => item.uploadId === rankItem.uploadId);
    const row = wsExec.addRow([
      rankItem.rank,
      sanitizeForExcel(rankItem.vendorName),
      sanitizeForExcel(v?.category || ""),
      rankItem.totalScore,
      v?.statedGrandTotal ?? "Not Stated",
      v?.currency || "INR",
      v?.financialAuditStatus || "UNAUDITED",
      v?.discrepancyCount || 0,
      v?.inclusionsCount || 0,
      v?.advancePaymentPercent ? `${v.advancePaymentPercent}%` : "Unspecified",
    ]);
    applyDataRowStyle(row, idx % 2 === 1);
  });

  wsExec.columns = [
    { width: 28 },
    { width: 45 },
    { width: 22 },
    { width: 18 },
    { width: 20 },
    { width: 12 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 18 },
  ];

  // ==========================================
  // SHEET 2: Vendor Comparison
  // ==========================================
  const wsComp = workbook.addWorksheet("Vendor Comparison", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const compHeaders = ["Comparison Criterion", "Dimension", ...comparisonResult.vendors.map((v) => sanitizeForExcel(v.vendorName))];
  const compHeaderRow = wsComp.addRow(compHeaders);
  applyHeaderStyle(compHeaderRow);

  comparisonResult.matrix.forEach((mRow, idx) => {
    const rowData = [
      sanitizeForExcel(mRow.criterion),
      mRow.category.toUpperCase(),
      ...comparisonResult.vendors.map((v) => sanitizeForExcel(mRow.values[v.uploadId] ?? "—")),
    ];
    const row = wsComp.addRow(rowData);
    applyDataRowStyle(row, idx % 2 === 1);
  });

  wsComp.columns = [
    { width: 32 },
    { width: 16 },
    ...comparisonResult.vendors.map(() => ({ width: 30 })),
  ];

  // ==========================================
  // SHEET 3: Commercial Details
  // ==========================================
  const wsComm = workbook.addWorksheet("Commercial Details", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const commHeaders = [
    "Vendor Name",
    "Source Page",
    "Line Item Description",
    "Quantity",
    "Unit",
    "Unit Price",
    "Stated Amount",
    "Calculated (Qty * Price)",
    "Discrepancy",
    "Math Matched",
  ];
  const commHeaderRow = wsComm.addRow(commHeaders);
  applyHeaderStyle(commHeaderRow);
  wsComm.autoFilter = "A1:J1";

  let commRowIndex = 0;
  for (const q of analyzedQuotations) {
    const vName = q.vendorDetails.vendorName || q.originalName;
    for (const item of q.commercialDetails.lineItems) {
      const calcExpected =
        item.quantity !== null && item.unitPrice !== null ? item.quantity * item.unitPrice : null;
      const discrepancy =
        calcExpected !== null && item.statedAmount !== null
          ? item.statedAmount - calcExpected
          : 0;
      const matched = Math.abs(discrepancy) < 0.01;

      const row = wsComm.addRow([
        sanitizeForExcel(vName),
        item.sourcePage || 1,
        sanitizeForExcel(item.description),
        item.quantity ?? "—",
        sanitizeForExcel(item.unit ?? "—"),
        item.unitPrice ?? "—",
        item.statedAmount ?? "—",
        calcExpected ?? "—",
        discrepancy,
        matched ? "YES" : "NO",
      ]);
      applyDataRowStyle(row, commRowIndex % 2 === 1);

      if (!matched && Math.abs(discrepancy) > 0.01) {
        row.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_ROSE_LIGHT } };
        row.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_ROSE_LIGHT } };
      }
      commRowIndex++;
    }
  }

  wsComm.columns = [
    { width: 26 },
    { width: 12 },
    { width: 42 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 22 },
    { width: 16 },
    { width: 14 },
  ];

  // ==========================================
  // SHEET 4: Service Scope
  // ==========================================
  const wsScope = workbook.addWorksheet("Service Scope", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const scopeHeaderRow = wsScope.addRow([
    "Vendor Name",
    "Type",
    "Item / Service Text",
    "Source Page",
    "Evidence Snippet",
  ]);
  applyHeaderStyle(scopeHeaderRow);
  wsScope.autoFilter = "A1:E1";

  let scopeRowIdx = 0;
  for (const q of analyzedQuotations) {
    const vName = q.vendorDetails.vendorName || q.originalName;
    for (const inc of q.serviceDetails.servicesIncluded) {
      const row = wsScope.addRow([
        sanitizeForExcel(vName),
        "INCLUSION",
        sanitizeForExcel(inc.text),
        inc.sourcePage || 1,
        sanitizeForExcel(inc.evidence || "—"),
      ]);
      applyDataRowStyle(row, scopeRowIdx % 2 === 1);
      scopeRowIdx++;
    }
    for (const exc of q.serviceDetails.servicesExcluded) {
      const row = wsScope.addRow([
        sanitizeForExcel(vName),
        "EXCLUSION",
        sanitizeForExcel(exc.text),
        exc.sourcePage || 1,
        sanitizeForExcel(exc.evidence || "—"),
      ]);
      applyDataRowStyle(row, scopeRowIdx % 2 === 1);
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_AMBER_LIGHT } };
      scopeRowIdx++;
    }
    for (const del of q.serviceDetails.deliverables) {
      const row = wsScope.addRow([
        sanitizeForExcel(vName),
        "DELIVERABLE",
        sanitizeForExcel(del.text),
        del.sourcePage || 1,
        sanitizeForExcel(del.evidence || "—"),
      ]);
      applyDataRowStyle(row, scopeRowIdx % 2 === 1);
      scopeRowIdx++;
    }
  }

  wsScope.columns = [
    { width: 26 },
    { width: 16 },
    { width: 45 },
    { width: 14 },
    { width: 40 },
  ];

  // ==========================================
  // SHEET 5: Payment & Terms
  // ==========================================
  const wsTerms = workbook.addWorksheet("Payment & Terms", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const termsHeaderRow = wsTerms.addRow([
    "Vendor Name",
    "Advance Deposit %",
    "Advance Amount",
    "Cancellation Policy",
    "Refund Policy",
    "Overtime Fee Structure",
    "Payment Milestones Summary",
  ]);
  applyHeaderStyle(termsHeaderRow);

  comparisonResult.vendors.forEach((v, idx) => {
    const row = wsTerms.addRow([
      sanitizeForExcel(v.vendorName),
      v.advancePaymentPercent !== null ? `${v.advancePaymentPercent}%` : "Not Stated",
      v.advancePaymentAmount ? `${v.currency} ${v.advancePaymentAmount}` : "—",
      sanitizeForExcel(v.cancellationSummary || "Not Specified"),
      sanitizeForExcel(v.refundSummary || "Not Specified"),
      sanitizeForExcel(v.overtimeCharges || "Unstated / Negotiable"),
      `${v.paymentScheduleMilestones} milestone(s)`,
    ]);
    applyDataRowStyle(row, idx % 2 === 1);
  });

  wsTerms.columns = [
    { width: 26 },
    { width: 18 },
    { width: 18 },
    { width: 38 },
    { width: 32 },
    { width: 28 },
    { width: 26 },
  ];

  // ==========================================
  // SHEET 6: Financial Audit
  // ==========================================
  const wsAudit = workbook.addWorksheet("Financial Audit", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const auditHeaderRow = wsAudit.addRow([
    "Vendor Name",
    "Audit Status",
    "Stated Subtotal",
    "Calculated Subtotal",
    "Subtotal Discrepancy",
    "Stated Grand Total",
    "Calculated Grand Total",
    "Grand Total Discrepancy",
    "Discrepancies Flags & Warnings",
  ]);
  applyHeaderStyle(auditHeaderRow);

  analyzedQuotations.forEach((q, idx) => {
    const vName = q.vendorDetails.vendorName || q.originalName;
    const fa = q.financialAudit;
    const flagMessages = fa.discrepancyFlags.map((d) => d.message).join(" | ");

    const row = wsAudit.addRow([
      sanitizeForExcel(vName),
      fa.isValid ? "100% MATCHED" : "DISCREPANCY FLAGGED",
      fa.statedSubtotal ?? "—",
      fa.calculatedSubtotal ?? "—",
      fa.subtotalDiscrepancy ?? 0,
      fa.statedGrandTotal ?? "—",
      fa.calculatedGrandTotal ?? "—",
      fa.grandTotalDiscrepancy ?? 0,
      sanitizeForExcel(flagMessages || "None - All figures reconcile deterministically"),
    ]);
    applyDataRowStyle(row, idx % 2 === 1);

    if (!fa.isValid) {
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_ROSE_LIGHT } };
    } else {
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_EMERALD_LIGHT } };
    }
  });

  wsAudit.columns = [
    { width: 26 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
    { width: 20 },
    { width: 22 },
    { width: 45 },
  ];

  // ==========================================
  // SHEET 7: Evidence & Sources
  // ==========================================
  const wsEvid = workbook.addWorksheet("Evidence & Sources", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const evidHeaderRow = wsEvid.addRow([
    "Vendor Name",
    "Source Page",
    "Field / Scope Category",
    "Extracted Text & Evidence Snippet",
    "Explicitly In Quotation",
  ]);
  applyHeaderStyle(evidHeaderRow);
  wsEvid.autoFilter = "A1:E1";

  let evidRowIdx = 0;
  for (const q of analyzedQuotations) {
    const vName = q.vendorDetails.vendorName || q.originalName;

    // Line items evidence
    for (const item of q.commercialDetails.lineItems.slice(0, 5)) {
      const row = wsEvid.addRow([
        sanitizeForExcel(vName),
        item.sourcePage || 1,
        "COMMERCIAL LINE ITEM",
        sanitizeForExcel(item.evidenceSnippet || item.description),
        item.isExplicit ? "YES" : "INFERRED",
      ]);
      applyDataRowStyle(row, evidRowIdx % 2 === 1);
      evidRowIdx++;
    }

    // Services evidence
    for (const inc of q.serviceDetails.servicesIncluded.slice(0, 5)) {
      const row = wsEvid.addRow([
        sanitizeForExcel(vName),
        inc.sourcePage || 1,
        "SERVICE INCLUSION",
        sanitizeForExcel(inc.evidence || inc.text),
        "YES",
      ]);
      applyDataRowStyle(row, evidRowIdx % 2 === 1);
      evidRowIdx++;
    }

    // Payment terms evidence
    for (const p of q.commercialDetails.paymentSchedule) {
      const row = wsEvid.addRow([
        sanitizeForExcel(vName),
        p.sourcePage || 1,
        "PAYMENT SCHEDULE",
        sanitizeForExcel(p.evidenceSnippet || p.milestone),
        "YES",
      ]);
      applyDataRowStyle(row, evidRowIdx % 2 === 1);
      evidRowIdx++;
    }
  }

  wsEvid.columns = [
    { width: 26 },
    { width: 14 },
    { width: 24 },
    { width: 50 },
    { width: 24 },
  ];

  // ==========================================
  // SHEET 8: Scoring Methodology
  // ==========================================
  const wsMethod = workbook.addWorksheet("Scoring Methodology", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  wsMethod.addRow(["TRANSPARENT WEIGHTED SCORING METHODOLOGY"]);
  wsMethod.getRow(1).font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: "FF0F172A" } };
  wsMethod.addRow([comparisonResult.scoring.methodologyDescription]);
  wsMethod.getRow(2).font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: "FF64748B" } };

  const methodHeaderRow = wsMethod.addRow([
    "Vendor Name",
    "Criterion",
    "Base Weight %",
    "Adjusted Weight %",
    "Normalized Score (/100)",
    "Weighted Score",
    "Evidence Available",
    "Scoring Provenance & Evidence Notes",
  ]);
  applyHeaderStyle(methodHeaderRow);

  let methodRowIdx = 0;
  for (const [vId, breakdown] of Object.entries(comparisonResult.scoring.vendorScores)) {
    for (const crit of Object.values(breakdown.criteria)) {
      const row = wsMethod.addRow([
        sanitizeForExcel(breakdown.vendorName),
        crit.name,
        `${crit.weight}%`,
        `${crit.adjustedWeight}%`,
        crit.isAvailable ? crit.normalizedScore : "N/A",
        crit.weightedScore,
        crit.isAvailable ? "YES" : "NO (Re-normalized)",
        sanitizeForExcel(crit.evidenceNotes),
      ]);
      applyDataRowStyle(row, methodRowIdx % 2 === 1);

      if (!crit.isAvailable) {
        row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: THEME_AMBER_LIGHT } };
      }
      methodRowIdx++;
    }
  }

  wsMethod.columns = [
    { width: 26 },
    { width: 26 },
    { width: 16 },
    { width: 18 },
    { width: 24 },
    { width: 16 },
    { width: 20 },
    { width: 45 },
  ];

  // Generate binary buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
