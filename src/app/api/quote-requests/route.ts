/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getQuoteRequests,
  createQuoteRequest,
} from "@/modules/vendors/services/quote-service";
import { createQuoteRequestSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId") || undefined;

    const requests = await getQuoteRequests(weddingId);
    return successResponse(requests);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can create quote requests");
    }

    const body = await req.json();
    const validated = createQuoteRequestSchema.parse(body);

    const created = await createQuoteRequest(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
