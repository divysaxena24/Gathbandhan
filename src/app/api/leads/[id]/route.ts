import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { successResponse, mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { getLeadById, updateLead, deleteLead } from "@/modules/crm/services/lead-service";
import { updateLeadSchema } from "@/modules/crm/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("leads:read");
    const { id } = await context.params;

    const lead = await getLeadById(id);

    return successResponse(lead);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:write");
    const { id } = await context.params;

    const json = await req.json();
    const input = updateLeadSchema.parse(json);

    const updated = await updateLead(id, input, user.id);

    return mutationResponse(updated, "Lead updated successfully");
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:delete");
    const { id } = await context.params;

    await deleteLead(id, user.id);

    return mutationResponse({ id }, "Lead deleted successfully");
  } catch (err) {
    return errorResponse(err);
  }
}

