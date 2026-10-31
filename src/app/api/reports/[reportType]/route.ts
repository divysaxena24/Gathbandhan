import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  generateWeddingPnlReportCsv,
  generateSeasonPnlReportCsv,
  generateVendorReliabilityReportCsv,
  generateCashFlowReportCsv,
  generateTeamWorkloadReportCsv,
} from "@/modules/analytics/services/report-export-service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { errorResponse } from "@/lib/errors/api-response";

interface Params {
  params: Promise<{ reportType: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const user = await requireAuth();
    if (user.role === "CLIENT" || user.role === "VENDOR") {
      throw new ForbiddenError("Only agency staff can export reports");
    }

    const { reportType } = await params;
    let csvContent: string;
    let filename: string;
    const dateStr = new Date().toISOString().slice(0, 10);

    switch (reportType) {
      case "wedding-pl":
        csvContent = await generateWeddingPnlReportCsv();
        filename = `gathbandhan-weddings-pnl-${dateStr}.csv`;
        break;

      case "season-pl":
        csvContent = await generateSeasonPnlReportCsv();
        filename = `gathbandhan-season-pnl-${dateStr}.csv`;
        break;

      case "vendor-reliability":
        csvContent = await generateVendorReliabilityReportCsv();
        filename = `gathbandhan-vendor-reliability-${dateStr}.csv`;
        break;

      case "cash-flow":
        csvContent = await generateCashFlowReportCsv();
        filename = `gathbandhan-cash-flow-${dateStr}.csv`;
        break;

      case "team-workload":
        csvContent = await generateTeamWorkloadReportCsv();
        filename = `gathbandhan-team-workload-${dateStr}.csv`;
        break;

      default:
        throw new NotFoundError(
          `Unknown report type '${reportType}'. Valid types: wedding-pl, season-pl, vendor-reliability, cash-flow, team-workload`
        );
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
