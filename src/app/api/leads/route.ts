import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { successResponse, mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { createLead, getLeads } from "@/modules/crm/services/lead-service";
import { createLeadSchema, listLeadsQuerySchema } from "@/modules/crm/validation";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("leads:read");

    const url = new URL(req.url);
    const rawQuery = {
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      assignedPlannerId: url.searchParams.get("assignedPlannerId") ?? undefined,
      qualificationStatus: url.searchParams.get("qualificationStatus") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      city: url.searchParams.get("city") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
    };

    const query = listLeadsQuerySchema.parse(rawQuery);

    const result = await getLeads(
      {
        status: query.status,
        assignedPlannerId: query.assignedPlannerId,
        qualificationStatus: query.qualificationStatus,
        search: query.search,
        city: query.city,
        source: query.source,
      },
      {
        page: query.page,
        pageSize: query.pageSize,
      }
    );

    return successResponse(result.data, result.meta);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("leads:write");

    const json = await req.json();
    const input = createLeadSchema.parse(json);

    const lead = await createLead(input, user.id);

    return mutationResponse(lead, "Lead enquiry created successfully");
  } catch (err) {
    return errorResponse(err);
  }
}

