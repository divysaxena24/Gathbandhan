import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createBill,
  getBillsForWedding,
  getBillsForClient,
  getAllBills,
} from "@/modules/finance/services/bill-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";
import { logDbFallbackWarning } from "@/lib/db";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");
    const clientId = searchParams.get("clientId");

    try {
      if (weddingId && !clientId) {
        const bills = await getBillsForWedding(weddingId);
        return successResponse(serializeBigInt(bills));
      }

      if (clientId && !weddingId) {
        const bills = await getBillsForClient(clientId);
        return successResponse(serializeBigInt(bills));
      }

      // If both or neither provided, query all matching bills
      const bills = await getAllBills({
        weddingId: weddingId || undefined,
        clientId: clientId || undefined,
      });
      return successResponse(serializeBigInt(bills));
    } catch (dbErr: unknown) {
      logDbFallbackWarning("Finance Bills API", dbErr);
      return successResponse([]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    if (!body.weddingId) {
      throw new ValidationError("weddingId is required");
    }
    if (!body.clientId) {
      throw new ValidationError("clientId is required");
    }
    if (!body.title) {
      throw new ValidationError("title is required");
    }
    if (!body.issueDate) {
      throw new ValidationError("issueDate is required");
    }
    if (!body.dueDate) {
      throw new ValidationError("dueDate is required");
    }

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

    const bill = await createBill(
      {
        weddingId: body.weddingId,
        weddingTitle: body.weddingTitle,
        clientId: body.clientId,
        clientName: body.clientName,
        billNumber: body.billNumber,
        title: body.title,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        totalPaise: body.totalPaise ? BigInt(body.totalPaise) : undefined,
        items,
        taxPaise: body.taxPaise !== undefined ? BigInt(body.taxPaise) : 0n,
        advancePercentage: body.advancePercentage,
        balanceDueAt: body.balanceDueAt,
        installments,
        notes: body.notes,
      },
      user.id
    );

    return successResponse(serializeBigInt(bill));
  } catch (error) {
    return errorResponse(error);
  }
}
