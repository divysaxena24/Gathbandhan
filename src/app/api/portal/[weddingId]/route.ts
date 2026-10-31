import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientPortalData } from "@/modules/guests/services/client-portal-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const user = await requireAuth();
    const { weddingId } = await params;

    const portalData = await getClientPortalData(weddingId, user);

    // Serialize BigInt values
    const serialized = {
      ...portalData,
      financials: {
        ...portalData.financials,
        totalContractPaise: portalData.financials.totalContractPaise.toString(),
        totalPaidPaise: portalData.financials.totalPaidPaise.toString(),
        remainingPaise: portalData.financials.remainingPaise.toString(),
        milestones: portalData.financials.milestones.map((m) => ({
          ...m,
          amountPaise: m.amountPaise.toString(),
          paidPaise: m.paidPaise.toString(),
          remainingPaise: m.remainingPaise.toString(),
        })),
        transactions: portalData.financials.transactions.map((t) => ({
          ...t,
          amountPaise: t.amountPaise.toString(),
        })),
      },
      agreement: portalData.agreement
        ? {
            ...portalData.agreement,
            totalAmountPaise: portalData.agreement.totalAmountPaise.toString(),
          }
        : null,
    };

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}

