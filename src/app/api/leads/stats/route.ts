import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { getCRMStats } from "@/modules/crm/services/lead-service";

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("leads:read");

    const url = new URL(req.url);
    const filterMyLeads = url.searchParams.get("mine") === "true";

    const stats = await getCRMStats(filterMyLeads ? user.id : undefined);

    // Convert BigInt to string for JSON serialization
    const serialized = {
      ...stats,
      pipelineBudgetPaise: stats.pipelineBudgetPaise.toString(),
    };

    return successResponse(serialized);
  } catch (err) {
    return errorResponse(err);
  }
}

