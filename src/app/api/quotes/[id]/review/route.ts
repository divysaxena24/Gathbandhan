/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reviewAndVerifyQuote } from "@/modules/vendors/services/quote-service";
import { reviewQuoteSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can review and verify quotes");
    }

    const { id } = await params;
    const body = await req.json();
    const validated = reviewQuoteSchema.parse(body);

    const updated = await reviewAndVerifyQuote(
      id,
      user.id,
      validated as any
    );

    return successResponse({
      ...updated,
      basePricePaise: updated.basePricePaise?.toString(),
      travelFeePaise: updated.travelFeePaise?.toString(),
      overtimeHourlyRatePaise: updated.overtimeHourlyRatePaise?.toString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
