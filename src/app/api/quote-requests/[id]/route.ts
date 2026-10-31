import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getQuoteRequestById } from "@/modules/vendors/services/quote-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const request = await getQuoteRequestById(id);
    return successResponse(request);
  } catch (error) {
    return errorResponse(error);
  }
}
