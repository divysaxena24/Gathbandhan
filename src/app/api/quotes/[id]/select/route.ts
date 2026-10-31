/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { selectWinningQuote } from "@/modules/vendors/services/quote-service";
import { selectQuoteSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can select quotes and commit vendors");
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = selectQuoteSchema.parse(body);

    const result = await selectWinningQuote(
      id,
      user.id,
      validated as any
    );

    return successResponse({
      selectedQuote: {
        ...result.selectedQuote,
        basePricePaise: result.selectedQuote.basePricePaise?.toString(),
        travelFeePaise: result.selectedQuote.travelFeePaise?.toString(),
        overtimeHourlyRatePaise: result.selectedQuote.overtimeHourlyRatePaise?.toString(),
      },
      weddingVendor: {
        ...result.weddingVendor,
        contractAmountPaise: result.weddingVendor.contractAmountPaise?.toString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
