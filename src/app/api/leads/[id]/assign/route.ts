import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { assignPlanner } from "@/modules/crm/services/lead-service";
import { assignPlannerSchema } from "@/modules/crm/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:write");
    const { id } = await context.params;

    const json = await req.json();
    const input = assignPlannerSchema.parse(json);

    const updated = await assignPlanner(id, input, user.id);

    return mutationResponse(updated, "Lead assignment updated");
  } catch (err) {
    return errorResponse(err);
  }
}

