import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { publishBill } from "@/modules/finance/services/bill-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const published = await publishBill(id, user.id);
    return successResponse(serializeBigInt(published));
  } catch (error) {
    return errorResponse(error);
  }
}
