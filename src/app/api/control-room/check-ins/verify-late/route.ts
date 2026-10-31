import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkVendorLateStatus } from "@/modules/control-room/services/check-in-service";
import { verifyLateSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = verifyLateSchema.parse(body);

    const asOf = validated.asOfTime ? new Date(validated.asOfTime) : new Date();
    const result = await checkVendorLateStatus(validated.weddingId, asOf);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
