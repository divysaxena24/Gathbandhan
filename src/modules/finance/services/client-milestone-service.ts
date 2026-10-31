import { eq, and, desc, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientPaymentMilestones,
  clientPaymentTransactions,
  users,
  auditLogs,
} from "@/lib/db/schema";
import {
  ClientPaymentMilestoneRecord,
  ClientPaymentTransactionRecord,
  MilestoneStatus,
} from "../types";
import { DuplicatePaymentError, NotFoundError } from "@/lib/errors";

export async function getMilestonesForWedding(
  weddingId: string
): Promise<ClientPaymentMilestoneRecord[]> {
  const milestones = await db
    .select({
      id: clientPaymentMilestones.id,
      weddingId: clientPaymentMilestones.weddingId,
      title: clientPaymentMilestones.title,
      percentage: clientPaymentMilestones.percentage,
      amountPaise: clientPaymentMilestones.amountPaise,
      paidPaise: clientPaymentMilestones.paidPaise,
      dueAt: clientPaymentMilestones.dueAt,
      status: clientPaymentMilestones.status,
      orderIndex: clientPaymentMilestones.orderIndex,
      notes: clientPaymentMilestones.notes,
    })
    .from(clientPaymentMilestones)
    .where(eq(clientPaymentMilestones.weddingId, weddingId))
    .orderBy(clientPaymentMilestones.orderIndex, clientPaymentMilestones.dueAt);

  return milestones.map((m) => ({
    ...m,
    status: m.status as MilestoneStatus,
    remainingPaise:
      m.amountPaise > m.paidPaise ? m.amountPaise - m.paidPaise : 0n,
  }));
}

export async function getClientTransactionsForWedding(
  weddingId: string
): Promise<ClientPaymentTransactionRecord[]> {
  const rows = await db
    .select({
      id: clientPaymentTransactions.id,
      milestoneId: clientPaymentTransactions.milestoneId,
      milestoneTitle: clientPaymentMilestones.title,
      weddingId: clientPaymentTransactions.weddingId,
      amountPaise: clientPaymentTransactions.amountPaise,
      paidAt: clientPaymentTransactions.paidAt,
      paymentMethod: clientPaymentTransactions.paymentMethod,
      reference: clientPaymentTransactions.reference,
      idempotencyKey: clientPaymentTransactions.idempotencyKey,
      recordedBy: clientPaymentTransactions.recordedBy,
      recordedByName: users.name,
      receiptUrl: clientPaymentTransactions.receiptUrl,
      notes: clientPaymentTransactions.notes,
      createdAt: clientPaymentTransactions.createdAt,
    })
    .from(clientPaymentTransactions)
    .leftJoin(
      clientPaymentMilestones,
      eq(clientPaymentTransactions.milestoneId, clientPaymentMilestones.id)
    )
    .leftJoin(users, eq(clientPaymentTransactions.recordedBy, users.id))
    .where(eq(clientPaymentTransactions.weddingId, weddingId))
    .orderBy(desc(clientPaymentTransactions.paidAt));

  return rows;
}

export async function createClientMilestone(data: {
  weddingId: string;
  title: string;
  percentage?: string | null;
  amountPaise: bigint;
  dueAt: string;
  orderIndex?: number;
  notes?: string | null;
}) {
  const [created] = await db
    .insert(clientPaymentMilestones)
    .values({
      weddingId: data.weddingId,
      title: data.title,
      percentage: data.percentage,
      amountPaise: data.amountPaise,
      dueAt: data.dueAt,
      orderIndex: data.orderIndex ?? 0,
      notes: data.notes,
      status: "PENDING",
    })
    .returning();

  return created;
}

export async function recordClientPayment(
  data: {
    milestoneId: string;
    amountPaise: bigint;
    paidAt: string;
    paymentMethod: string;
    reference: string;
    idempotencyKey: string;
    allowBusinessDuplicate?: boolean;
    notes?: string | null;
  },
  actorId?: string
): Promise<ClientPaymentTransactionRecord> {
  // 1. Exact Idempotency Check: Retry returns existing transaction
  const [existingIdempotent] = await db
    .select({
      id: clientPaymentTransactions.id,
      milestoneId: clientPaymentTransactions.milestoneId,
      milestoneTitle: clientPaymentMilestones.title,
      weddingId: clientPaymentTransactions.weddingId,
      amountPaise: clientPaymentTransactions.amountPaise,
      paidAt: clientPaymentTransactions.paidAt,
      paymentMethod: clientPaymentTransactions.paymentMethod,
      reference: clientPaymentTransactions.reference,
      idempotencyKey: clientPaymentTransactions.idempotencyKey,
      recordedBy: clientPaymentTransactions.recordedBy,
      receiptUrl: clientPaymentTransactions.receiptUrl,
      notes: clientPaymentTransactions.notes,
      createdAt: clientPaymentTransactions.createdAt,
    })
    .from(clientPaymentTransactions)
    .leftJoin(
      clientPaymentMilestones,
      eq(clientPaymentTransactions.milestoneId, clientPaymentMilestones.id)
    )
    .where(eq(clientPaymentTransactions.idempotencyKey, data.idempotencyKey))
    .limit(1);

  if (existingIdempotent) {
    return existingIdempotent;
  }

  // 2. Fetch milestone
  const [milestone] = await db
    .select()
    .from(clientPaymentMilestones)
    .where(eq(clientPaymentMilestones.id, data.milestoneId))
    .limit(1);

  if (!milestone) {
    throw new NotFoundError(`Client payment milestone ${data.milestoneId} not found`);
  }

  // 3. Business Duplicate Heuristic: check if same milestone + amount was paid within last 24h
  if (!data.allowBusinessDuplicate) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDuplicates = await db
      .select({ id: clientPaymentTransactions.id })
      .from(clientPaymentTransactions)
      .where(
        and(
          eq(clientPaymentTransactions.milestoneId, data.milestoneId),
          eq(clientPaymentTransactions.amountPaise, data.amountPaise),
          gt(clientPaymentTransactions.createdAt, oneDayAgo)
        )
      )
      .limit(1);

    if (recentDuplicates.length > 0) {
      throw new DuplicatePaymentError(
        `Potential duplicate payment detected: A client payment of identical amount was recorded within the last 24 hours (Transaction ${recentDuplicates[0].id}). Confirm legitimate installment or provide explicit authorization.`,
        recentDuplicates[0].id
      );
    }
  }

  // 4. Atomic Execution: Insert transaction, update milestone, write audit log
  return await db.transaction(async (tx) => {
    const paidAtDate = new Date(data.paidAt);

    const [transaction] = await tx
      .insert(clientPaymentTransactions)
      .values({
        milestoneId: milestone.id,
        weddingId: milestone.weddingId,
        amountPaise: data.amountPaise,
        paidAt: paidAtDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        idempotencyKey: data.idempotencyKey,
        recordedBy: actorId,
        notes: data.notes,
      })
      .returning();

    const newPaidPaise = milestone.paidPaise + data.amountPaise;
    const newStatus: MilestoneStatus =
      newPaidPaise >= milestone.amountPaise ? "PAID" : "PARTIALLY_PAID";

    await tx
      .update(clientPaymentMilestones)
      .set({
        paidPaise: newPaidPaise,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(clientPaymentMilestones.id, milestone.id));

    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        entityType: "client_payment_transactions",
        entityId: transaction.id,
        action: "CLIENT_PAYMENT_RECORDED",
        oldValue: {
          paidPaise: milestone.paidPaise.toString(),
          status: milestone.status,
        },
        newValue: {
          transactionId: transaction.id,
          amountPaise: data.amountPaise.toString(),
          newPaidPaise: newPaidPaise.toString(),
          status: newStatus,
          reference: data.reference,
          idempotencyKey: data.idempotencyKey,
        },
        reason: `Client installment recorded against milestone '${milestone.title}'`,
        occurredAt: new Date(),
      });
    }

    return {
      ...transaction,
      milestoneTitle: milestone.title,
    };
  });
}
