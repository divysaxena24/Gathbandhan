import { NextRequest, NextResponse } from "next/server";
import { resolveReportData } from "@/lib/reports/report-data-service";
import { generatePdfReport } from "@/lib/reports/pdf-report-service";
import { generateSafeReportFilename, saveTemporaryReport, cleanupExpiredReports } from "@/lib/reports/temp-report-storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/quotation-analyzer/export/pdf
 * Generates a luxury, client-ready PDF comparison report.
 */
export async function POST(request: NextRequest | Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const reportData = await resolveReportData(body);
    const pdfBuffer = await generatePdfReport(reportData);

    const { filename } = generateSafeReportFilename(
      "pdf",
      reportData.metadata?.eventName || reportData.comparisonResult.categoryCompatibility.primaryCategory
    );

    // Save temporary report file and trigger asynchronous cleanup of expired files
    await saveTemporaryReport(pdfBuffer, filename);
    cleanupExpiredReports().catch(() => {});

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    const errorMsg = error.message || "Failed to generate PDF report.";
    const isBadRequest = errorMsg.includes("Invalid report request") || errorMsg.includes("at least two");

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: isBadRequest ? 400 : 500 }
    );
  }
}
