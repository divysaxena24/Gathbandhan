import { eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  weddings,
  clients,
  clientPaymentMilestones,
  clientPaymentTransactions,
  weddingVendors,
  vendorInvoices,
  vendorPaymentTransactions,
  tasks,
  vendorCheckIns,
  incidents,
} from "@/lib/db/schema";
import { WeddingLifecycle, PackageType } from "@/lib/db/schema/enums";
import {
  SeasonFinancialMetrics,
  PackageProfitability,
  WeddingPnlSummary,
  CashFlowBucket,
  WeeklyCashFlow,
  OperationalRiskWedding,
} from "../types";

/**
 * Computes Season Financial Metrics and individual Wedding P&Ls.
 * Uses exact BigInt integer paise arithmetic throughout.
 */
export async function getSeasonFinancialMetrics(): Promise<{
  season: SeasonFinancialMetrics;
  weddingPnls: WeddingPnlSummary[];
  packages: PackageProfitability[];
}> {
  const allWeddings = await db
    .select({
      id: weddings.id,
      title: weddings.title,
      destination: weddings.city,
      weddingDate: weddings.startDate,
      lifecycle: weddings.lifecycleStatus,
      packageType: weddings.packageType,
      budgetPaise: weddings.budgetPaise,
      clientName: clients.coupleName,
    })
    .from(weddings)
    .leftJoin(clients, eq(weddings.clientId, clients.id))
    .where(isNull(weddings.deletedAt));

  const allMilestones = await db
    .select({
      weddingId: clientPaymentMilestones.weddingId,
      amountPaise: clientPaymentMilestones.amountPaise,
      dueDate: clientPaymentMilestones.dueAt,
      status: clientPaymentMilestones.status,
    })
    .from(clientPaymentMilestones);

  const allClientTransactions = await db
    .select({
      weddingId: clientPaymentTransactions.weddingId,
      amountPaise: clientPaymentTransactions.amountPaise,
    })
    .from(clientPaymentTransactions);

  const allWeddingVendors = await db
    .select({
      weddingId: weddingVendors.weddingId,
      contractAmountPaise: weddingVendors.contractAmountPaise,
    })
    .from(weddingVendors);

  const allInvoices = await db
    .select({
      weddingId: vendorInvoices.weddingId,
      totalPaise: vendorInvoices.totalPaise,
      status: vendorInvoices.status,
      dueDate: vendorInvoices.dueDate,
    })
    .from(vendorInvoices);

  const allVendorTransactions = await db
    .select({
      weddingId: vendorPaymentTransactions.weddingId,
      amountPaise: vendorPaymentTransactions.amountPaise,
    })
    .from(vendorPaymentTransactions);

  // Group by weddingId
  const milestonesByWedding = new Map<string, typeof allMilestones>();
  for (const m of allMilestones) {
    const list = milestonesByWedding.get(m.weddingId) || [];
    list.push(m);
    milestonesByWedding.set(m.weddingId, list);
  }

  const clientTxByWedding = new Map<string, typeof allClientTransactions>();
  for (const tx of allClientTransactions) {
    const list = clientTxByWedding.get(tx.weddingId) || [];
    list.push(tx);
    clientTxByWedding.set(tx.weddingId, list);
  }

  const vendorsByWedding = new Map<string, typeof allWeddingVendors>();
  for (const v of allWeddingVendors) {
    const list = vendorsByWedding.get(v.weddingId) || [];
    list.push(v);
    vendorsByWedding.set(v.weddingId, list);
  }

  const invoicesByWedding = new Map<string, typeof allInvoices>();
  for (const inv of allInvoices) {
    const list = invoicesByWedding.get(inv.weddingId) || [];
    list.push(inv);
    invoicesByWedding.set(inv.weddingId, list);
  }

  const vendorTxByWedding = new Map<string, typeof allVendorTransactions>();
  for (const tx of allVendorTransactions) {
    const list = vendorTxByWedding.get(tx.weddingId) || [];
    list.push(tx);
    vendorTxByWedding.set(tx.weddingId, list);
  }

  const weddingPnls: WeddingPnlSummary[] = [];
  const statusCounts: Record<WeddingLifecycle, number> = {
    PLANNING: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  let totalContractedRevenuePaise = 0n;
  let totalCollectedRevenuePaise = 0n;
  let totalPendingReceivablesPaise = 0n;
  let totalCommittedCostsPaise = 0n;
  let totalActualInvoicedCostsPaise = 0n;
  let totalDisbursedPayablesPaise = 0n;
  let totalPendingPayablesPaise = 0n;
  let totalProjectedProfitPaise = 0n;
  let totalRealizedProfitPaise = 0n;

  for (const w of allWeddings) {
    statusCounts[w.lifecycle] = (statusCounts[w.lifecycle] || 0) + 1;

    const wMilestones = milestonesByWedding.get(w.id) || [];
    const wClientTx = clientTxByWedding.get(w.id) || [];
    const wVendors = vendorsByWedding.get(w.id) || [];
    const wInvoices = invoicesByWedding.get(w.id) || [];
    const wVendorTx = vendorTxByWedding.get(w.id) || [];

    const milestonesSum = wMilestones.reduce((s, m) => s + m.amountPaise, 0n);
    const contractedRev = milestonesSum > 0n ? milestonesSum : (w.budgetPaise || 0n);
    const collectedRev = wClientTx.reduce((s, t) => s + t.amountPaise, 0n);
    const committedCosts = wVendors.reduce((s, v) => s + (v.contractAmountPaise || 0n), 0n);
    const actualCosts = wInvoices.reduce((s, i) => s + i.totalPaise, 0n);
    const disbursedPayables = wVendorTx.reduce((s, t) => s + t.amountPaise, 0n);

    const projectedProfit = contractedRev - committedCosts;
    const realizedProfit = collectedRev - actualCosts;

    const projectedMarginPct =
      contractedRev > 0n
        ? Number((projectedProfit * 10000n) / contractedRev) / 100
        : 0;

    const realizedMarginPct =
      collectedRev > 0n
        ? Number((realizedProfit * 10000n) / collectedRev) / 100
        : 0;

    const pendingReceivables = contractedRev > collectedRev ? contractedRev - collectedRev : 0n;
    const pendingPayables = committedCosts > disbursedPayables ? committedCosts - disbursedPayables : 0n;

    weddingPnls.push({
      id: w.id,
      title: w.title,
      clientName: w.clientName || "Direct Wedding",
      destination: w.destination || "Rajasthan",
      weddingDate: w.weddingDate || "2027-02-12",
      lifecycle: w.lifecycle,
      packageType: (w.packageType || "FULL_SERVICE") as PackageType,
      contractedRevenuePaise: contractedRev,
      collectedRevenuePaise: collectedRev,
      committedCostsPaise: committedCosts,
      actualCostsPaise: actualCosts,
      projectedProfitPaise: projectedProfit,
      realizedProfitPaise: realizedProfit,
      projectedMarginPct,
      realizedMarginPct,
      isProfitable: projectedProfit > 0n,
    });

    totalContractedRevenuePaise += contractedRev;
    totalCollectedRevenuePaise += collectedRev;
    totalPendingReceivablesPaise += pendingReceivables;
    totalCommittedCostsPaise += committedCosts;
    totalActualInvoicedCostsPaise += actualCosts;
    totalDisbursedPayablesPaise += disbursedPayables;
    totalPendingPayablesPaise += pendingPayables;
    totalProjectedProfitPaise += projectedProfit;
    totalRealizedProfitPaise += realizedProfit;
  }

  const seasonProjectedMarginPct =
    totalContractedRevenuePaise > 0n
      ? Number((totalProjectedProfitPaise * 10000n) / totalContractedRevenuePaise) / 100
      : 0;

  const seasonRealizedMarginPct =
    totalCollectedRevenuePaise > 0n
      ? Number((totalRealizedProfitPaise * 10000n) / totalCollectedRevenuePaise) / 100
      : 0;

  const season: SeasonFinancialMetrics = {
    asOf: new Date().toISOString(),
    totalWeddings: allWeddings.length,
    weddingsByStatus: statusCounts,
    contractedRevenuePaise: totalContractedRevenuePaise,
    collectedRevenuePaise: totalCollectedRevenuePaise,
    pendingReceivablesPaise: totalPendingReceivablesPaise,
    committedCostsPaise: totalCommittedCostsPaise,
    actualInvoicedCostsPaise: totalActualInvoicedCostsPaise,
    disbursedPayablesPaise: totalDisbursedPayablesPaise,
    pendingPayablesPaise: totalPendingPayablesPaise,
    projectedProfitPaise: totalProjectedProfitPaise,
    realizedProfitPaise: totalRealizedProfitPaise,
    projectedMarginPct: seasonProjectedMarginPct,
    realizedMarginPct: seasonRealizedMarginPct,
  };

  // Group by Package Type to answer: Which wedding package has best margin?
  const packageGroups: Record<
    PackageType,
    { label: string; count: number; rev: bigint; cost: bigint; profit: bigint }
  > = {
    FULL_SERVICE: {
      label: "Luxury Full-Service",
      count: 0,
      rev: 0n,
      cost: 0n,
      profit: 0n,
    },
    PARTIAL: {
      label: "Partial Planning & Production",
      count: 0,
      rev: 0n,
      cost: 0n,
      profit: 0n,
    },
    DAY_OF: {
      label: "Day-of Palace Coordination",
      count: 0,
      rev: 0n,
      cost: 0n,
      profit: 0n,
    },
  };

  for (const p of weddingPnls) {
    const pkg = packageGroups[p.packageType] || packageGroups.FULL_SERVICE;
    pkg.count += 1;
    pkg.rev += p.contractedRevenuePaise;
    pkg.cost += p.committedCostsPaise;
    pkg.profit += p.projectedProfitPaise;
  }

  const packages: PackageProfitability[] = (
    Object.keys(packageGroups) as PackageType[]
  ).map((type) => {
    const g = packageGroups[type];
    const margin =
      g.rev > 0n ? Number((g.profit * 10000n) / g.rev) / 100 : 0;
    return {
      packageType: type,
      label: g.label,
      weddingCount: g.count,
      totalRevenuePaise: g.rev,
      totalCostPaise: g.cost,
      totalProfitPaise: g.profit,
      averageMarginPct: margin,
    };
  });

  return { season, weddingPnls, packages };
}

/**
 * Computes Cash Flow forecast into 7, 30, 60, and 90-day horizon buckets
 * as well as weekly net cashflow intervals for the season.
 */
export async function getCashFlowForecast(
  referenceDate = new Date()
): Promise<{
  buckets: CashFlowBucket[];
  weekly: WeeklyCashFlow[];
}> {
  const refTime = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const milestones = await db
    .select({
      dueDate: clientPaymentMilestones.dueAt,
      amountPaise: clientPaymentMilestones.amountPaise,
      status: clientPaymentMilestones.status,
    })
    .from(clientPaymentMilestones);

  const invoices = await db
    .select({
      dueDate: vendorInvoices.dueDate,
      totalPaise: vendorInvoices.totalPaise,
      status: vendorInvoices.status,
    })
    .from(vendorInvoices);

  // Buckets definitions: 7, 30, 60, 90 days
  const bucketDefs: Array<{
    key: "7_DAYS" | "30_DAYS" | "60_DAYS" | "90_DAYS";
    label: string;
    maxDays: number;
  }> = [
    { key: "7_DAYS", label: "Next 7 Days", maxDays: 7 },
    { key: "30_DAYS", label: "Next 30 Days", maxDays: 30 },
    { key: "60_DAYS", label: "Next 60 Days", maxDays: 60 },
    { key: "90_DAYS", label: "Next 90 Days", maxDays: 90 },
  ];

  const buckets: CashFlowBucket[] = bucketDefs.map((b) => {
    let inflowPaise = 0n;
    let outflowPaise = 0n;
    let inflowCount = 0;
    let outflowCount = 0;

    const thresholdTime = refTime + b.maxDays * dayMs;

    for (const m of milestones) {
      if (m.status !== "PAID") {
        const dueTime = new Date(m.dueDate).getTime();
        // Fall into this horizon bucket if due between reference and threshold
        if (dueTime <= thresholdTime) {
          inflowPaise += m.amountPaise;
          inflowCount += 1;
        }
      }
    }

    for (const inv of invoices) {
      if (inv.status !== "PAID") {
        const dueTime = new Date(inv.dueDate).getTime();
        if (dueTime <= thresholdTime) {
          outflowPaise += inv.totalPaise;
          outflowCount += 1;
        }
      }
    }

    return {
      bucketKey: b.key,
      label: b.label,
      inflowPaise,
      outflowPaise,
      netCashFlowPaise: inflowPaise - outflowPaise,
      inflowCount,
      outflowCount,
    };
  });

  // Next 8 Weeks cashflow breakdown
  const weekly: WeeklyCashFlow[] = [];
  for (let i = 0; i < 8; i++) {
    const startWeek = new Date(refTime + i * 7 * dayMs);
    const endWeek = new Date(refTime + (i + 1) * 7 * dayMs);

    let inflowPaise = 0n;
    let outflowPaise = 0n;

    for (const m of milestones) {
      if (m.status !== "PAID") {
        const due = new Date(m.dueDate).getTime();
        if (due >= startWeek.getTime() && due < endWeek.getTime()) {
          inflowPaise += m.amountPaise;
        }
      }
    }

    for (const inv of invoices) {
      if (inv.status !== "PAID") {
        const due = new Date(inv.dueDate).getTime();
        if (due >= startWeek.getTime() && due < endWeek.getTime()) {
          outflowPaise += inv.totalPaise;
        }
      }
    }

    weekly.push({
      weekLabel: `Week ${i + 1}`,
      startDate: startWeek.toISOString().slice(0, 10),
      endDate: endWeek.toISOString().slice(0, 10),
      inflowPaise,
      outflowPaise,
      netPaise: inflowPaise - outflowPaise,
    });
  }

  return { buckets, weekly };
}

/**
 * Computes Operational Risk ranking across all weddings.
 * Answers: Which wedding has the highest unresolved operational risk?
 */
export async function getOperationalRisks(): Promise<OperationalRiskWedding[]> {
  const allWeddings = await db
    .select({
      id: weddings.id,
      title: weddings.title,
      destination: weddings.city,
      lifecycle: weddings.lifecycleStatus,
    })
    .from(weddings)
    .where(isNull(weddings.deletedAt));

  const allTasks = await db
    .select({
      weddingId: tasks.weddingId,
      status: tasks.status,
      dueAt: tasks.dueAt,
    })
    .from(tasks);

  const allCheckIns = await db
    .select({
      weddingId: vendorCheckIns.weddingId,
      status: vendorCheckIns.status,
    })
    .from(vendorCheckIns);

  const allIncidents = await db
    .select({
      weddingId: incidents.weddingId,
      severity: incidents.severity,
      resolvedAt: incidents.resolvedAt,
    })
    .from(incidents);

  const now = new Date();

  const results: OperationalRiskWedding[] = [];

  for (const w of allWeddings) {
    const wTasks = allTasks.filter((t) => t.weddingId === w.id);
    const wCheckIns = allCheckIns.filter((c) => c.weddingId === w.id);
    const wIncidents = allIncidents.filter((i) => i.weddingId === w.id);

    const overdueTasks = wTasks.filter(
      (t) => t.status !== "DONE" && new Date(t.dueAt) < now
    );
    const atRiskTasks = wTasks.filter(
      (t) =>
        t.status !== "DONE" &&
        new Date(t.dueAt) >= now &&
        new Date(t.dueAt).getTime() - now.getTime() < 48 * 60 * 60 * 1000
    );

    const lateCheckIns = wCheckIns.filter((c) => c.status === "LATE");
    const unresolvedIncidents = wIncidents.filter((i) => !i.resolvedAt);
    const criticalIncidents = unresolvedIncidents.filter(
      (i) => i.severity === "CRITICAL"
    );

    // Calculate composite risk score:
    // Overdue tasks: 10 pts each
    // At-risk tasks: 4 pts each
    // Late check-ins: 15 pts each
    // Unresolved incidents: 15 pts each
    // Critical incidents: 30 pts each
    const rawScore =
      overdueTasks.length * 10 +
      atRiskTasks.length * 4 +
      lateCheckIns.length * 15 +
      unresolvedIncidents.length * 15 +
      criticalIncidents.length * 30;

    const riskScore = Math.min(100, rawScore);

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (riskScore >= 75) riskLevel = "CRITICAL";
    else if (riskScore >= 50) riskLevel = "HIGH";
    else if (riskScore >= 20) riskLevel = "MEDIUM";

    results.push({
      weddingId: w.id,
      weddingTitle: w.title,
      destination: w.destination || "Rajasthan",
      lifecycle: w.lifecycle,
      overdueTasksCount: overdueTasks.length,
      atRiskTasksCount: atRiskTasks.length,
      lateVendorCheckInsCount: lateCheckIns.length,
      unresolvedIncidentsCount: unresolvedIncidents.length,
      criticalIncidentsCount: criticalIncidents.length,
      budgetVariancePaise: 0n,
      riskScore,
      riskLevel,
    });
  }

  // Sort descending by riskScore
  return results.sort((a, b) => b.riskScore - a.riskScore);
}
