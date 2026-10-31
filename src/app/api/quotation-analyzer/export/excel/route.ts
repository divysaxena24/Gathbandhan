/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { resolveReportData } from "@/lib/reports/report-data-service";
import { generateExcelReport } from "@/lib/reports/excel-report-service";
import { generateSafeReportFilename, saveTemporaryReport, cleanupExpiredReports } from "@/lib/reports/temp-report-storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/quotation-analyzer/export/excel
 * Generates an 8-sheet, structured, editable Excel workbook.
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
    const excelBuffer = await generateExcelReport(reportData);

    const { filename } = generateSafeReportFilename(
      "xlsx",
      reportData.metadata?.eventName || reportData.comparisonResult.categoryCompatibility.primaryCategory
    );

    // Save temporary report file and trigger asynchronous cleanup of expired files
    await saveTemporaryReport(excelBuffer, filename);
    cleanupExpiredReports().catch(() => {});

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    const errorMsg = error.message || "Failed to generate Excel report.";
    const isBadRequest = errorMsg.includes("Invalid report request") || errorMsg.includes("at least two");

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: isBadRequest ? 400 : 500 }
    );
  }
}
