import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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

function isValidUuid(val?: string | null): boolean {
  return Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();

    if (body.action !== "ACCEPT" && body.action !== "DECLINE") {
      throw new ValidationError("Action must be either 'ACCEPT' or 'DECLINE'");
    }

    const actorId = isValidUuid(user?.id) ? user!.id : undefined;

    const updated = await respondToBill(
      id,
      body.action,
      body.reason,
      actorId
    );

    return successResponse(serializeBigInt(updated));
  } catch (error) {
    return errorResponse(error);
  }
}
