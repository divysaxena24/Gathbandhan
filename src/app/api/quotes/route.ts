/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createQuote } from "@/modules/vendors/services/quote-service";
import { createQuoteSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER" && user.role !== "VENDOR") {
      throw new ForbiddenError("Unauthorized to submit quotes");
    }

    const body = await req.json();
    const validated = createQuoteSchema.parse(body);

    const quote = await createQuote(validated as any);
    return successResponse(quote);
  } catch (error) {
    return errorResponse(error);
  }
}
