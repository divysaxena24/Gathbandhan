import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { convertLeadToWedding } from "@/modules/crm/services/conversion-service";
import { convertLeadSchema } from "@/modules/crm/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:write");
    // Also verify permissions to create clients and weddings
    await requirePermission("clients:write");
    await requirePermission("weddings:write");

    const { id } = await context.params;

    const json = await req.json();
    const input = convertLeadSchema.parse(json);

    const result = await convertLeadToWedding(id, input, user.id);

    return mutationResponse(
      result,
      `Lead successfully converted into client '${result.client.coupleName}' and wedding '${result.wedding.title}'`
    );
  } catch (err) {
    return errorResponse(err);
  }
}

