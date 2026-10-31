import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { addNote } from "@/modules/crm/services/lead-service";
import { addNoteSchema } from "@/modules/crm/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requirePermission("leads:write");
    const { id } = await context.params;

    const json = await req.json();
    const input = addNoteSchema.parse(json);

    const activity = await addNote(id, input, user.id);

    return mutationResponse(activity, "Note added to activity timeline");
  } catch (err) {
    return errorResponse(err);
  }
}

