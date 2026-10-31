import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getBillById,
  updateBill,
} from "@/modules/finance/services/bill-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const bill = await getBillById(id);
    return successResponse(serializeBigInt(bill));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const items = body.items?.map((it: any) => ({
      description: it.description,
      quantity: Number(it.quantity || 1),
      unitRatePaise: BigInt(it.unitRatePaise),
      orderIndex: it.orderIndex,
    }));

    const installments = body.installments?.map((inst: any) => ({
      title: inst.title,
      percentage: inst.percentage,
      amountPaise: BigInt(inst.amountPaise),
      dueAt: inst.dueAt,
      orderIndex: inst.orderIndex,
    }));

    const updated = await updateBill(
      id,
      {
        title: body.title,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        totalPaise: body.totalPaise ? BigInt(body.totalPaise) : undefined,
        items,
        taxPaise: body.taxPaise !== undefined ? BigInt(body.taxPaise) : undefined,
        advancePercentage: body.advancePercentage,
        balanceDueAt: body.balanceDueAt,
        installments,
        notes: body.notes,
      },
      user.id
    );

    return successResponse(serializeBigInt(updated));
  } catch (error) {
    return errorResponse(error);
  }
}
