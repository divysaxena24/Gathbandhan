import { formatRupees } from "@/lib/money";
import { getSeasonFinancialMetrics, getCashFlowForecast } from "./season-analytics-service";
import { getVendorReliabilityMetrics } from "./vendor-reliability-service";
import { getTeamWorkloadMetrics } from "./team-workload-service";

/**
 * Escapes values for standard RFC 4180 CSV compliance.
 */
function escapeCsv(val: string | number | bigint | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function toCsvRow(row: (string | number | bigint | boolean | null | undefined)[]): string {
  return row.map(escapeCsv).join(",") + "\r\n";
}

export async function generateWeddingPnlReportCsv(): Promise<string> {
  const { weddingPnls } = await getSeasonFinancialMetrics();
  let csv = toCsvRow([
    "Wedding Title",
    "Client",
    "Destination",
    "Wedding Date",
    "Lifecycle",
    "Package",
    "Contracted Revenue (INR)",
    "Collected Revenue (INR)",
    "Committed Costs (INR)",
    "Actual Costs (INR)",
    "Projected Profit (INR)",
    "Realized Profit (INR)",
    "Projected Margin %",
    "Realized Margin %",
    "Profitable",
  ]);

  for (const w of weddingPnls) {
    csv += toCsvRow([
      w.title,
      w.clientName,
      w.destination,
      w.weddingDate,
      w.lifecycle,
      w.packageType,
      formatRupees(w.contractedRevenuePaise),
      formatRupees(w.collectedRevenuePaise),
      formatRupees(w.committedCostsPaise),
      formatRupees(w.actualCostsPaise),
      formatRupees(w.projectedProfitPaise),
      formatRupees(w.realizedProfitPaise),
      `${w.projectedMarginPct.toFixed(1)}%`,
      `${w.realizedMarginPct.toFixed(1)}%`,
      w.isProfitable ? "YES" : "NO",
    ]);
  }

  return csv;
}

export async function generateSeasonPnlReportCsv(): Promise<string> {
  const { season, packages } = await getSeasonFinancialMetrics();
  let csv = toCsvRow(["Season Executive Metric", "Value"]);
  csv += toCsvRow(["Report Generated At", season.asOf]);
  csv += toCsvRow(["Total Season Weddings", season.totalWeddings]);
  csv += toCsvRow(["Weddings in Planning", season.weddingsByStatus.PLANNING]);
  csv += toCsvRow(["Active Weddings", season.weddingsByStatus.ACTIVE]);
  csv += toCsvRow(["Completed Weddings", season.weddingsByStatus.COMPLETED]);
  csv += toCsvRow(["Cancelled Weddings", season.weddingsByStatus.CANCELLED]);
  csv += toCsvRow(["Contracted Revenue (INR)", formatRupees(season.contractedRevenuePaise)]);
  csv += toCsvRow(["Collected Revenue (INR)", formatRupees(season.collectedRevenuePaise)]);
  csv += toCsvRow(["Pending Receivables (INR)", formatRupees(season.pendingReceivablesPaise)]);
  csv += toCsvRow(["Committed Costs (INR)", formatRupees(season.committedCostsPaise)]);
  csv += toCsvRow(["Actual Invoiced Costs (INR)", formatRupees(season.actualInvoicedCostsPaise)]);
  csv += toCsvRow(["Disbursed Payables (INR)", formatRupees(season.disbursedPayablesPaise)]);
  csv += toCsvRow(["Pending Payables (INR)", formatRupees(season.pendingPayablesPaise)]);
  csv += toCsvRow(["Projected Season Profit (INR)", formatRupees(season.projectedProfitPaise)]);
  csv += toCsvRow(["Realized Season Profit (INR)", formatRupees(season.realizedProfitPaise)]);
  csv += toCsvRow(["Projected Margin %", `${season.projectedMarginPct.toFixed(1)}%`]);
  csv += toCsvRow(["Realized Margin %", `${season.realizedMarginPct.toFixed(1)}%`]);

  csv += toCsvRow(["", ""]);
  csv += toCsvRow(["Package Type", "Weddings", "Revenue (INR)", "Committed Cost (INR)", "Profit (INR)", "Average Margin %"]);
  for (const pkg of packages) {
    csv += toCsvRow([
      pkg.label,
      pkg.weddingCount,
      formatRupees(pkg.totalRevenuePaise),
      formatRupees(pkg.totalCostPaise),
      formatRupees(pkg.totalProfitPaise),
      `${pkg.averageMarginPct.toFixed(1)}%`,
    ]);
  }

  return csv;
}

export async function generateVendorReliabilityReportCsv(): Promise<string> {
  const vendors = await getVendorReliabilityMetrics();
  let csv = toCsvRow([
    "Vendor Name",
    "Category",
    "Tier",
    "City",
    "Total Engagements",
    "Check-Ins",
    "On-Time Check-Ins",
    "Punctuality %",
    "Incidents",
    "Contracted Amount (INR)",
    "Invoiced Amount (INR)",
    "Cost Overrun (INR)",
    "Overall Score",
    "Grade",
    "Sparse Data Warning",
    "Repeatedly Late",
    "Repeatedly Over Budget",
  ]);

  for (const v of vendors) {
    csv += toCsvRow([
      v.vendorName,
      v.category,
      v.tier,
      v.city,
      v.totalEngagements,
      v.checkInTotal,
      v.onTimeCheckIns,
      `${v.punctualityScore}%`,
      v.incidentCount,
      formatRupees(v.contractedAmountPaise),
      formatRupees(v.invoicedAmountPaise),
      formatRupees(v.costVariancePaise),
      v.overallScore,
      v.reliabilityGrade,
      v.isSparseData ? "YES (<3 samples)" : "NO",
      v.isRepeatedlyLate ? "YES" : "NO",
      v.isRepeatedlyOverBudget ? "YES" : "NO",
    ]);
  }

  return csv;
}

export async function generateCashFlowReportCsv(): Promise<string> {
  const { buckets, weekly } = await getCashFlowForecast();
  let csv = toCsvRow([
    "Horizon Window",
    "Projected Inflows (INR)",
    "Inflow Tranches",
    "Projected Outflows (INR)",
    "Outflow Invoices",
    "Net Cash Flow (INR)",
  ]);

  for (const b of buckets) {
    csv += toCsvRow([
      b.label,
      formatRupees(b.inflowPaise),
      b.inflowCount,
      formatRupees(b.outflowPaise),
      b.outflowCount,
      formatRupees(b.netCashFlowPaise),
    ]);
  }

  csv += toCsvRow(["", "", "", "", "", ""]);
  csv += toCsvRow(["Week Label", "Start Date", "End Date", "Inflow (INR)", "Outflow (INR)", "Net Flow (INR)"]);
  for (const w of weekly) {
    csv += toCsvRow([
      w.weekLabel,
      w.startDate,
      w.endDate,
      formatRupees(w.inflowPaise),
      formatRupees(w.outflowPaise),
      formatRupees(w.netPaise),
    ]);
  }

  return csv;
}

export async function generateTeamWorkloadReportCsv(): Promise<string> {
  const team = await getTeamWorkloadMetrics();
  let csv = toCsvRow([
    "Team Member",
    "Email",
    "Role",
    "Active Weddings",
    "Total Assigned Tasks",
    "In Progress",
    "Overdue",
    "Completed",
    "Workload Status",
  ]);

  for (const t of team) {
    csv += toCsvRow([
      t.name,
      t.email,
      t.role,
      t.activeWeddingsCount,
      t.totalAssignedTasks,
      t.inProgressTasks,
      t.overdueTasks,
      t.completedTasks,
      t.workloadStatus,
    ]);
  }

  return csv;
}
