import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { formatINR } from "@/lib/money";

function formatPdfINR(amountPaise: bigint): string {
  return formatINR(amountPaise).replace(/[\u20B9]/g, "Rs. ");
}

export interface VirtualPaymentReceiptData {
  transactionId: string;
  virtualUtr: string;
  billNumber: string;
  billTitle: string;
  coupleName: string;
  weddingTitle?: string;
  payerVpa: string;
  payerName?: string;
  paymentType: string; // "INSTALLMENT" | "FULL_BALANCE"
  amountPaise: bigint;
  totalBillPaise: bigint;
  remainingBillPaise: bigint;
  paidAt: Date | string;
  allocations?: Array<{
    installmentTitle?: string;
    amountPaise: bigint;
  }>;
}

export const SIMULATION_DISCLAIMER_TEXT =
  "SIMULATED PAYMENT — NO REAL MONEY TRANSFERRED";

/**
 * Generates an official Gathbandhan Virtual UPI Payment Receipt in PDF format.
 * Includes security watermark and prominent simulation disclaimers.
 */
export async function generateVirtualReceiptPdf(
  data: VirtualPaymentReceiptData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 portrait: 595 x 842 points
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Colors
  const colorCharcoal = rgb(0.12, 0.16, 0.23); // #1F2937
  const colorGold = rgb(0.78, 0.65, 0.22); // Gathbandhan Gold
  const colorMuted = rgb(0.45, 0.5, 0.58);
  const colorBorder = rgb(0.88, 0.9, 0.93);
  const colorBoxBg = rgb(0.98, 0.97, 0.95);
  const colorEmerald = rgb(0.06, 0.58, 0.38);
  const colorWatermark = rgb(0.92, 0.92, 0.94);

  // 1. Diagonal Background Watermark: SIMULATED PAYMENT
  page.drawText("SIMULATED PAYMENT", {
    x: 70,
    y: 400,
    size: 46,
    font: fontBold,
    color: colorWatermark,
    rotate: degrees(35),
  });
  page.drawText("NO REAL MONEY TRANSFERRED", {
    x: 60,
    y: 350,
    size: 32,
    font: fontBold,
    color: colorWatermark,
    rotate: degrees(35),
  });

  // 2. Top Header Banner: GATHBANDHAN & Disclaimer
  // Banner background
  page.drawRectangle({
    x: 36,
    y: height - 60,
    width: width - 72,
    height: 32,
    color: rgb(0.95, 0.92, 0.82), // Soft ivory-gold tint
    borderColor: colorGold,
    borderWidth: 1,
  });

  page.drawText(`*** ${SIMULATION_DISCLAIMER_TEXT} ***`, {
    x: 95,
    y: height - 48,
    size: 11,
    font: fontBold,
    color: rgb(0.65, 0.45, 0.05),
  });

  // 3. Brand Header
  let y = height - 100;
  page.drawText("GATHBANDHAN", {
    x: 36,
    y,
    size: 24,
    font: fontBold,
    color: colorCharcoal,
  });
  page.drawText("LUXURY WEDDING CONCIERGE & FINANCIAL SERVICES", {
    x: 36,
    y: y - 14,
    size: 8,
    font: fontRegular,
    color: colorGold,
  });

  // Receipt Title Badge on Right
  page.drawText("VIRTUAL UPI RECEIPT", {
    x: width - 210,
    y,
    size: 14,
    font: fontBold,
    color: colorEmerald,
  });
  page.drawText("Status: SUCCESS (SIMULATED)", {
    x: width - 210,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: colorEmerald,
  });

  // Divider
  y -= 30;
  page.drawLine({
    start: { x: 36, y },
    end: { x: width - 36, y },
    thickness: 1,
    color: colorBorder,
  });

  // 4. Primary Transaction Summary Card
  y -= 25;
  const cardHeight = 85;
  page.drawRectangle({
    x: 36,
    y: y - cardHeight,
    width: width - 72,
    height: cardHeight,
    color: colorBoxBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  const paidAmountINR = formatPdfINR(data.amountPaise);
  page.drawText("AMOUNT PAID (SIMULATED)", {
    x: 52,
    y: y - 24,
    size: 9,
    font: fontBold,
    color: colorMuted,
  });
  page.drawText(paidAmountINR, {
    x: 52,
    y: y - 56,
    size: 26,
    font: fontBold,
    color: colorCharcoal,
  });

  page.drawText("VIRTUAL UTR / REFERENCE", {
    x: 310,
    y: y - 24,
    size: 9,
    font: fontBold,
    color: colorMuted,
  });
  page.drawText(data.virtualUtr, {
    x: 310,
    y: y - 44,
    size: 13,
    font: fontBold,
    color: colorGold,
  });

  const paidDateFormatted =
    data.paidAt instanceof Date
      ? data.paidAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : new Date(data.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  page.drawText(`Processed At: ${paidDateFormatted}`, {
    x: 310,
    y: y - 62,
    size: 9,
    font: fontRegular,
    color: colorCharcoal,
  });

  // 5. Parties & Payment Details
  y = y - cardHeight - 35;
  page.drawText("PAYMENT BREAKDOWN & ALLOCATION", {
    x: 36,
    y,
    size: 12,
    font: fontBold,
    color: colorCharcoal,
  });

  y -= 18;
  const drawRow = (label: string, value: string, currentY: number) => {
    page.drawText(label, {
      x: 36,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: colorMuted,
    });
    page.drawText(value, {
      x: 230,
      y: currentY,
      size: 10,
      font: fontBold,
      color: colorCharcoal,
    });
    page.drawLine({
      start: { x: 36, y: currentY - 6 },
      end: { x: width - 36, y: currentY - 6 },
      thickness: 0.5,
      color: rgb(0.92, 0.93, 0.95),
    });
    return currentY - 24;
  };

  y = drawRow("Client / Couple", data.coupleName, y);
  y = drawRow("Bill Number", data.billNumber, y);
  y = drawRow("Bill Title", data.billTitle, y);
  if (data.weddingTitle) {
    y = drawRow("Event / Wedding", data.weddingTitle, y);
  }
  y = drawRow("Payer Virtual UPI ID", data.payerVpa, y);
  y = drawRow("Payer Name", data.payerName || "Simulated Payer", y);
  y = drawRow(
    "Payment Mode",
    data.paymentType === "FULL_BALANCE"
      ? "Full Balance Settlement (Simulated UPI)"
      : "Advance / Installment Payment (Simulated UPI)",
    y
  );
  y = drawRow("Total Bill Value", formatPdfINR(data.totalBillPaise), y);
  y = drawRow("Remaining Bill Balance", formatPdfINR(data.remainingBillPaise), y);

  // 6. Allocations Table
  if (data.allocations && data.allocations.length > 0) {
    y -= 15;
    page.drawText("Allocated Installments", {
      x: 36,
      y,
      size: 11,
      font: fontBold,
      color: colorCharcoal,
    });

    y -= 18;
    // Table Header
    page.drawRectangle({
      x: 36,
      y: y - 4,
      width: width - 72,
      height: 18,
      color: rgb(0.94, 0.95, 0.96),
    });
    page.drawText("Installment Milestone", {
      x: 44,
      y,
      size: 9,
      font: fontBold,
      color: colorCharcoal,
    });
    page.drawText("Settled Amount", {
      x: width - 150,
      y,
      size: 9,
      font: fontBold,
      color: colorCharcoal,
    });

    y -= 20;
    for (const alloc of data.allocations) {
      page.drawText(alloc.installmentTitle || "Installment Milestone", {
        x: 44,
        y,
        size: 9,
        font: fontRegular,
        color: colorCharcoal,
      });
      page.drawText(formatPdfINR(alloc.amountPaise), {
        x: width - 150,
        y,
        size: 9,
        font: fontBold,
        color: colorCharcoal,
      });
      page.drawLine({
        start: { x: 36, y: y - 4 },
        end: { x: width - 36, y: y - 4 },
        thickness: 0.5,
        color: colorBorder,
      });
      y -= 18;
    }
  }

  // 7. Security Disclaimer Notice Box at bottom
  y = Math.min(y - 20, 160);
  page.drawRectangle({
    x: 36,
    y: y - 75,
    width: width - 72,
    height: 75,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText("IMPORTANT VIRTUAL SIMULATION NOTICE", {
    x: 48,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: colorCharcoal,
  });

  const disclaimers = [
    "1. This document confirms a simulated UPI transaction generated by the Gathbandhan sandbox environment.",
    "2. No real funds, bank accounts, UPI rails, or NPCI settlement networks were accessed or debited.",
    "3. The Virtual UTR above is an internal demonstration reference and has no real-world banking validity.",
    "4. Issued automatically for milestone tracking, client acceptance verification, and demo testing.",
  ];

  let disclaimerY = y - 32;
  for (const line of disclaimers) {
    page.drawText(line, {
      x: 48,
      y: disclaimerY,
      size: 7.5,
      font: fontRegular,
      color: colorMuted,
    });
    disclaimerY -= 10;
  }

  // Bottom footer
  page.drawText(
    "Gathbandhan — Where Every Celebration Comes Together (Confidential & Simulated Receipt)",
    {
      x: 36,
      y: 28,
      size: 8,
      font: fontOblique,
      color: colorMuted,
    }
  );

  return await doc.save();
}
