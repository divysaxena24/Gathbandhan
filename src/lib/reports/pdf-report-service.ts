/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { ReportGenerationInput } from "./report-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { getCachedAnalysis } from "@/lib/ai/quotation-analyzer-service";

// Color Palette
const COLOR_CHARCOAL_DARK = rgb(0.12, 0.16, 0.23); // #1F2937
const COLOR_CHARCOAL_MUTED = rgb(0.4, 0.45, 0.53);
const COLOR_GOLD = rgb(0.78, 0.65, 0.22); // Gathbandhan Gold
const COLOR_GOLD_LIGHT = rgb(0.98, 0.96, 0.91);
const COLOR_EMERALD = rgb(0.06, 0.58, 0.38);
const COLOR_EMERALD_LIGHT = rgb(0.9, 0.96, 0.92);
const COLOR_AMBER = rgb(0.85, 0.5, 0.1);
const COLOR_AMBER_LIGHT = rgb(0.99, 0.96, 0.88);
const COLOR_ROSE = rgb(0.85, 0.2, 0.2);
const COLOR_ROSE_LIGHT = rgb(0.99, 0.92, 0.92);
const COLOR_BORDER = rgb(0.88, 0.9, 0.93);
const COLOR_WHITE = rgb(1, 1, 1);
const COLOR_LIGHT_GRAY = rgb(0.96, 0.97, 0.98);

interface LayoutState {
  doc: PDFDocument;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  currentPage: PDFPage;
  y: number;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  contentWidth: number;
  pages: PDFPage[];
}

function createNewPage(layout: LayoutState): PDFPage {
  const page = layout.doc.addPage([layout.pageWidth, layout.pageHeight]);
  layout.currentPage = page;
  layout.pages.push(page);
  layout.y = layout.pageHeight - 50; // top margin
  return page;
}

function ensureSpace(layout: LayoutState, requiredHeight: number): void {
  if (layout.y - requiredHeight < 55) {
    createNewPage(layout);
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function sanitizeText(str: string | null | undefined): string {
  if (!str) return "";
  // Strip control chars and unsupported characters for standard 14 fonts
  return str.replace(/[\u20B9]/g, "Rs. ").replace(/[^\x00-\x7F]/g, " ");
}

/**
 * Builds client-ready Gathbandhan Wedding Quotation Comparison PDF Report.
 */
export async function generatePdfReport(input: ReportGenerationInput): Promise<Buffer> {
  const { comparisonResult, metadata } = input;
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const leftMargin = 42;
  const rightMargin = 42;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const layout: LayoutState = {
    doc: pdfDoc,
    fontRegular,
    fontBold,
    currentPage: null as any,
    y: pageHeight - 50,
    pageWidth,
    pageHeight,
    leftMargin,
    rightMargin,
    contentWidth,
    pages: [],
  };

  const analyzedQuotations: QuotationAnalysisResult[] =
    input.analyzedQuotations && input.analyzedQuotations.length > 0
      ? input.analyzedQuotations
      : comparisonResult.vendors
          .map((v) => getCachedAnalysis(v.uploadId))
          .filter((q): q is QuotationAnalysisResult => Boolean(q));

  // ==========================================
  // 1. COVER PAGE
  // ==========================================
  createNewPage(layout);

  // Top Decorative Gold Header Band
  layout.currentPage.drawRectangle({
    x: 0,
    y: pageHeight - 16,
    width: pageWidth,
    height: 16,
    color: COLOR_GOLD,
  });

  layout.y = pageHeight - 90;

  // Brand Name
  layout.currentPage.drawText("GATHBANDHAN", {
    x: leftMargin,
    y: layout.y,
    size: 26,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  layout.currentPage.drawText("LUXURY WEDDING OPERATIONS & COMMERCIAL AUDIT", {
    x: leftMargin,
    y: layout.y,
    size: 9,
    font: fontBold,
    color: COLOR_GOLD,
  });
  layout.y -= 30;

  // Decorative Rule
  layout.currentPage.drawLine({
    start: { x: leftMargin, y: layout.y },
    end: { x: leftMargin + contentWidth, y: layout.y },
    thickness: 1.5,
    color: COLOR_GOLD,
  });
  layout.y -= 45;

  // Report Main Title
  layout.currentPage.drawText("Wedding Vendor Quotation Comparison", {
    x: leftMargin,
    y: layout.y,
    size: 22,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 22;

  layout.currentPage.drawText("Comprehensive Multi-Vendor Evaluation & Strategic Recommendation", {
    x: leftMargin,
    y: layout.y,
    size: 12,
    font: fontRegular,
    color: COLOR_CHARCOAL_MUTED,
  });
  layout.y -= 45;

  // Metadata Card
  const metaBoxHeight = 110;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - metaBoxHeight,
    width: contentWidth,
    height: metaBoxHeight,
    color: COLOR_LIGHT_GRAY,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  const metaItems = [
    ["Event Name:", sanitizeText(metadata?.eventName || "Wedding Celebration")],
    ["Service Category:", sanitizeText(comparisonResult.categoryCompatibility.primaryCategory)],
    ["Report Date:", sanitizeText(metadata?.generatedAt || new Date().toLocaleDateString())],
    ["Vendors Evaluated:", `${comparisonResult.vendors.length} Commercial Proposals Analyzed`],
    ["Prepared By:", sanitizeText(metadata?.preparedBy || "Gathbandhan Automated Commercial Intelligence")],
  ];

  let metaY = layout.y - 22;
  metaItems.forEach(([lbl, val]) => {
    layout.currentPage.drawText(lbl, {
      x: leftMargin + 18,
      y: metaY,
      size: 9,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    layout.currentPage.drawText(val, {
      x: leftMargin + 150,
      y: metaY,
      size: 9,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    metaY -= 18;
  });

  layout.y -= metaBoxHeight + 35;

  // Single Final Recommendation Highlight Card on Cover Page
  const rec = comparisonResult.recommendation;
  const recBoxHeight = 175;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - recBoxHeight,
    width: contentWidth,
    height: recBoxHeight,
    color: COLOR_GOLD_LIGHT,
    borderColor: COLOR_GOLD,
    borderWidth: 1.5,
  });

  layout.currentPage.drawText("EXECUTIVE RECOMMENDATION SUMMARY", {
    x: leftMargin + 20,
    y: layout.y - 25,
    size: 10,
    font: fontBold,
    color: COLOR_GOLD,
  });

  layout.currentPage.drawText(sanitizeText(rec.headline), {
    x: leftMargin + 20,
    y: layout.y - 48,
    size: 16,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  const summaryLines = wrapText(sanitizeText(rec.executiveSummary), fontRegular, 9, contentWidth - 40);
  let sumY = layout.y - 70;
  summaryLines.slice(0, 4).forEach((line) => {
    layout.currentPage.drawText(line, {
      x: leftMargin + 20,
      y: sumY,
      size: 9,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    sumY -= 14;
  });

  layout.currentPage.drawText(
    `Financial Audit: ${sanitizeText(rec.financialAuditAssessment.details)}`,
    {
      x: leftMargin + 20,
      y: layout.y - 145,
      size: 8.5,
      font: fontBold,
      color: COLOR_EMERALD,
    }
  );

  layout.currentPage.drawText(
    `Status: ${rec.confidenceLevel} Confidence ${rec.isProvisional ? "(Provisional Match)" : ""}`,
    {
      x: leftMargin + 20,
      y: layout.y - 162,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );

  layout.y -= recBoxHeight + 40;

  // Advisory Disclaimer on Cover Page
  layout.currentPage.drawText(
    "Advisory Notice: This automated audit assists wedding planners in vendor decision-making.",
    {
      x: leftMargin,
      y: 75,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.currentPage.drawText("The wedding planner and client retain ultimate decision-making authority.", {
    x: leftMargin,
    y: 62,
    size: 8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  // ==========================================
  // 2. EXECUTIVE SUMMARY & DETAILED RECOMMENDATION
  // ==========================================
  createNewPage(layout);

  layout.currentPage.drawText("1. Executive Summary & Strategic Recommendation", {
    x: leftMargin,
    y: layout.y,
    size: 14,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 25;

  // Major Advantages Section
  ensureSpace(layout, 120);
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 100,
    width: contentWidth,
    height: 100,
    color: COLOR_EMERALD_LIGHT,
    borderColor: COLOR_EMERALD,
    borderWidth: 1,
  });

  layout.currentPage.drawText("MAJOR COMMERCIAL ADVANTAGES (RECOMMENDED VENDOR)", {
    x: leftMargin + 16,
    y: layout.y - 20,
    size: 9.5,
    font: fontBold,
    color: COLOR_EMERALD,
  });

  let advY = layout.y - 38;
  rec.majorAdvantages.slice(0, 4).forEach((adv) => {
    const lines = wrapText(`+  ${sanitizeText(adv)}`, fontRegular, 8.5, contentWidth - 35);
    lines.slice(0, 1).forEach((l) => {
      layout.currentPage.drawText(l, {
        x: leftMargin + 16,
        y: advY,
        size: 8.5,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      advY -= 15;
    });
  });

  layout.y -= 115;

  // Disadvantages & Risks
  ensureSpace(layout, 100);
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 85,
    width: contentWidth,
    height: 85,
    color: COLOR_AMBER_LIGHT,
    borderColor: COLOR_AMBER,
    borderWidth: 1,
  });

  layout.currentPage.drawText("COMMERCIAL TRADE-OFFS & IDENTIFIED RISKS", {
    x: leftMargin + 16,
    y: layout.y - 18,
    size: 9.5,
    font: fontBold,
    color: COLOR_AMBER,
  });

  let disY = layout.y - 36;
  rec.commercialDisadvantages.slice(0, 3).forEach((dis) => {
    const lines = wrapText(`!  ${sanitizeText(dis)}`, fontRegular, 8.5, contentWidth - 35);
    lines.slice(0, 1).forEach((l) => {
      layout.currentPage.drawText(l, {
        x: leftMargin + 16,
        y: disY,
        size: 8.5,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      disY -= 15;
    });
  });

  layout.y -= 100;

  // Clarification Questions
  ensureSpace(layout, 110);
  layout.currentPage.drawText("ESSENTIAL CLARIFICATIONS BEFORE SIGNING CONTRACT", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 16;

  rec.questionsToClarifyBeforeSigning.forEach((q, idx) => {
    const lines = wrapText(`[  ]  ${idx + 1}. ${sanitizeText(q)}`, fontRegular, 8.5, contentWidth - 10);
    lines.forEach((line) => {
      layout.currentPage.drawText(line, {
        x: leftMargin + 5,
        y: layout.y,
        size: 8.5,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      layout.y -= 13;
    });
  });

  layout.y -= 25;

  // ==========================================
  // 3. VENDOR COMPARISON MATRIX
  // ==========================================
  ensureSpace(layout, 240);
  layout.currentPage.drawText("2. Side-by-Side Vendor Comparison Matrix", {
    x: leftMargin,
    y: layout.y,
    size: 13,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 20;

  // Matrix Table Header
  const col1W = 160;
  const numVendors = comparisonResult.vendors.length;
  const vendorColW = Math.floor((contentWidth - col1W) / numVendors);

  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 22,
    width: contentWidth,
    height: 22,
    color: COLOR_CHARCOAL_DARK,
  });

  layout.currentPage.drawText("Criterion", {
    x: leftMargin + 8,
    y: layout.y - 15,
    size: 9,
    font: fontBold,
    color: COLOR_WHITE,
  });

  comparisonResult.vendors.forEach((v, idx) => {
    const xPos = leftMargin + col1W + idx * vendorColW;
    layout.currentPage.drawText(sanitizeText(v.vendorName).slice(0, 18), {
      x: xPos + 6,
      y: layout.y - 15,
      size: 8.5,
      font: fontBold,
      color: COLOR_WHITE,
    });
  });

  layout.y -= 22;

  // Matrix Rows
  comparisonResult.matrix.forEach((mRow, rIdx) => {
    ensureSpace(layout, 22);
    const rowBg = rIdx % 2 === 1 ? COLOR_LIGHT_GRAY : COLOR_WHITE;
    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 20,
      width: contentWidth,
      height: 20,
      color: rowBg,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    layout.currentPage.drawText(sanitizeText(mRow.criterion).slice(0, 26), {
      x: leftMargin + 8,
      y: layout.y - 14,
      size: 8,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });

    comparisonResult.vendors.forEach((v, vIdx) => {
      const xPos = leftMargin + col1W + vIdx * vendorColW;
      const valStr = sanitizeText(String(mRow.values[v.uploadId] ?? "—")).slice(0, 22);
      layout.currentPage.drawText(valStr, {
        x: xPos + 6,
        y: layout.y - 14,
        size: 8,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
    });

    layout.y -= 20;
  });

  layout.y -= 25;

  // ==========================================
  // 4. SCORING METHODOLOGY & CRITERIA WEIGHTS
  // ==========================================
  ensureSpace(layout, 220);
  layout.currentPage.drawText("3. Transparent Weighted Scoring Breakdown", {
    x: leftMargin,
    y: layout.y,
    size: 13,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 15;

  const scoreExplLines = wrapText(
    sanitizeText(comparisonResult.scoring.methodologyDescription),
    fontRegular,
    8.5,
    contentWidth
  );
  scoreExplLines.forEach((line) => {
    layout.currentPage.drawText(line, {
      x: leftMargin,
      y: layout.y,
      size: 8.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
    layout.y -= 12;
  });
  layout.y -= 10;

  // Scoring Table
  const sHeaders = ["Rank", "Vendor", "Score", "Cost (30%)", "Scope (25%)", "Terms (10%)", "Audit (5%)"];
  const sColWidths = [38, 140, 50, 72, 72, 72, 71];

  ensureSpace(layout, 22);
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 20,
    width: contentWidth,
    height: 20,
    color: COLOR_GOLD,
  });

  let curX = leftMargin;
  sHeaders.forEach((h, idx) => {
    layout.currentPage.drawText(h, {
      x: curX + 6,
      y: layout.y - 14,
      size: 8,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    curX += sColWidths[idx];
  });
  layout.y -= 20;

  comparisonResult.scoring.rankings.forEach((r, rIdx) => {
    ensureSpace(layout, 20);
    const breakdown = comparisonResult.scoring.vendorScores[r.uploadId];
    const isWinner = r.rank === 1;

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 20,
      width: contentWidth,
      height: 20,
      color: isWinner ? COLOR_GOLD_LIGHT : rIdx % 2 === 1 ? COLOR_LIGHT_GRAY : COLOR_WHITE,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    const cells = [
      `#${r.rank}`,
      sanitizeText(r.vendorName).slice(0, 22),
      `${r.totalScore}`,
      `${breakdown.criteria.costCompetitiveness.normalizedScore}/100`,
      `${breakdown.criteria.serviceCoverage.normalizedScore}/100`,
      `${breakdown.criteria.commercialTerms.normalizedScore}/100`,
      `${breakdown.criteria.transparency.normalizedScore}/100`,
    ];

    let rowX = leftMargin;
    cells.forEach((c, cIdx) => {
      layout.currentPage.drawText(c, {
        x: rowX + 6,
        y: layout.y - 14,
        size: 8,
        font: isWinner || cIdx === 2 ? fontBold : fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      rowX += sColWidths[cIdx];
    });

    layout.y -= 20;
  });

  layout.y -= 25;

  // ==========================================
  // 5. FINANCIAL AUDIT & MATHEMATICAL INTEGRITY
  // ==========================================
  ensureSpace(layout, 220);
  layout.currentPage.drawText("4. Deterministic Financial Audit & Reconciliations", {
    x: leftMargin,
    y: layout.y,
    size: 13,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 18;

  // Audit Table Header
  const auditHeaders = ["Vendor Name", "Status", "Stated Total", "Calculated Total", "Discrepancy"];
  const auditColW = [160, 95, 90, 90, 80];

  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 20,
    width: contentWidth,
    height: 20,
    color: COLOR_CHARCOAL_DARK,
  });

  let aX = leftMargin;
  auditHeaders.forEach((ah, idx) => {
    layout.currentPage.drawText(ah, {
      x: aX + 6,
      y: layout.y - 14,
      size: 8,
      font: fontBold,
      color: COLOR_WHITE,
    });
    aX += auditColW[idx];
  });
  layout.y -= 20;

  analyzedQuotations.forEach((q, qIdx) => {
    ensureSpace(layout, 20);
    const vName = q.vendorDetails.vendorName || q.originalName;
    const fa = q.financialAudit;
    const isClean = fa.isValid;

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 20,
      width: contentWidth,
      height: 20,
      color: isClean ? COLOR_WHITE : COLOR_ROSE_LIGHT,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    const cVals = [
      sanitizeText(vName).slice(0, 24),
      isClean ? "VERIFIED (100%)" : `FLAGGED (${fa.discrepancyFlags.length})`,
      fa.statedGrandTotal ? `${q.commercialDetails.currency || "INR"} ${fa.statedGrandTotal}` : "—",
      fa.calculatedGrandTotal ? `${q.commercialDetails.currency || "INR"} ${fa.calculatedGrandTotal}` : "—",
      fa.grandTotalDiscrepancy ? `${fa.grandTotalDiscrepancy}` : "0",
    ];

    let rowAX = leftMargin;
    cVals.forEach((cv, cvIdx) => {
      layout.currentPage.drawText(cv, {
        x: rowAX + 6,
        y: layout.y - 14,
        size: 8,
        font: cvIdx === 1 ? fontBold : fontRegular,
        color: !isClean && cvIdx === 1 ? COLOR_ROSE : COLOR_CHARCOAL_DARK,
      });
      rowAX += auditColW[cvIdx];
    });

    layout.y -= 20;
  });

  layout.y -= 30;

  // ==========================================
  // 6. CLOSING & ADVISORY NOTICE
  // ==========================================
  ensureSpace(layout, 90);
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 75,
    width: contentWidth,
    height: 75,
    color: COLOR_LIGHT_GRAY,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  layout.currentPage.drawText("FINAL COMMERCIAL ADVISORY STATEMENT", {
    x: leftMargin + 14,
    y: layout.y - 18,
    size: 9,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  const advNoticeLines = wrapText(
    sanitizeText(
      rec.advisoryNotice +
        " Gathbandhan provides automated financial auditing and proposal comparison, but contracts and vendor commitments must be reviewed by the event planner and authorized client signatories."
    ),
    fontRegular,
    8,
    contentWidth - 28
  );

  let nY = layout.y - 34;
  advNoticeLines.slice(0, 3).forEach((line) => {
    layout.currentPage.drawText(line, {
      x: leftMargin + 14,
      y: nY,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
    nY -= 12;
  });

  // ==========================================
  // STAMP RUNNING FOOTERS & PAGE NUMBERS (Pass 2)
  // ==========================================
  const totalPages = layout.pages.length;
  layout.pages.forEach((page, pIdx) => {
    // Footer line
    page.drawLine({
      start: { x: leftMargin, y: 34 },
      end: { x: leftMargin + contentWidth, y: 34 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });

    // Left Footer
    page.drawText("Gathbandhan • AI Quotation Analyzer & Financial Intelligence", {
      x: leftMargin,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });

    // Right Footer (Page X of Y)
    const pageStr = `Page ${pIdx + 1} of ${totalPages}`;
    const pWidth = fontRegular.widthOfTextAtSize(pageStr, 7.5);
    page.drawText(pageStr, {
      x: leftMargin + contentWidth - pWidth,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
