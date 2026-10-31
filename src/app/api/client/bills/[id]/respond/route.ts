import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { respondToBill } from "@/modules/finance/services/bill-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    if (body.action !== "ACCEPT" && body.action !== "DECLINE") {
      throw new ValidationError("Action must be either 'ACCEPT' or 'DECLINE'");
    }

    const updated = await respondToBill(
      id,
      body.action,
      body.reason,
      user.id
    );

    return successResponse(serializeBigInt(updated));
  } catch (error) {
    return errorResponse(error);
  }
}
