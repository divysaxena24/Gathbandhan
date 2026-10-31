import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  expenses,
  approvedExtras,
  vendors,
  weddingVendors,
  users,
  auditLogs,
} from "@/lib/db/schema";
import { ApprovedExtraRecord, ExpenseRecord } from "../types";
import { NotFoundError } from "@/lib/errors";

export async function getExpensesForWedding(
  weddingId: string
): Promise<ExpenseRecord[]> {
  const rows = await db
    .select({
      id: expenses.id,
      weddingId: expenses.weddingId,
      title: expenses.title,
      category: expenses.category,
      amountPaise: expenses.amountPaise,
      incurredAt: expenses.incurredAt,
      vendorId: expenses.vendorId,
      vendorName: vendors.name,
      billableToClient: expenses.billableToClient,
      isApproved: expenses.isApproved,
      approvedByName: users.name,
      approvedAt: expenses.approvedAt,
      receiptUrl: expenses.receiptUrl,
      notes: expenses.notes,
    })
    .from(expenses)
    .leftJoin(vendors, eq(expenses.vendorId, vendors.id))
    .leftJoin(users, eq(expenses.approvedBy, users.id))
    .where(eq(expenses.weddingId, weddingId))
    .orderBy(desc(expenses.incurredAt));

  return rows;
}

export async function createExpense(data: {
  weddingId: string;
  title: string;
  category: string;
  amountPaise: bigint;
  incurredAt: string;
  vendorId?: string | null;
  billableToClient?: boolean;
  receiptUrl?: string | null;
  notes?: string | null;
}) {
  const [created] = await db
    .insert(expenses)
    .values({
      weddingId: data.weddingId,
      title: data.title,
      category: data.category as (typeof expenses.$inferInsert)["category"],
      amountPaise: data.amountPaise,
      incurredAt: new Date(data.incurredAt),
      vendorId: data.vendorId,
      billableToClient: data.billableToClient ?? false,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      isApproved: false,
    })
    .returning();

  return created;
}

export async function approveExpense(expenseId: string, actorId: string) {
  const now = new Date();
  const [approved] = await db
    .update(expenses)
    .set({
      isApproved: true,
      approvedBy: actorId,
      approvedAt: now,
      updatedAt: now,
    })
    .where(eq(expenses.id, expenseId))
    .returning();

  if (!approved) {
    throw new NotFoundError(`Expense ${expenseId} not found`);
  }

  await db.insert(auditLogs).values({
    actorId,
    entityType: "expenses",
    entityId: expenseId,
    action: "EXPENSE_APPROVED",
    newValue: { isApproved: true, approvedAt: now.toISOString() },
    reason: `Expense '${approved.title}' approved for client/agency billing`,
    occurredAt: now,
  });

  return approved;
}

export async function getApprovedExtrasForWedding(
  weddingId: string
): Promise<ApprovedExtraRecord[]> {
  const rows = await db
    .select({
      id: approvedExtras.id,
      weddingId: approvedExtras.weddingId,
      weddingVendorId: approvedExtras.weddingVendorId,
      vendorName: vendors.name,
      title: approvedExtras.title,
      description: approvedExtras.description,
      category: approvedExtras.category,
      unitRatePaise: approvedExtras.unitRatePaise,
      quantity: approvedExtras.quantity,
      vendorCostPaise: approvedExtras.vendorCostPaise,
      clientAmountPaise: approvedExtras.clientAmountPaise,
      billableToClient: approvedExtras.billableToClient,
      status: approvedExtras.status,
      approvedByName: users.name,
      approvedAt: approvedExtras.approvedAt,
    })
    .from(approvedExtras)
    .leftJoin(
      weddingVendors,
      eq(approvedExtras.weddingVendorId, weddingVendors.id)
    )
    .leftJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .leftJoin(users, eq(approvedExtras.approvedBy, users.id))
    .where(eq(approvedExtras.weddingId, weddingId))
    .orderBy(desc(approvedExtras.createdAt));

  return rows;
}

export async function createApprovedExtra(data: {
  weddingId: string;
  weddingVendorId?: string | null;
  title: string;
  description?: string | null;
  category: string;
  unitRatePaise: bigint;
  quantity?: number;
  vendorCostPaise: bigint;
  clientAmountPaise: bigint;
  billableToClient?: boolean;
}) {
  const [created] = await db
    .insert(approvedExtras)
    .values({
      weddingId: data.weddingId,
      weddingVendorId: data.weddingVendorId,
      title: data.title,
      description: data.description,
      category: data.category,
      unitRatePaise: data.unitRatePaise,
      quantity: data.quantity ?? 1,
      vendorCostPaise: data.vendorCostPaise,
      clientAmountPaise: data.clientAmountPaise,
      billableToClient: data.billableToClient ?? true,
      status: "PENDING_APPROVAL",
    })
    .returning();

  return created;
}

export async function approveExtra(extraId: string, actorId: string) {
  const now = new Date();
  const [approved] = await db
    .update(approvedExtras)
    .set({
      status: "APPROVED",
      approvedBy: actorId,
      approvedAt: now,
      updatedAt: now,
    })
    .where(eq(approvedExtras.id, extraId))
    .returning();

  if (!approved) {
    throw new NotFoundError(`Approved extra ${extraId} not found`);
  }

  await db.insert(auditLogs).values({
    actorId,
    entityType: "approved_extras",
    entityId: extraId,
    action: "EXTRA_APPROVED",
    newValue: { status: "APPROVED", approvedAt: now.toISOString() },
    reason: `Extra deliverable '${approved.title}' approved`,
    occurredAt: now,
  });

  return approved;
}
