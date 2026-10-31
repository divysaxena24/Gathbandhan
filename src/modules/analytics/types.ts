import { WeddingLifecycle, PackageType } from "@/lib/db/schema/enums";

export interface SeasonFinancialMetrics {
  asOf: string;
  totalWeddings: number;
  weddingsByStatus: Record<WeddingLifecycle, number>;
  contractedRevenuePaise: bigint;
  collectedRevenuePaise: bigint;
  pendingReceivablesPaise: bigint;
  committedCostsPaise: bigint;
  actualInvoicedCostsPaise: bigint;
  disbursedPayablesPaise: bigint;
  pendingPayablesPaise: bigint;
  projectedProfitPaise: bigint;
  realizedProfitPaise: bigint;
  projectedMarginPct: number;
  realizedMarginPct: number;
}

export interface PackageProfitability {
  packageType: PackageType;
  label: string;
  weddingCount: number;
  totalRevenuePaise: bigint;
  totalCostPaise: bigint;
  totalProfitPaise: bigint;
  averageMarginPct: number;
}

export interface WeddingPnlSummary {
  id: string;
  title: string;
  clientName: string;
  destination: string;
  weddingDate: string;
  lifecycle: WeddingLifecycle;
  packageType: PackageType;
  contractedRevenuePaise: bigint;
  collectedRevenuePaise: bigint;
  committedCostsPaise: bigint;
  actualCostsPaise: bigint;
  projectedProfitPaise: bigint;
  realizedProfitPaise: bigint;
  projectedMarginPct: number;
  realizedMarginPct: number;
  isProfitable: boolean;
}

export interface CashFlowBucket {
  bucketKey: "7_DAYS" | "30_DAYS" | "60_DAYS" | "90_DAYS";
  label: string;
  inflowPaise: bigint;
  outflowPaise: bigint;
  netCashFlowPaise: bigint;
  inflowCount: number;
  outflowCount: number;
}

export interface WeeklyCashFlow {
  weekLabel: string;
  startDate: string;
  endDate: string;
  inflowPaise: bigint;
  outflowPaise: bigint;
  netPaise: bigint;
}

export interface OperationalRiskWedding {
  weddingId: string;
  weddingTitle: string;
  destination: string;
  lifecycle: WeddingLifecycle;
  overdueTasksCount: number;
  atRiskTasksCount: number;
  lateVendorCheckInsCount: number;
  unresolvedIncidentsCount: number;
  criticalIncidentsCount: number;
  budgetVariancePaise: bigint;
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface VendorReliabilityMetrics {
  vendorId: string;
  vendorName: string;
  category: string;
  tier: string;
  city: string;
  totalEngagements: number;
  checkInTotal: number;
  onTimeCheckIns: number;
  punctualityScore: number; // 0-100
  incidentCount: number;
  incidentFreedomScore: number; // 0-100
  contractedAmountPaise: bigint;
  invoicedAmountPaise: bigint;
  costVariancePaise: bigint;
  budgetAdherenceScore: number; // 0-100
  overallScore: number; // 0-100
  reliabilityGrade: "ELITE" | "RELIABLE" | "WATCHLIST" | "RISK";
  isSparseData: boolean;
  isRepeatedlyLate: boolean;
  isRepeatedlyOverBudget: boolean;
}

export interface TeamWorkloadMetrics {
  userId: string;
  name: string;
  email: string;
  role: string;
  activeWeddingsCount: number;
  totalAssignedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
  workloadStatus: "BALANCED" | "HIGH" | "OVERLOADED";
}

export interface FounderDashboardOverview {
  season: SeasonFinancialMetrics;
  packages: PackageProfitability[];
  weddingPnls: WeddingPnlSummary[];
  cashFlowBuckets: CashFlowBucket[];
  weeklyCashFlow: WeeklyCashFlow[];
  operationalRisks: OperationalRiskWedding[];
  vendorReliabilities: VendorReliabilityMetrics[];
  teamWorkloads: TeamWorkloadMetrics[];
}
