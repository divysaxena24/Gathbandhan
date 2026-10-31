import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { approveExtra } from "@/modules/finance/services/expense-extras-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const approved = await approveExtra(id, user.id);
    return successResponse(approved);
  } catch (error) {
    return errorResponse(error);
  }
}
