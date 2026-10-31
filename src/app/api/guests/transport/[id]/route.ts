import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateTransportStatus } from "@/modules/guests/services/logistics-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "DISPATCHED", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    const updated = await updateTransportStatus(id, validated.status);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

