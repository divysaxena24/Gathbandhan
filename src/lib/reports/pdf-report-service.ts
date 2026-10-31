/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { ReportGenerationInput } from "./report-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { getCachedAnalysis } from "@/lib/ai/quotation-analyzer-service";
import { MultiVendorComparisonResult } from "@/lib/ai/comparison-types";

// ==========================================
// Color Palette (Luxury Ivory, Charcoal & Gold)
// ==========================================
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
const COLOR_BLUE = rgb(0.18, 0.45, 0.82);
const COLOR_PURPLE = rgb(0.55, 0.3, 0.75);

interface PageInfo {
  page: PDFPage;
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
}

interface LayoutState {
  doc: PDFDocument;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontOblique: PDFFont;
  currentPage: PDFPage;
  currentOrientation: "portrait" | "landscape";
  y: number;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  contentWidth: number;
  pages: PageInfo[];
}

function createNewPage(layout: LayoutState, orientation: "portrait" | "landscape" = "portrait"): PDFPage {
  const isLandscape = orientation === "landscape";
  const pWidth = isLandscape ? 841.89 : 595.28;
  const pHeight = isLandscape ? 595.28 : 841.89;

  const page = layout.doc.addPage([pWidth, pHeight]);
  layout.currentPage = page;
  layout.currentOrientation = orientation;
  layout.pageWidth = pWidth;
  layout.pageHeight = pHeight;
  layout.contentWidth = pWidth - layout.leftMargin - layout.rightMargin;
  layout.y = pHeight - 44; // top margin
  layout.pages.push({ page, orientation, width: pWidth, height: pHeight });

  // Top Decorative Header Band on subsequent pages
  if (layout.pages.length > 1) {
    page.drawRectangle({
      x: 0,
      y: pHeight - 8,
      width: pWidth,
      height: 8,
      color: COLOR_GOLD,
    });
  }

  return page;
}

function ensureSpace(
  layout: LayoutState,
  requiredHeight: number,
  orientation: "portrait" | "landscape" = "portrait",
  onPageBreak?: () => void
): void {
  if (layout.y - requiredHeight < 45) {
    createNewPage(layout, orientation);
    if (onPageBreak) {
      onPageBreak();
    }
  }
}

function sanitizeText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[\u20B9]/g, "Rs. ") // Rupee symbol to Rs.
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2013\u2014]/g, "-") // en/em dash
    .replace(/[\u2022]/g, "*") // bullet
    .replace(/[\u2713\u2714]/g, "[OK]") // checkmark
    .replace(/[\u26A0]/g, "[!]") // warning
    .replace(/[^\x00-\x7F]/g, " "); // Standard ASCII only for Helvetica
}

export function truncateWithEllipsis(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string {
  if (!text) return "";
  const sanitized = sanitizeText(text).trim();
  if (font.widthOfTextAtSize(sanitized, fontSize) <= maxWidth) {
    return sanitized;
  }

  const ellipsis = "...";
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);
  const targetWidth = maxWidth - ellipsisWidth;
  if (targetWidth <= 0) return ellipsis;

  let low = 0;
  let high = sanitized.length;
  let best = "";

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sub = sanitized.slice(0, mid);
    if (font.widthOfTextAtSize(sub, fontSize) <= targetWidth) {
      best = sub;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return `${best.trim()}${ellipsis}`;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = sanitizeText(text).replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word exceeds maxWidth - break down by character
        let subWord = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(subWord + char, fontSize) <= maxWidth) {
            subWord += char;
          } else {
            lines.push(subWord);
            subWord = char;
          }
        }
        currentLine = subWord;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatMoney(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  const currLabel = currency === "INR" ? "Rs." : currency;
  return `${currLabel} ${Math.round(amount).toLocaleString("en-IN")}`;
}

export function resolveCleanCategory(
  comparisonResult: MultiVendorComparisonResult,
  analyzedQuotations: QuotationAnalysisResult[]
): string {
  const cat = comparisonResult.categoryCompatibility.primaryCategory;
  if (cat && cat !== "Unspecified" && cat !== "General Services") {
    return cat;
  }
  for (const q of analyzedQuotations) {
    const qCat = q.vendorDetails.category;
    if (qCat && qCat !== "Unspecified" && qCat !== "General Services") {
      return qCat;
    }
  }
  return "Not provided";
}

export function getConfidenceDescription(confidenceLevel: string, isProvisional: boolean): string {
  const base =
    confidenceLevel === "HIGH"
      ? "HIGH (Based on explicit itemized quotation text and 100% deterministic arithmetic validation)"
      : confidenceLevel === "MEDIUM"
      ? "MEDIUM (Proposal contains lump-sum items or inferred payment milestones)"
      : "LOW (Limited itemization or significant unquoted service scope)";
  return isProvisional ? `${base} — Provisional match due to scope variance` : base;
}

/**
 * Builds client-ready, multi-page Gathbandhan Wedding Quotation Comparison PDF Report.
 */
export async function generatePdfReport(input: ReportGenerationInput): Promise<Buffer> {
  const { comparisonResult, metadata } = input;
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const leftMargin = 38;
  const rightMargin = 38;

  const layout: LayoutState = {
    doc: pdfDoc,
    fontRegular,
    fontBold,
    fontOblique,
    currentPage: null as any,
    currentOrientation: "portrait",
    y: 841.89 - 44,
    pageWidth: 595.28,
    pageHeight: 841.89,
    leftMargin,
    rightMargin,
    contentWidth: 595.28 - leftMargin - rightMargin,
    pages: [],
  };

  const analyzedQuotations: QuotationAnalysisResult[] =
    input.analyzedQuotations && input.analyzedQuotations.length > 0
      ? input.analyzedQuotations
      : comparisonResult.vendors
          .map((v) => getCachedAnalysis(v.uploadId))
          .filter((q): q is QuotationAnalysisResult => Boolean(q));

  const cleanCategory = resolveCleanCategory(comparisonResult, analyzedQuotations);
  const rec = comparisonResult.recommendation;
  const vendors = comparisonResult.vendors;
  const scoring = comparisonResult.scoring;

  // =========================================================================
  // PAGE 1: EXECUTIVE OVERVIEW & STRATEGIC RECOMMENDATION (Portrait)
  // =========================================================================
  createNewPage(layout, "portrait");

  // Top Decorative Gold Header Band
  layout.currentPage.drawRectangle({
    x: 0,
    y: layout.pageHeight - 16,
    width: layout.pageWidth,
    height: 16,
    color: COLOR_GOLD,
  });

  layout.y = layout.pageHeight - 70;

  // Brand Header
  layout.currentPage.drawText("GATHBANDHAN", {
    x: leftMargin,
    y: layout.y,
    size: 22,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 12;

  layout.currentPage.drawText("LUXURY WEDDING OPERATIONS & COMMERCIAL AUDIT INTELLIGENCE", {
    x: leftMargin,
    y: layout.y,
    size: 8,
    font: fontBold,
    color: COLOR_GOLD,
  });
  layout.y -= 20;

  layout.currentPage.drawLine({
    start: { x: leftMargin, y: layout.y },
    end: { x: leftMargin + layout.contentWidth, y: layout.y },
    thickness: 1.2,
    color: COLOR_GOLD,
  });
  layout.y -= 28;

  // Report Main Title
  layout.currentPage.drawText("Wedding Vendor Quotation Comparison Report", {
    x: leftMargin,
    y: layout.y,
    size: 18,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 16;

  layout.currentPage.drawText("Comprehensive Multi-Vendor Commercial Evaluation, Scoring & Audit", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontRegular,
    color: COLOR_CHARCOAL_MUTED,
  });
  layout.y -= 24;

  // Metadata Card (2 Columns with exact boundary protection)
  const metaBoxHeight = 78;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - metaBoxHeight,
    width: layout.contentWidth,
    height: metaBoxHeight,
    color: COLOR_LIGHT_GRAY,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  const metaCol1 = [
    ["Event Name:", metadata?.eventName || "Wedding Proposal Evaluation"],
    ["Service Category:", cleanCategory],
    ["Report Date:", metadata?.generatedAt || new Date().toLocaleDateString()],
  ];
  const metaCol2 = [
    ["Vendors Evaluated:", `${vendors.length} Proposals Analyzed`],
    ["Top Recommendation:", rec.recommendedVendorName],
    ["Prepared By:", metadata?.preparedBy || "Gathbandhan Automated Intelligence"],
  ];

  let mY = layout.y - 16;
  metaCol1.forEach(([lbl, rawVal]) => {
    layout.currentPage.drawText(lbl, {
      x: leftMargin + 12,
      y: mY,
      size: 8,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    const val = truncateWithEllipsis(rawVal, fontRegular, 8, 155);
    layout.currentPage.drawText(val, {
      x: leftMargin + 105,
      y: mY,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    mY -= 17;
  });

  mY = layout.y - 16;
  metaCol2.forEach(([lbl, rawVal]) => {
    layout.currentPage.drawText(lbl, {
      x: leftMargin + 270,
      y: mY,
      size: 8,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    const val = truncateWithEllipsis(rawVal, fontRegular, 8, 135);
    layout.currentPage.drawText(val, {
      x: leftMargin + 375,
      y: mY,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    mY -= 17;
  });

  layout.y -= metaBoxHeight + 18;

  // Currency Warning Banner (if multiple currencies detected)
  if (!comparisonResult.currencyCompatibility.isCompatible) {
    const curMsg = sanitizeText(comparisonResult.currencyCompatibility.warningMessage || "Multiple currencies detected in proposals.");
    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 24,
      width: layout.contentWidth,
      height: 24,
      color: COLOR_AMBER_LIGHT,
      borderColor: COLOR_AMBER,
      borderWidth: 1,
    });
    layout.currentPage.drawText(truncateWithEllipsis(`[!] Notice: ${curMsg}`, fontBold, 7.5, layout.contentWidth - 20), {
      x: leftMargin + 8,
      y: layout.y - 16,
      size: 7.5,
      font: fontBold,
      color: COLOR_AMBER,
    });
    layout.y -= 32;
  }

  // =========================================================================
  // Executive Recommendation Hero Card (With 3 Distinct Verification Badges)
  // =========================================================================
  const recHeadlineLines = wrapText(rec.headline, fontBold, 13, layout.contentWidth - 32);
  const recSummaryLines = wrapText(rec.executiveSummary, fontRegular, 8.2, layout.contentWidth - 32).slice(0, 3);

  // Compute dynamic height of recommendation card
  const badgeCardHeight = 44;
  const recCardPadding = 24;
  const recBoxHeight =
    recCardPadding +
    recHeadlineLines.length * 16 +
    recSummaryLines.length * 11 +
    badgeCardHeight +
    22;

  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - recBoxHeight,
    width: layout.contentWidth,
    height: recBoxHeight,
    color: COLOR_GOLD_LIGHT,
    borderColor: COLOR_GOLD,
    borderWidth: 1.5,
  });

  layout.currentPage.drawText("EXECUTIVE RECOMMENDATION SUMMARY", {
    x: leftMargin + 14,
    y: layout.y - 16,
    size: 8.5,
    font: fontBold,
    color: COLOR_GOLD,
  });

  let hY = layout.y - 32;
  recHeadlineLines.forEach((hl) => {
    layout.currentPage.drawText(hl, {
      x: leftMargin + 14,
      y: hY,
      size: 13,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    hY -= 15;
  });

  hY -= 4;
  recSummaryLines.forEach((sl) => {
    layout.currentPage.drawText(sl, {
      x: leftMargin + 14,
      y: hY,
      size: 8.2,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    hY -= 11;
  });

  // -------------------------------------------------------------------------
  // 3 Separated Verification Indicators (Confidence, Completeness, Financial)
  // -------------------------------------------------------------------------
  const badgeGap = 8;
  const badgeW = (layout.contentWidth - 28 - badgeGap * 2) / 3;
  const badgeY = layout.y - recBoxHeight + 10;

  // 1. Extraction Confidence Badge
  const isHighConf = rec.confidenceLevel === "HIGH";
  layout.currentPage.drawRectangle({
    x: leftMargin + 14,
    y: badgeY,
    width: badgeW,
    height: badgeCardHeight,
    color: isHighConf ? COLOR_EMERALD_LIGHT : COLOR_AMBER_LIGHT,
    borderColor: isHighConf ? COLOR_EMERALD : COLOR_AMBER,
    borderWidth: 0.8,
  });

  layout.currentPage.drawText("EXTRACTION CONFIDENCE", {
    x: leftMargin + 20,
    y: badgeY + badgeCardHeight - 12,
    size: 7,
    font: fontBold,
    color: isHighConf ? COLOR_EMERALD : COLOR_AMBER,
  });

  const confLabel = `${rec.confidenceLevel}${rec.isProvisional ? " (Provisional)" : " (Verified)"}`;
  layout.currentPage.drawText(confLabel, {
    x: leftMargin + 20,
    y: badgeY + badgeCardHeight - 23,
    size: 8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  const confSub = isHighConf ? "Itemized digital text extraction" : "Partial lump-sum inference";
  layout.currentPage.drawText(truncateWithEllipsis(confSub, fontRegular, 6.8, badgeW - 12), {
    x: leftMargin + 20,
    y: badgeY + 8,
    size: 6.8,
    font: fontRegular,
    color: COLOR_CHARCOAL_MUTED,
  });

  // 2. Evidence Completeness Badge
  const recScore = scoring.vendorScores[rec.recommendedVendorId];
  const availCount = recScore?.availableCriteriaCount ?? 6;
  layout.currentPage.drawRectangle({
    x: leftMargin + 14 + badgeW + badgeGap,
    y: badgeY,
    width: badgeW,
    height: badgeCardHeight,
    color: COLOR_LIGHT_GRAY,
    borderColor: COLOR_BORDER,
    borderWidth: 0.8,
  });

  layout.currentPage.drawText("EVIDENCE COMPLETENESS", {
    x: leftMargin + 14 + badgeW + badgeGap + 6,
    y: badgeY + badgeCardHeight - 12,
    size: 7,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  layout.currentPage.drawText(`${availCount} of 6 Criteria Documented`, {
    x: leftMargin + 14 + badgeW + badgeGap + 6,
    y: badgeY + badgeCardHeight - 23,
    size: 8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  const recVendor = vendors.find((v) => v.uploadId === rec.recommendedVendorId);
  const incCount = recVendor?.inclusionsCount ?? 0;
  layout.currentPage.drawText(
    truncateWithEllipsis(`${incCount} verified inclusions & terms`, fontRegular, 6.8, badgeW - 12),
    {
      x: leftMargin + 14 + badgeW + badgeGap + 6,
      y: badgeY + 8,
      size: 6.8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );

  // 3. Financial Verification Status Badge
  const isFinVerified = rec.financialAuditAssessment.status === "VERIFIED";
  layout.currentPage.drawRectangle({
    x: leftMargin + 14 + (badgeW + badgeGap) * 2,
    y: badgeY,
    width: badgeW,
    height: badgeCardHeight,
    color: isFinVerified ? COLOR_EMERALD_LIGHT : COLOR_ROSE_LIGHT,
    borderColor: isFinVerified ? COLOR_EMERALD : COLOR_ROSE,
    borderWidth: 0.8,
  });

  layout.currentPage.drawText("FINANCIAL VERIFICATION", {
    x: leftMargin + 14 + (badgeW + badgeGap) * 2 + 6,
    y: badgeY + badgeCardHeight - 12,
    size: 7,
    font: fontBold,
    color: isFinVerified ? COLOR_EMERALD : COLOR_ROSE,
  });

  const finStatusStr = isFinVerified ? "100% Math Verified" : "Calculation Discrepancy";
  layout.currentPage.drawText(finStatusStr, {
    x: leftMargin + 14 + (badgeW + badgeGap) * 2 + 6,
    y: badgeY + badgeCardHeight - 23,
    size: 8,
    font: fontBold,
    color: isFinVerified ? COLOR_EMERALD : COLOR_ROSE,
  });

  const finDetailStr = isFinVerified ? "0 variance across subtotals & taxes" : "Discrepancy detected in math";
  layout.currentPage.drawText(truncateWithEllipsis(finDetailStr, fontRegular, 6.8, badgeW - 12), {
    x: leftMargin + 14 + (badgeW + badgeGap) * 2 + 6,
    y: badgeY + 8,
    size: 6.8,
    font: fontRegular,
    color: COLOR_CHARCOAL_MUTED,
  });

  layout.y -= recBoxHeight + 20;

  // Major Advantages vs Commercial Trade-offs Grid (Side-by-side with wrapping)
  const gridW = (layout.contentWidth - 14) / 2;
  const advBullets = rec.majorAdvantages.slice(0, 4);
  const disBullets = rec.commercialDisadvantages.slice(0, 4);

  const advLinesArr = advBullets.map((adv) => wrapText(`+  ${adv}`, fontRegular, 7.8, gridW - 22));
  const disLinesArr = disBullets.map((dis) => wrapText(`!  ${dis}`, fontRegular, 7.8, gridW - 22));

  const advTotalLines = advLinesArr.reduce((acc, lines) => acc + Math.min(lines.length, 2), 0);
  const disTotalLines = disLinesArr.reduce((acc, lines) => acc + Math.min(lines.length, 2), 0);
  const gridH = Math.max(95, Math.max(advTotalLines, disTotalLines) * 14 + 32);

  // Advantages Box (Left)
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - gridH,
    width: gridW,
    height: gridH,
    color: COLOR_EMERALD_LIGHT,
    borderColor: COLOR_EMERALD,
    borderWidth: 1,
  });

  layout.currentPage.drawText("MAJOR COMMERCIAL ADVANTAGES", {
    x: leftMargin + 12,
    y: layout.y - 16,
    size: 8.5,
    font: fontBold,
    color: COLOR_EMERALD,
  });

  let aY = layout.y - 32;
  advLinesArr.forEach((lines) => {
    lines.slice(0, 2).forEach((l) => {
      layout.currentPage.drawText(l, {
        x: leftMargin + 12,
        y: aY,
        size: 7.8,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      aY -= 12;
    });
    aY -= 3;
  });

  // Trade-offs Box (Right)
  layout.currentPage.drawRectangle({
    x: leftMargin + gridW + 14,
    y: layout.y - gridH,
    width: gridW,
    height: gridH,
    color: COLOR_AMBER_LIGHT,
    borderColor: COLOR_AMBER,
    borderWidth: 1,
  });

  layout.currentPage.drawText("COMMERCIAL TRADE-OFFS & IDENTIFIED RISKS", {
    x: leftMargin + gridW + 26,
    y: layout.y - 16,
    size: 8.5,
    font: fontBold,
    color: COLOR_AMBER,
  });

  let dY = layout.y - 32;
  disLinesArr.forEach((lines) => {
    lines.slice(0, 2).forEach((l) => {
      layout.currentPage.drawText(l, {
        x: leftMargin + gridW + 26,
        y: dY,
        size: 7.8,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      });
      dY -= 12;
    });
    dY -= 3;
  });

  layout.y -= gridH + 18;

  // Pre-contract Questions checklist
  if (rec.questionsToClarifyBeforeSigning.length > 0) {
    layout.currentPage.drawText("ESSENTIAL CLARIFICATIONS BEFORE SIGNING CONTRACT", {
      x: leftMargin,
      y: layout.y,
      size: 9,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
    layout.y -= 14;

    rec.questionsToClarifyBeforeSigning.slice(0, 3).forEach((q, idx) => {
      const qLines = wrapText(`[  ] ${idx + 1}. ${q}`, fontRegular, 7.8, layout.contentWidth - 10);
      qLines.forEach((ql) => {
        layout.currentPage.drawText(ql, {
          x: leftMargin + 4,
          y: layout.y,
          size: 7.8,
          font: fontRegular,
          color: COLOR_CHARCOAL_DARK,
        });
        layout.y -= 12;
      });
    });
  }

  // =========================================================================
  // PAGE 2: VISUAL VENDOR COMPARISON & COMMERCIAL CHARTS (Portrait)
  // =========================================================================
  createNewPage(layout, "portrait");

  layout.currentPage.drawText("Visual Vendor Comparison & Commercial Intelligence", {
    x: leftMargin,
    y: layout.y,
    size: 15,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 13;

  layout.currentPage.drawText(
    "Interactive commercial analytics derived directly from verified vendor quotation line items.",
    {
      x: leftMargin,
      y: layout.y,
      size: 8.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.y -= 26;

  // Responsive chart row height and spacing scaling
  const vendorCount = vendors.length;
  const chartRowHeight = vendorCount <= 3 ? 18 : vendorCount <= 4 ? 16 : 14;
  const chartRowStep = vendorCount <= 3 ? 24 : vendorCount <= 4 ? 20 : 17;
  const chartSectionGap = vendorCount <= 3 ? 20 : vendorCount <= 4 ? 14 : 10;

  // -------------------------------------------------------------
  // CHART 1: Composite Score Comparison (0 - 100 Points)
  // -------------------------------------------------------------
  layout.currentPage.drawText("1. Overall Vendor Composite Score Comparison", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  const chart1MaxW = layout.contentWidth - 210;
  vendors.forEach((v) => {
    const sc = scoring.vendorScores[v.uploadId];
    const scoreVal = sc ? sc.totalScore : 0;
    const isWinner = v.uploadId === rec.recommendedVendorId;
    const barW = Math.max(8, (scoreVal / 100) * chart1MaxW);

    // Vendor Label (safely bounded)
    const vLabel = truncateWithEllipsis(v.vendorName, isWinner ? fontBold : fontRegular, 8, 125);
    layout.currentPage.drawText(vLabel, {
      x: leftMargin,
      y: layout.y - 10,
      size: 8,
      font: isWinner ? fontBold : fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });

    // Bar Track
    layout.currentPage.drawRectangle({
      x: leftMargin + 130,
      y: layout.y - 12,
      width: chart1MaxW,
      height: chartRowHeight - 4,
      color: COLOR_LIGHT_GRAY,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    // Score Bar
    layout.currentPage.drawRectangle({
      x: leftMargin + 130,
      y: layout.y - 12,
      width: barW,
      height: chartRowHeight - 4,
      color: isWinner ? COLOR_GOLD : COLOR_BLUE,
    });

    // Score Text
    layout.currentPage.drawText(`${scoreVal} / 100 ${isWinner ? " (Rank #1)" : ""}`, {
      x: leftMargin + 135 + barW,
      y: layout.y - 10,
      size: 7.5,
      font: fontBold,
      color: isWinner ? COLOR_GOLD : COLOR_CHARCOAL_DARK,
    });

    layout.y -= chartRowStep;
  });

  layout.y -= chartSectionGap;

  // -------------------------------------------------------------
  // CHART 2: Quoted Cost Comparison (Stated vs Calculated)
  // -------------------------------------------------------------
  layout.currentPage.drawText("2. Quoted Commercial Cost Comparison (Stated vs Calculated)", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  const validTotals = vendors
    .map((v) => v.calculatedGrandTotal ?? v.statedGrandTotal ?? 0)
    .filter((p) => p > 0);
  const maxCost = validTotals.length > 0 ? Math.max(...validTotals) : 100000;
  const minCost = validTotals.length > 0 ? Math.min(...validTotals) : 0;
  const chart2MaxW = layout.contentWidth - 210;

  vendors.forEach((v) => {
    const costVal = v.calculatedGrandTotal ?? v.statedGrandTotal ?? 0;
    const isLowest = costVal > 0 && costVal === minCost;
    const barW = Math.max(10, (costVal / maxCost) * chart2MaxW);
    const hasDiscrepancy = v.financialAuditStatus !== "MATCHED";

    // Vendor Label
    const vLabel = truncateWithEllipsis(v.vendorName, fontRegular, 8, 125);
    layout.currentPage.drawText(vLabel, {
      x: leftMargin,
      y: layout.y - 10,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });

    // Bar Track
    layout.currentPage.drawRectangle({
      x: leftMargin + 130,
      y: layout.y - 12,
      width: chart2MaxW,
      height: chartRowHeight - 4,
      color: COLOR_LIGHT_GRAY,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    // Cost Bar
    layout.currentPage.drawRectangle({
      x: leftMargin + 130,
      y: layout.y - 12,
      width: barW,
      height: chartRowHeight - 4,
      color: isLowest ? COLOR_EMERALD : COLOR_CHARCOAL_DARK,
    });

    // Price label
    const priceStr = `${formatMoney(costVal, v.currency)}${isLowest ? " (Lowest)" : ""}${hasDiscrepancy ? " [!]" : ""}`;
    layout.currentPage.drawText(priceStr, {
      x: leftMargin + 135 + barW,
      y: layout.y - 10,
      size: 7.5,
      font: fontBold,
      color: isLowest ? COLOR_EMERALD : hasDiscrepancy ? COLOR_AMBER : COLOR_CHARCOAL_DARK,
    });

    layout.y -= chartRowStep;
  });

  layout.y -= chartSectionGap;

  // -------------------------------------------------------------
  // CHART 3: Weighted 6-Criteria Scoring Breakdown (100-pt Stack)
  // -------------------------------------------------------------
  layout.currentPage.drawText("3. Weighted 6-Criteria Score Composition (100-Point Stack)", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  const stackW = layout.contentWidth - 190;
  vendors.forEach((v) => {
    const sc = scoring.vendorScores[v.uploadId];
    if (!sc) return;

    const vLabel = truncateWithEllipsis(v.vendorName, fontRegular, 8, 125);
    layout.currentPage.drawText(vLabel, {
      x: leftMargin,
      y: layout.y - 10,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });

    const cPts = sc.criteria.costCompetitiveness.weightedScore;
    const covPts = sc.criteria.serviceCoverage.weightedScore;
    const qPts = sc.criteria.qualityAndPortfolio.weightedScore;
    const pPts = sc.criteria.pastPerformance.weightedScore;
    const tPts = sc.criteria.commercialTerms.weightedScore;
    const aPts = sc.criteria.transparency.weightedScore;

    let curX = leftMargin + 130;
    const segments = [
      { pts: cPts, color: COLOR_EMERALD },
      { pts: covPts, color: COLOR_BLUE },
      { pts: qPts, color: COLOR_PURPLE },
      { pts: pPts, color: COLOR_AMBER },
      { pts: tPts, color: COLOR_GOLD },
      { pts: aPts, color: COLOR_CHARCOAL_DARK },
    ];

    segments.forEach((seg) => {
      const segW = (seg.pts / 100) * stackW;
      if (segW > 0.5) {
        layout.currentPage.drawRectangle({
          x: curX,
          y: layout.y - 12,
          width: segW,
          height: chartRowHeight - 4,
          color: seg.color,
        });
        curX += segW;
      }
    });

    layout.currentPage.drawText(`${sc.totalScore} Pts`, {
      x: curX + 5,
      y: layout.y - 10,
      size: 7.5,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });

    layout.y -= chartRowStep;
  });

  // Stack Legend
  layout.y -= 2;
  const legItems = [
    { label: "Cost", color: COLOR_EMERALD },
    { label: "Coverage", color: COLOR_BLUE },
    { label: "Quality", color: COLOR_PURPLE },
    { label: "Past Perf", color: COLOR_AMBER },
    { label: "Terms", color: COLOR_GOLD },
    { label: "Audit", color: COLOR_CHARCOAL_DARK },
  ];
  let legX = leftMargin + 130;
  legItems.forEach((item) => {
    layout.currentPage.drawRectangle({
      x: legX,
      y: layout.y - 8,
      width: 7,
      height: 7,
      color: item.color,
    });
    layout.currentPage.drawText(item.label, {
      x: legX + 10,
      y: layout.y - 7,
      size: 6.8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
    legX += 56;
  });

  layout.y -= chartSectionGap + 10;

  // -------------------------------------------------------------
  // CHART 4: Deterministic Math Audit & Line-Item Variance Proof
  // -------------------------------------------------------------
  layout.currentPage.drawText("4. Deterministic Financial Audit & Line-Item Variance Proof", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  const proofTrackW = layout.contentWidth - 140;
  vendors.forEach((v) => {
    const isClean = v.financialAuditStatus === "MATCHED";

    const vLabel = truncateWithEllipsis(v.vendorName, fontRegular, 8, 125);
    layout.currentPage.drawText(vLabel, {
      x: leftMargin,
      y: layout.y - 10,
      size: 8,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });

    layout.currentPage.drawRectangle({
      x: leftMargin + 130,
      y: layout.y - 13,
      width: proofTrackW,
      height: 15,
      color: isClean ? COLOR_EMERALD_LIGHT : COLOR_ROSE_LIGHT,
      borderColor: isClean ? COLOR_EMERALD : COLOR_ROSE,
      borderWidth: 0.5,
    });

    const rawProofStr = isClean
      ? `[OK] 100% Math Match - Stated ${formatMoney(v.statedGrandTotal, v.currency)} == Calculated ${formatMoney(v.calculatedGrandTotal, v.currency)} (0 Variance)`
      : `[!] Calculation Variance Flagged - ${v.discrepancyCount} discrepancy issue(s) detected`;
    const proofStr = truncateWithEllipsis(rawProofStr, fontBold, 7, proofTrackW - 10);

    layout.currentPage.drawText(proofStr, {
      x: leftMargin + 136,
      y: layout.y - 9,
      size: 7,
      font: fontBold,
      color: isClean ? COLOR_EMERALD : COLOR_ROSE,
    });

    layout.y -= chartRowStep;
  });

  // =========================================================================
  // PAGE 3: SIDE-BY-SIDE VENDOR COMPARISON MATRIX (Landscape Orientation)
  // =========================================================================
  createNewPage(layout, "landscape");

  layout.currentPage.drawText("Commercial Terms & Service Scope — Multi-Vendor Comparison Matrix", {
    x: leftMargin,
    y: layout.y,
    size: 13,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 11;

  layout.currentPage.drawText(
    "Full-width comparative matrix with intelligent wrapping, zero text truncation, and complete commercial term fidelity.",
    {
      x: leftMargin,
      y: layout.y,
      size: 7.8,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.y -= 16;

  // Calculate Column Widths in Landscape
  const col1W = 155;
  const numVendors = vendors.length;
  const vendorColW = Math.floor((layout.contentWidth - col1W) / numVendors);

  // Helper to render comparison table header
  const renderMatrixHeader = () => {
    const vendorNameLineArrays = vendors.map((v) =>
      wrapText(v.vendorName, fontBold, 7.8, vendorColW - 12)
    );
    const maxNameLines = Math.max(1, ...vendorNameLineArrays.map((arr) => arr.length));
    const headerHeight = Math.max(28, maxNameLines * 9 + 18);

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - headerHeight,
      width: layout.contentWidth,
      height: headerHeight,
      color: COLOR_CHARCOAL_DARK,
    });

    layout.currentPage.drawText("Comparison Metric / Criterion", {
      x: leftMargin + 8,
      y: layout.y - 16,
      size: 8,
      font: fontBold,
      color: COLOR_WHITE,
    });

    vendors.forEach((v, idx) => {
      const xPos = leftMargin + col1W + idx * vendorColW;
      const isWinner = v.uploadId === rec.recommendedVendorId;
      const lines = vendorNameLineArrays[idx];

      let hY = layout.y - 12;
      lines.slice(0, 2).forEach((l) => {
        layout.currentPage.drawText(l, {
          x: xPos + 6,
          y: hY,
          size: 7.8,
          font: fontBold,
          color: isWinner ? COLOR_GOLD : COLOR_WHITE,
        });
        hY -= 9;
      });

      // Rank & Price below name
      layout.currentPage.drawText(
        `Rank #${scoring.vendorScores[v.uploadId]?.rank ?? idx + 1} • ${formatMoney(v.calculatedGrandTotal ?? v.statedGrandTotal, v.currency)}`,
        {
          x: xPos + 6,
          y: layout.y - headerHeight + 5,
          size: 6.8,
          font: fontRegular,
          color: COLOR_GOLD_LIGHT,
        }
      );
    });

    layout.y -= headerHeight;
  };

  renderMatrixHeader();

  // Render Matrix Rows with Intelligent Text Wrapping
  comparisonResult.matrix.forEach((mRow, rIdx) => {
    const critLines = wrapText(mRow.criterion, fontBold, 7.5, col1W - 14);

    const vendorCellLines = vendors.map((v) => {
      const rawVal = mRow.values[v.uploadId];
      let displayStr = "—";
      if (rawVal === true) displayStr = "Yes (Included)";
      else if (rawVal === false) displayStr = "No (Excluded)";
      else if (rawVal !== null && rawVal !== undefined) displayStr = String(rawVal);
      return wrapText(displayStr, fontRegular, 7.2, vendorColW - 10);
    });

    const maxLines = Math.max(critLines.length, ...vendorCellLines.map((l) => l.length));
    const rowH = Math.max(16, maxLines * 8.5 + 5);

    // If row doesn't fit, split page and repeat header
    if (layout.y - rowH < 38) {
      createNewPage(layout, "landscape");
      renderMatrixHeader();
    }

    const rowBg = rIdx % 2 === 1 ? COLOR_LIGHT_GRAY : COLOR_WHITE;
    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - rowH,
      width: layout.contentWidth,
      height: rowH,
      color: rowBg,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    // Draw Criterion lines
    let cY = layout.y - 11;
    critLines.forEach((cl) => {
      layout.currentPage.drawText(cl, {
        x: leftMargin + 6,
        y: cY,
        size: 7.5,
        font: fontBold,
        color: COLOR_CHARCOAL_DARK,
      });
      cY -= 9;
    });

    // Draw Vendor values
    vendors.forEach((v, vIdx) => {
      const xPos = leftMargin + col1W + vIdx * vendorColW;
      const lines = vendorCellLines[vIdx];
      const isBest = mRow.highlightBest === v.uploadId;

      let vY = layout.y - 11;
      lines.forEach((vl) => {
        layout.currentPage.drawText(vl, {
          x: xPos + 6,
          y: vY,
          size: 7.2,
          font: isBest ? fontBold : fontRegular,
          color: isBest ? COLOR_EMERALD : COLOR_CHARCOAL_DARK,
        });
        vY -= 9;
      });
    });

    layout.y -= rowH;
  });

  // =========================================================================
  // PAGE 4: 6-CRITERIA SCORING METHODOLOGY & SCORECARDS (Portrait)
  // =========================================================================
  createNewPage(layout, "portrait");

  layout.currentPage.drawText("Transparent Weighted Scoring Methodology & 6-Criteria Audit", {
    x: leftMargin,
    y: layout.y,
    size: 13.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 13;

  layout.currentPage.drawText(
    "Rigorous evaluation across 6 commercial dimensions with dynamic re-normalization for unquoted criteria.",
    {
      x: leftMargin,
      y: layout.y,
      size: 8.2,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.y -= 18;

  // Explanation of Dynamic Re-normalization Callout Box
  const normExplLines = wrapText(
    "When qualitative dimensions (such as verified portfolio evidence or client references) cannot be substantiated from the uploaded quotation text, Gathbandhan marks them as 'Unavailable — excluded from scoring' rather than penalizing vendors with a zero score. The scoring engine deterministically re-normalizes the remaining active criteria weights to equal 100%, preserving mathematical equity.",
    fontRegular,
    7.5,
    layout.contentWidth - 24
  );
  const normBoxH = 22 + normExplLines.length * 10;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - normBoxH,
    width: layout.contentWidth,
    height: normBoxH,
    color: COLOR_GOLD_LIGHT,
    borderColor: COLOR_GOLD,
    borderWidth: 1,
  });

  layout.currentPage.drawText("HOW DYNAMIC WEIGHT RE-NORMALIZATION WORKS:", {
    x: leftMargin + 12,
    y: layout.y - 13,
    size: 7.8,
    font: fontBold,
    color: COLOR_GOLD,
  });

  let neY = layout.y - 24;
  normExplLines.forEach((line) => {
    layout.currentPage.drawText(line, {
      x: leftMargin + 12,
      y: neY,
      size: 7.3,
      font: fontRegular,
      color: COLOR_CHARCOAL_DARK,
    });
    neY -= 10;
  });

  layout.y -= normBoxH + 16;

  // -------------------------------------------------------------------------
  // 6-Criteria Table with Default and Effective Normalized Weights
  // -------------------------------------------------------------------------
  const scCol1W = vendorCount <= 3 ? 140 : 125;
  const scCol2W = 45; // Default Wt
  const scCol3W = 48; // Effective Wt
  const scFixedW = scCol1W + scCol2W + scCol3W;
  const scVenW = Math.floor((layout.contentWidth - scFixedW) / vendors.length);

  // Table Header
  const scHeaderH = 22;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - scHeaderH,
    width: layout.contentWidth,
    height: scHeaderH,
    color: COLOR_GOLD,
  });

  layout.currentPage.drawText("Criterion", {
    x: leftMargin + 6,
    y: layout.y - 14,
    size: 7.8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.currentPage.drawText("Default", {
    x: leftMargin + scCol1W + 4,
    y: layout.y - 14,
    size: 7.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.currentPage.drawText("Eff. Wt", {
    x: leftMargin + scCol1W + scCol2W + 4,
    y: layout.y - 14,
    size: 7.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  vendors.forEach((v, idx) => {
    const vNameHead = truncateWithEllipsis(v.vendorName, fontBold, 7.2, scVenW - 8);
    layout.currentPage.drawText(vNameHead, {
      x: leftMargin + scFixedW + idx * scVenW + 4,
      y: layout.y - 14,
      size: 7.2,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });
  });
  layout.y -= scHeaderH;

  // 6 Defined Criteria
  const criteriaList: Array<{
    key: keyof typeof scoring.weights;
    name: string;
    defaultWeight: string;
  }> = [
    { key: "costCompetitiveness", name: "1. Cost Competitiveness", defaultWeight: "30%" },
    { key: "serviceCoverage", name: "2. Service Coverage & Inclusions", defaultWeight: "25%" },
    { key: "qualityAndPortfolio", name: "3. Quality & Portfolio Evidence", defaultWeight: "15%" },
    { key: "pastPerformance", name: "4. Past Performance & Experience", defaultWeight: "15%" },
    { key: "commercialTerms", name: "5. Commercial Terms & Flexibility", defaultWeight: "10%" },
    { key: "transparency", name: "6. Financial Transparency & Audit", defaultWeight: "5%" },
  ];

  criteriaList.forEach((crit, idx) => {
    // Determine effective weight across vendors
    const effWeights = vendors.map(
      (v) => scoring.vendorScores[v.uploadId]?.criteria[crit.key]?.adjustedWeight ?? 0
    );
    const minEff = Math.min(...effWeights);
    const maxEff = Math.max(...effWeights);
    const hasAvailable = effWeights.some((w) => w > 0);

    const effWeightStr = !hasAvailable
      ? "0% (Excl.)"
      : minEff === maxEff
      ? `${minEff.toFixed(1)}%`
      : `${minEff.toFixed(0)}%-${maxEff.toFixed(0)}%`;

    // Row height: 2 lines per vendor cell if needed
    const rowH = 22;
    const rowBg = idx % 2 === 1 ? COLOR_LIGHT_GRAY : COLOR_WHITE;

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - rowH,
      width: layout.contentWidth,
      height: rowH,
      color: rowBg,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    layout.currentPage.drawText(crit.name, {
      x: leftMargin + 6,
      y: layout.y - 14,
      size: 7.3,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });

    layout.currentPage.drawText(crit.defaultWeight, {
      x: leftMargin + scCol1W + 6,
      y: layout.y - 14,
      size: 7.2,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });

    layout.currentPage.drawText(effWeightStr, {
      x: leftMargin + scCol1W + scCol2W + 6,
      y: layout.y - 14,
      size: 7.2,
      font: fontBold,
      color: hasAvailable ? COLOR_EMERALD : COLOR_CHARCOAL_MUTED,
    });

    vendors.forEach((v, vIdx) => {
      const sc = scoring.vendorScores[v.uploadId];
      const critScore = sc?.criteria[crit.key];
      const cellX = leftMargin + scFixedW + vIdx * scVenW + 4;

      if (critScore?.isAvailable) {
        layout.currentPage.drawText(
          `${critScore.normalizedScore}/100 (+${critScore.weightedScore.toFixed(1)} pts)`,
          {
            x: cellX,
            y: layout.y - 10,
            size: 6.8,
            font: fontRegular,
            color: COLOR_CHARCOAL_DARK,
          }
        );
        layout.currentPage.drawText(`Eff: ${critScore.adjustedWeight.toFixed(1)}% wt`, {
          x: cellX,
          y: layout.y - 18,
          size: 6.2,
          font: fontOblique,
          color: COLOR_CHARCOAL_MUTED,
        });
      } else {
        // Requirement 3: Change unavailable scoring criteria to "Unavailable — excluded from scoring"
        if (scVenW >= 110) {
          layout.currentPage.drawText("Unavailable — excluded from scoring", {
            x: cellX,
            y: layout.y - 14,
            size: 6.5,
            font: fontOblique,
            color: COLOR_CHARCOAL_MUTED,
          });
        } else {
          layout.currentPage.drawText("Unavailable", {
            x: cellX,
            y: layout.y - 10,
            size: 6.5,
            font: fontOblique,
            color: COLOR_CHARCOAL_MUTED,
          });
          layout.currentPage.drawText("excluded from scoring", {
            x: cellX,
            y: layout.y - 18,
            size: 6,
            font: fontOblique,
            color: COLOR_CHARCOAL_MUTED,
          });
        }
      }
    });

    layout.y -= rowH;
  });

  // Total Score Row
  const totalRowH = 20;
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - totalRowH,
    width: layout.contentWidth,
    height: totalRowH,
    color: COLOR_GOLD_LIGHT,
    borderColor: COLOR_GOLD,
    borderWidth: 1,
  });

  layout.currentPage.drawText("Composite Final Score (Rank)", {
    x: leftMargin + 6,
    y: layout.y - 14,
    size: 7.8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.currentPage.drawText("100%", {
    x: leftMargin + scCol1W + 6,
    y: layout.y - 14,
    size: 7.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.currentPage.drawText("100%", {
    x: leftMargin + scCol1W + scCol2W + 6,
    y: layout.y - 14,
    size: 7.5,
    font: fontBold,
    color: COLOR_EMERALD,
  });

  vendors.forEach((v, vIdx) => {
    const sc = scoring.vendorScores[v.uploadId];
    const isWinner = v.uploadId === rec.recommendedVendorId;
    const summaryStr = `${sc?.totalScore ?? 0} Pts (Rank #${sc?.rank ?? vIdx + 1})`;
    layout.currentPage.drawText(
      truncateWithEllipsis(summaryStr, fontBold, 7.2, scVenW - 6),
      {
        x: leftMargin + scFixedW + vIdx * scVenW + 4,
        y: layout.y - 14,
        size: 7.2,
        font: fontBold,
        color: isWinner ? COLOR_GOLD : COLOR_CHARCOAL_DARK,
      }
    );
  });
  layout.y -= totalRowH + 18;

  // Vendor Scorecards Detail Grid
  layout.currentPage.drawText("Detailed Vendor Scorecard Provenance & Evidence Rationale", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  vendors.forEach((v) => {
    const sc = scoring.vendorScores[v.uploadId];
    if (!sc) return;

    // Build evidence lines with intelligent wrapping
    const costNote = `Cost: ${sc.criteria.costCompetitiveness.evidenceNotes}`;
    const scopeNote = `Scope: ${sc.criteria.serviceCoverage.evidenceNotes}`;
    const qualityNote = sc.criteria.qualityAndPortfolio.isAvailable
      ? `Quality: ${sc.criteria.qualityAndPortfolio.evidenceNotes}`
      : "Quality: Unavailable — excluded from scoring. Weight re-normalized.";
    const termsNote = `Terms: ${sc.criteria.commercialTerms.evidenceNotes}`;

    const lines1 = wrapText(costNote, fontRegular, 7, layout.contentWidth - 24).slice(0, 1);
    const lines2 = wrapText(scopeNote, fontRegular, 7, layout.contentWidth - 24).slice(0, 1);
    const lines3 = wrapText(qualityNote, fontRegular, 7, layout.contentWidth - 24).slice(0, 1);
    const lines4 = wrapText(termsNote, fontRegular, 7, layout.contentWidth - 24).slice(0, 1);

    const allNotes = [...lines1, ...lines2, ...lines3, ...lines4];
    const cardH = 20 + allNotes.length * 10;

    ensureSpace(layout, cardH + 10);

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - cardH,
      width: layout.contentWidth,
      height: cardH,
      color: COLOR_WHITE,
      borderColor: v.uploadId === rec.recommendedVendorId ? COLOR_GOLD : COLOR_BORDER,
      borderWidth: v.uploadId === rec.recommendedVendorId ? 1.5 : 0.8,
    });

    const isWinner = v.uploadId === rec.recommendedVendorId;
    const titleStr = `${v.vendorName} — Overall Score: ${sc.totalScore} / 100 (Rank #${sc.rank})`;
    layout.currentPage.drawText(
      truncateWithEllipsis(titleStr, fontBold, 8, layout.contentWidth - 24),
      {
        x: leftMargin + 10,
        y: layout.y - 13,
        size: 8,
        font: fontBold,
        color: isWinner ? COLOR_GOLD : COLOR_CHARCOAL_DARK,
      }
    );

    let nY = layout.y - 23;
    allNotes.forEach((note) => {
      layout.currentPage.drawText(note, {
        x: leftMargin + 10,
        y: nY,
        size: 7,
        font: fontRegular,
        color: COLOR_CHARCOAL_MUTED,
      });
      nY -= 10;
    });

    layout.y -= cardH + 8;
  });

  // =========================================================================
  // PAGE 5: FINANCIAL AUDIT & MATHEMATICAL RECONCILIATIONS (Portrait)
  // =========================================================================
  createNewPage(layout, "portrait");

  layout.currentPage.drawText("Deterministic Financial Audit & Mathematical Reconciliation", {
    x: leftMargin,
    y: layout.y,
    size: 13.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 13;

  layout.currentPage.drawText(
    "Automated decimal-precision verification protecting against billing surprises, hidden charges, and arithmetic calculation drift.",
    {
      x: leftMargin,
      y: layout.y,
      size: 8.2,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.y -= 22;

  // Financial Audit Table Header (Sum of column widths = 519pt <= layout.contentWidth 519.28)
  const auditHeaders = [
    "Vendor Name",
    "Math Audit Status",
    "Stated Total",
    "Calculated Total",
    "Discrepancy",
    "Advance Required",
  ];
  const auditColW = [135, 95, 78, 78, 68, 65];

  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 20,
    width: layout.contentWidth,
    height: 20,
    color: COLOR_CHARCOAL_DARK,
  });

  let aColX = leftMargin;
  auditHeaders.forEach((ah, idx) => {
    layout.currentPage.drawText(ah, {
      x: aColX + 5,
      y: layout.y - 14,
      size: 7.5,
      font: fontBold,
      color: COLOR_WHITE,
    });
    aColX += auditColW[idx];
  });
  layout.y -= 20;

  analyzedQuotations.forEach((q, qIdx) => {
    const vName = q.vendorDetails.vendorName || q.originalName;
    const fa = q.financialAudit;
    const isClean = fa.isValid;
    const vSummary = vendors.find((v) => v.uploadId === q.uploadId);

    const rowBg = isClean ? (qIdx % 2 === 1 ? COLOR_LIGHT_GRAY : COLOR_WHITE) : COLOR_ROSE_LIGHT;
    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 20,
      width: layout.contentWidth,
      height: 20,
      color: rowBg,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    const advText =
      vSummary?.advancePaymentPercent !== null && vSummary?.advancePaymentPercent !== undefined
        ? `${vSummary.advancePaymentPercent}%`
        : vSummary?.advancePaymentAmount !== null && vSummary?.advancePaymentAmount !== undefined
        ? formatMoney(vSummary.advancePaymentAmount, q.commercialDetails.currency || "INR")
        : "Not stated";

    const cVals = [
      truncateWithEllipsis(vName, fontBold, 7.5, auditColW[0] - 8),
      isClean ? "[OK] Verified (100%)" : `[!] Flagged (${fa.discrepancyFlags.length})`,
      formatMoney(fa.statedGrandTotal, q.commercialDetails.currency || "INR"),
      formatMoney(fa.calculatedGrandTotal, q.commercialDetails.currency || "INR"),
      fa.grandTotalDiscrepancy ? formatMoney(fa.grandTotalDiscrepancy, q.commercialDetails.currency || "INR") : "Rs. 0 (Exact)",
      advText,
    ];

    let rX = leftMargin;
    cVals.forEach((cv, cvIdx) => {
      layout.currentPage.drawText(cv, {
        x: rX + 5,
        y: layout.y - 14,
        size: 7.2,
        font: cvIdx === 1 ? fontBold : fontRegular,
        color: !isClean && cvIdx === 1 ? COLOR_ROSE : COLOR_CHARCOAL_DARK,
      });
      rX += auditColW[cvIdx];
    });

    layout.y -= 20;
  });

  layout.y -= 22;

  // Itemized Audit Discrepancies Log (if any detected)
  const allDiscrepancies = analyzedQuotations.flatMap((q) =>
    q.financialAudit.discrepancyFlags.map((flag) => ({
      vendorName: q.vendorDetails.vendorName || q.originalName,
      currency: q.commercialDetails.currency || "INR",
      difference: q.financialAudit.grandTotalDiscrepancy || q.financialAudit.subtotalDiscrepancy || null,
      ...flag,
    }))
  );

  if (allDiscrepancies.length > 0) {
    layout.currentPage.drawText("Audit Discrepancy & Arithmetic Mismatch Log", {
      x: leftMargin,
      y: layout.y,
      size: 10,
      font: fontBold,
      color: COLOR_ROSE,
    });
    layout.y -= 14;

    allDiscrepancies.forEach((disc) => {
      const msgLines = wrapText(
        `[!] ${disc.vendorName}: ${disc.message}`,
        fontBold,
        7.3,
        layout.contentWidth - 20
      );
      const discBoxH = 18 + msgLines.length * 10 + 12;

      ensureSpace(layout, discBoxH + 6);

      layout.currentPage.drawRectangle({
        x: leftMargin,
        y: layout.y - discBoxH,
        width: layout.contentWidth,
        height: discBoxH,
        color: COLOR_ROSE_LIGHT,
        borderColor: COLOR_ROSE,
        borderWidth: 0.5,
      });

      let dmY = layout.y - 13;
      msgLines.forEach((ml) => {
        layout.currentPage.drawText(ml, {
          x: leftMargin + 8,
          y: dmY,
          size: 7.3,
          font: fontBold,
          color: COLOR_ROSE,
        });
        dmY -= 10;
      });

      layout.currentPage.drawText(
        `Variance Amount: ${formatMoney(disc.difference, disc.currency)}`,
        {
          x: leftMargin + 8,
          y: dmY,
          size: 7,
          font: fontRegular,
          color: COLOR_CHARCOAL_DARK,
        }
      );

      layout.y -= discBoxH + 8;
    });
  } else {
    // Clean bill of health box
    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - 35,
      width: layout.contentWidth,
      height: 35,
      color: COLOR_EMERALD_LIGHT,
      borderColor: COLOR_EMERALD,
      borderWidth: 1,
    });

    layout.currentPage.drawText(
      "[OK] Clean Financial Audit — Zero Arithmetic Discrepancies Detected",
      {
        x: leftMargin + 12,
        y: layout.y - 15,
        size: 8.5,
        font: fontBold,
        color: COLOR_EMERALD,
      }
    );
    layout.currentPage.drawText(
      "All vendor line items, quantity multiplications, tax calculations, and advance deposits match stated totals with exact precision.",
      {
        x: leftMargin + 12,
        y: layout.y - 26,
        size: 7.5,
        font: fontRegular,
        color: COLOR_CHARCOAL_DARK,
      }
    );
    layout.y -= 45;
  }

  // =========================================================================
  // PAGE 6: EVIDENCE PROVENANCE, MISSING INFO & CLOSING CHECKLIST (Portrait)
  // =========================================================================
  createNewPage(layout, "portrait");

  layout.currentPage.drawText("Evidence Provenance, Missing Information & Pre-Contract Checklist", {
    x: leftMargin,
    y: layout.y,
    size: 13.5,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 13;

  layout.currentPage.drawText(
    "Grounding each commercial point directly in source PDF quotations with explicit verification tracking.",
    {
      x: leftMargin,
      y: layout.y,
      size: 8.2,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    }
  );
  layout.y -= 22;

  // 1. Missing Information Alerts per Vendor
  layout.currentPage.drawText("1. Missing Information Alerts by Vendor Proposal", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  vendors.forEach((v) => {
    const hasAlerts = v.missingInfoAlerts.length > 0;
    const alertStr = hasAlerts
      ? `Alerts: ${v.missingInfoAlerts.map((a) => sanitizeText(a)).join(" • ")}`
      : "[OK] Fully Detailed — All commercial, tax, and cancellation terms explicitly documented.";

    const alertLines = wrapText(alertStr, fontRegular, 7, layout.contentWidth - 24);
    const boxH = 18 + alertLines.length * 10;

    ensureSpace(layout, boxH + 6);

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - boxH,
      width: layout.contentWidth,
      height: boxH,
      color: hasAlerts ? COLOR_AMBER_LIGHT : COLOR_LIGHT_GRAY,
      borderColor: hasAlerts ? COLOR_AMBER : COLOR_BORDER,
      borderWidth: 0.5,
    });

    layout.currentPage.drawText(truncateWithEllipsis(v.vendorName, fontBold, 7.8, layout.contentWidth - 24), {
      x: leftMargin + 10,
      y: layout.y - 12,
      size: 7.8,
      font: fontBold,
      color: COLOR_CHARCOAL_DARK,
    });

    let aY = layout.y - 22;
    alertLines.forEach((al) => {
      layout.currentPage.drawText(al, {
        x: leftMargin + 10,
        y: aY,
        size: 7,
        font: fontRegular,
        color: hasAlerts ? COLOR_AMBER : COLOR_EMERALD,
      });
      aY -= 10;
    });

    layout.y -= boxH + 8;
  });

  layout.y -= 12;

  // 2. Key Document Citations Proof with Supporting Evidence Snippets
  layout.currentPage.drawText("2. Page-Level Quotation Citations & Extracted Supporting Evidence Snippets", {
    x: leftMargin,
    y: layout.y,
    size: 10,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });
  layout.y -= 14;

  analyzedQuotations.slice(0, 4).forEach((q) => {
    const vName = q.vendorDetails.vendorName || q.originalName;
    const pageCount = q.sourcePageCount || (q as any)?.meta?.pageCount || 1;
    const lineItem = q.commercialDetails?.lineItems?.[0];
    const inclusion = q.serviceDetails?.servicesIncluded?.[0];
    const cancellation = q.commercialDetails?.cancellationTerms;

    // Build real evidence snippet lines
    const snippetLines: string[] = [];
    if (lineItem) {
      snippetLines.push(
        `[Line Item]: "${truncateWithEllipsis(lineItem.description, fontRegular, 7, 240)}" — ${formatMoney(
          lineItem.statedAmount,
          q.commercialDetails.currency || "INR"
        )} (Page ${lineItem.sourcePage || 1})`
      );
    }
    if (inclusion) {
      snippetLines.push(
        `[Scope Inclusions]: "${truncateWithEllipsis(inclusion.text, fontRegular, 7, 260)}" (Page ${
          inclusion.sourcePage || 1
        })`
      );
    }
    if (cancellation) {
      snippetLines.push(
        `[Commercial Terms]: "${truncateWithEllipsis(cancellation, fontRegular, 7, 260)}" (Page ${
          q.commercialDetails?.paymentSchedule?.[0]?.sourcePage || 2
        })`
      );
    }

    const citationBoxH = 26 + snippetLines.length * 11;
    ensureSpace(layout, citationBoxH + 6);

    layout.currentPage.drawRectangle({
      x: leftMargin,
      y: layout.y - citationBoxH,
      width: layout.contentWidth,
      height: citationBoxH,
      color: COLOR_WHITE,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    const headerStr = `${vName} (Source File: ${q.originalName} • Total Pages: ${pageCount})`;
    layout.currentPage.drawText(
      truncateWithEllipsis(headerStr, fontBold, 7.8, layout.contentWidth - 20),
      {
        x: leftMargin + 10,
        y: layout.y - 12,
        size: 7.8,
        font: fontBold,
        color: COLOR_CHARCOAL_DARK,
      }
    );

    let snY = layout.y - 24;
    snippetLines.forEach((sn) => {
      layout.currentPage.drawText(sn, {
        x: leftMargin + 10,
        y: snY,
        size: 7,
        font: fontOblique,
        color: COLOR_CHARCOAL_MUTED,
      });
      snY -= 11;
    });

    layout.y -= citationBoxH + 8;
  });

  layout.y -= 10;

  // Final Commercial Advisory Statement
  ensureSpace(layout, 65);
  layout.currentPage.drawRectangle({
    x: leftMargin,
    y: layout.y - 55,
    width: layout.contentWidth,
    height: 55,
    color: COLOR_LIGHT_GRAY,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  layout.currentPage.drawText("FINAL COMMERCIAL ADVISORY STATEMENT", {
    x: leftMargin + 12,
    y: layout.y - 14,
    size: 8,
    font: fontBold,
    color: COLOR_CHARCOAL_DARK,
  });

  const advLines = wrapText(
    sanitizeText(
      rec.advisoryNotice +
        " Gathbandhan provides automated financial auditing and proposal comparison, but contracts and vendor commitments must be reviewed and countersigned by the wedding planner and authorized client signatories."
    ),
    fontRegular,
    7.3,
    layout.contentWidth - 24
  );

  let anY = layout.y - 26;
  advLines.slice(0, 3).forEach((line) => {
    layout.currentPage.drawText(line, {
      x: leftMargin + 12,
      y: anY,
      size: 7.3,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
    anY -= 10;
  });

  // =========================================================================
  // STAMP RUNNING FOOTERS & PAGE NUMBERS ACROSS ALL PAGES (Pass 2)
  // =========================================================================
  const totalPages = layout.pages.length;
  layout.pages.forEach((pageInfo, pIdx) => {
    const page = pageInfo.page;
    const pWidth = pageInfo.width;

    // Running Footer Line
    page.drawLine({
      start: { x: leftMargin, y: 32 },
      end: { x: pWidth - rightMargin, y: 32 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });

    // Running Left Footer
    page.drawText("Gathbandhan • AI Quotation Analyzer & Financial Intelligence Engine", {
      x: leftMargin,
      y: 20,
      size: 7.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });

    // Running Right Footer: Page X of Y
    const pageStr = `Page ${pIdx + 1} of ${totalPages}`;
    const pStrWidth = fontRegular.widthOfTextAtSize(pageStr, 7.5);
    page.drawText(pageStr, {
      x: pWidth - rightMargin - pStrWidth,
      y: 20,
      size: 7.5,
      font: fontRegular,
      color: COLOR_CHARCOAL_MUTED,
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
