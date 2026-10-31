import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getSeasonFinancialMetrics,
  getCashFlowForecast,
  getOperationalRisks,
} from "@/modules/analytics/services/season-analytics-service";
import { getVendorReliabilityMetrics } from "@/modules/analytics/services/vendor-reliability-service";
import { getTeamWorkloadMetrics } from "@/modules/analytics/services/team-workload-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeBigInts) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = serializeBigInts(v);
    }
    return res as unknown as T;
  }
  return obj;
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role === "CLIENT" || user.role === "VENDOR") {
      throw new ForbiddenError(
        "Only agency staff can access founder season analytics"
      );
    }

    const { season, weddingPnls, packages } = await getSeasonFinancialMetrics();
    const { buckets: cashFlowBuckets, weekly: weeklyCashFlow } =
      await getCashFlowForecast();
    const operationalRisks = await getOperationalRisks();
    const vendorReliabilities = await getVendorReliabilityMetrics();
    const teamWorkloads = await getTeamWorkloadMetrics();

    const data = serializeBigInts({
      season,
      weddingPnls,
      packages,
      cashFlowBuckets,
      weeklyCashFlow,
      operationalRisks,
      vendorReliabilities,
      teamWorkloads,
    });

    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
