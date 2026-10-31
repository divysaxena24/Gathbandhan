/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getExpensesForWedding,
  createExpense,
} from "@/modules/finance/services/expense-extras-service";
import { createExpenseSchema } from "@/modules/finance/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const expenseList = await getExpensesForWedding(weddingId);
    return successResponse(expenseList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createExpenseSchema.parse(body);

    const created = await createExpense(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
