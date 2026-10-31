import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { changeLeadStage } from "@/modules/crm/services/lead-service";
import { changeStageSchema } from "@/modules/crm/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:write");
    const { id } = await context.params;

    const json = await req.json();
    const input = changeStageSchema.parse(json);

    const updated = await changeLeadStage(id, input, user.id);

    return mutationResponse(updated, `Lead moved to ${input.status}`);
  } catch (err) {
    return errorResponse(err);
  }
}

