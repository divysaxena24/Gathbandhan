import { eq, and, desc, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db, logDbFallbackWarning } from "@/lib/db";
import {
  getFallbackBills,
  getFallbackBillById,
  saveFallbackBill,
  publishFallbackBill,
  respondFallbackBill,
  updateFallbackBill,
} from "@/lib/bills-fallback";
import {
  clientBills,
  clientBillItems,
  clientBillInstallments,
  clientPaymentMilestones,
  weddings,
  clients,
  users,
  auditLogs,
} from "@/lib/db/schema";
import {
  ClientBillRecord,
  ClientBillItemRecord,
  ClientBillInstallmentRecord,
  BillStatus,
} from "../types";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "@/lib/errors";

export interface CreateBillItemInput {
  description: string;
  quantity?: number;
  unitRatePaise: bigint;
  orderIndex?: number;
}

export interface CreateBillInstallmentInput {
  title: string;
  percentage: number | string;
  amountPaise: bigint;
  dueAt: string;
  orderIndex?: number;
}

export interface CreateBillInput {
  weddingId: string;
  clientId: string;
  billNumber?: string;
  title: string;
  issueDate: string;
  dueDate: string;
  totalPaise?: bigint;
  items?: CreateBillItemInput[];
  taxPaise?: bigint;
  advancePercentage?: number | string;
  balanceDueAt?: string;
  installments?: CreateBillInstallmentInput[];
  notes?: string;
}

export interface UpdateBillInput {
  title?: string;
  issueDate?: string;
  dueDate?: string;
  totalPaise?: bigint;
  items?: CreateBillItemInput[];
  taxPaise?: bigint;
  advancePercentage?: number | string;
  balanceDueAt?: string;
  installments?: CreateBillInstallmentInput[];
  notes?: string;
}

/**
 * Calculates advance amount and remaining balance in integer paise.
 * Rounding is done consistently to the nearest integer paise.
 */
export function calculateAdvanceAndBalance(
  totalPaise: bigint,
  advancePercentage: number
): {
  advanceAmountPaise: bigint;
  remainingBalancePaise: bigint;
} {
  if (advancePercentage < 0 || advancePercentage > 100) {
    throw new ValidationError(
      `Advance percentage must be between 0 and 100% (received: ${advancePercentage}%)`
    );
  }
  if (totalPaise <= 0n) {
    throw new ValidationError("Total bill amount must be greater than zero");
  }

  // Round to nearest paise
  const advanceAmountPaise = BigInt(
    Math.round((Number(totalPaise) * advancePercentage) / 100)
  );
  const remainingBalancePaise = totalPaise - advanceAmountPaise;

  if (remainingBalancePaise < 0n) {
    throw new ValidationError("Remaining balance must never be negative");
  }

  return {
    advanceAmountPaise,
    remainingBalancePaise,
  };
}

export async function createBill(
  data: CreateBillInput,
  actorId?: string
): Promise<ClientBillRecord> {
  // 1. Calculate and Validate Subtotal & Total
  let calculatedSubtotal = 0n;
  let itemsToInsert: CreateBillItemInput[] = [];

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const qty = BigInt(item.quantity ?? 1);
      if (qty <= 0n) {
        throw new ValidationError("Item quantity must be greater than zero");
      }
      if (item.unitRatePaise < 0n) {
        throw new ValidationError("Item unit rate cannot be negative");
      }
      calculatedSubtotal += item.unitRatePaise * qty;
      itemsToInsert.push(item);
    }
  } else if (data.totalPaise && data.totalPaise > 0n) {
    calculatedSubtotal = data.totalPaise;
    itemsToInsert.push({
      description: data.title || "Wedding Planning & Event Management Services",
      quantity: 1,
      unitRatePaise: data.totalPaise,
      orderIndex: 0,
    });
  } else {
    throw new ValidationError("Either totalPaise or at least one bill item is required");
  }

  const taxPaise = data.taxPaise ?? 0n;
  const totalPaise = calculatedSubtotal + taxPaise;

  if (totalPaise <= 0n) {
    throw new ValidationError("Bill total must be greater than zero");
  }

  // 2. Advance Percentage & Server-Side Calculation
  const advancePercentageNum =
    data.advancePercentage !== undefined && data.advancePercentage !== null
      ? Number(data.advancePercentage)
      : 0;

  const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
    totalPaise,
    advancePercentageNum
  );

  const balanceDueDate = data.balanceDueAt || data.dueDate;

  // 3. Resolve Installment Schedule
  let finalInstallments: CreateBillInstallmentInput[] = [];

  if (data.installments && data.installments.length > 0) {
    let sumInstPaise = 0n;
    let sumPct = 0;
    for (const inst of data.installments) {
      if (inst.amountPaise <= 0n) {
        throw new ValidationError("Installment amount must be greater than zero");
      }
      sumInstPaise += inst.amountPaise;
      sumPct += Number(inst.percentage);
    }
    if (sumInstPaise !== totalPaise) {
      throw new ValidationError(
        `Installment amounts sum (${sumInstPaise} paise) must match bill total (${totalPaise} paise)`
      );
    }
    if (Math.abs(sumPct - 100) > 0.05) {
      throw new ValidationError(
        `Installment percentages must sum to 100% (currently ${sumPct.toFixed(2)}%)`
      );
    }
    finalInstallments = data.installments;
  } else {
    // Automatically build installments from advance percentage
    if (advancePercentageNum === 100) {
      finalInstallments = [
        {
          title: "Full Advance Payment (100%)",
          percentage: 100,
          amountPaise: totalPaise,
          dueAt: data.dueDate,
          orderIndex: 0,
        },
      ];
    } else if (advancePercentageNum === 0) {
      finalInstallments = [
        {
          title: "Full Payment (100%)",
          percentage: 100,
          amountPaise: totalPaise,
          dueAt: balanceDueDate,
          orderIndex: 0,
        },
      ];
    } else {
      finalInstallments = [
        {
          title: `Advance Payment (${advancePercentageNum}%)`,
          percentage: advancePercentageNum,
          amountPaise: advanceAmountPaise,
          dueAt: data.dueDate,
          orderIndex: 0,
        },
        {
          title: `Remaining Balance (${Number((100 - advancePercentageNum).toFixed(2))}%)`,
          percentage: Number((100 - advancePercentageNum).toFixed(2)),
          amountPaise: remainingBalancePaise,
          dueAt: balanceDueDate,
          orderIndex: 1,
        },
      ];
    }
  }

  try {
    // 4. Verify Wedding & Client exist in DB
  const [wedding] = await db
    .select({ id: weddings.id, clientId: weddings.clientId, title: weddings.title })
    .from(weddings)
    .where(eq(weddings.id, data.weddingId))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError(`Wedding ${data.weddingId} not found`);
  }

  const billNumber =
    data.billNumber ||
    `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 5. Atomic Transaction
  return await db.transaction(async (tx) => {
    const [bill] = await tx
      .insert(clientBills)
      .values({
        weddingId: data.weddingId,
        clientId: data.clientId,
        billNumber,
        title: data.title,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        subtotalPaise: calculatedSubtotal,
        taxPaise,
        totalPaise,
        paidPaise: 0n,
        advancePercentage: advancePercentageNum.toFixed(2),
        advanceAmountPaise,
        balanceDueAt: balanceDueDate,
        status: "DRAFT",
        notes: data.notes || null,
        createdBy: actorId || null,
      })
      .returning();

    // Insert Items
    const insertedItems: ClientBillItemRecord[] = [];
    for (let i = 0; i < itemsToInsert.length; i++) {
      const item = itemsToInsert[i];
      const qty = item.quantity ?? 1;
      const totalItemPaise = item.unitRatePaise * BigInt(qty);
      const [insertedItem] = await tx
        .insert(clientBillItems)
        .values({
          billId: bill.id,
          description: item.description,
          quantity: qty,
          unitRatePaise: item.unitRatePaise,
          totalPaise: totalItemPaise,
          orderIndex: item.orderIndex ?? i,
        })
        .returning();
      insertedItems.push(insertedItem);
    }

    // Insert Installments
    const insertedInstallments: ClientBillInstallmentRecord[] = [];
    for (let i = 0; i < finalInstallments.length; i++) {
      const inst = finalInstallments[i];
      const [insertedInst] = await tx
        .insert(clientBillInstallments)
        .values({
          billId: bill.id,
          title: inst.title,
          percentage: Number(inst.percentage).toFixed(2),
          amountPaise: inst.amountPaise,
          paidPaise: 0n,
          dueAt: inst.dueAt,
          status: "PENDING",
          orderIndex: inst.orderIndex ?? i,
        })
        .returning();

      insertedInstallments.push({
        ...insertedInst,
        remainingPaise: insertedInst.amountPaise,
      });
    }

    // Audit Log
    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        action: "CREATE_CLIENT_BILL",
        entityType: "CLIENT_BILL",
        entityId: bill.id,
        newValue: {
          billNumber,
          totalPaise: totalPaise.toString(),
          advancePercentage: advancePercentageNum,
          advanceAmountPaise: advanceAmountPaise.toString(),
          installmentsCount: insertedInstallments.length,
        },
      });
    }

    return {
      ...bill,
      advancePercentage: bill.advancePercentage,
      advanceAmountPaise: bill.advanceAmountPaise,
      remainingBalancePaise,
      balanceDueAt: bill.balanceDueAt,
      outstandingPaise: bill.totalPaise - bill.paidPaise,
      items: insertedItems,
      installments: insertedInstallments,
    };
  });
  } catch (dbErr: any) {
    if (dbErr instanceof ValidationError || dbErr instanceof ForbiddenError) {
      throw dbErr;
    }
    logDbFallbackWarning("BillService.createBill", dbErr);

    const billId = `bill-${crypto.randomUUID()}`;
    const billNumber =
      data.billNumber ||
      `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fallbackItems: ClientBillItemRecord[] = itemsToInsert.map((item, i) => ({
      id: `item-${i + 1}-${crypto.randomUUID()}`,
      billId,
      description: item.description,
      quantity: item.quantity ?? 1,
      unitRatePaise: item.unitRatePaise,
      totalPaise: item.unitRatePaise * BigInt(item.quantity ?? 1),
      orderIndex: item.orderIndex ?? i,
      createdAt: new Date(),
    }));

    const fallbackInstallments: ClientBillInstallmentRecord[] = finalInstallments.map((inst, i) => ({
      id: `inst-${i + 1}-${crypto.randomUUID()}`,
      billId,
      title: inst.title,
      percentage: Number(inst.percentage).toFixed(2),
      amountPaise: inst.amountPaise,
      paidPaise: 0n,
      remainingPaise: inst.amountPaise,
      dueAt: inst.dueAt,
      status: "PENDING",
      orderIndex: inst.orderIndex ?? i,
      paidAt: null,
      linkedMilestoneId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const fallbackRecord: ClientBillRecord = {
      id: billId,
      weddingId: data.weddingId,
      clientId: data.clientId,
      billNumber,
      title: data.title,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      subtotalPaise: calculatedSubtotal,
      taxPaise,
      totalPaise,
      paidPaise: 0n,
      outstandingPaise: totalPaise,
      advancePercentage: advancePercentageNum.toFixed(2),
      advanceAmountPaise,
      remainingBalancePaise,
      balanceDueAt: balanceDueDate,
      status: "DRAFT",
      acceptedAt: null,
      declinedAt: null,
      declineReason: null,
      publishedAt: null,
      notes: data.notes || null,
      createdBy: actorId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: fallbackItems,
      installments: fallbackInstallments,
    };

    return saveFallbackBill(fallbackRecord);
  }
}

/**
 * Updates an existing bill before payment has been recorded.
 * If total or advance percentage is changed, recalculates advance and balance on the server.
 */
export async function updateBill(
  billId: string,
  data: UpdateBillInput,
  actorId?: string
): Promise<ClientBillRecord> {
  const [existingBill] = await db
    .select()
    .from(clientBills)
    .where(eq(clientBills.id, billId))
    .limit(1);

  if (!existingBill) {
    throw new NotFoundError(`Client bill ${billId} not found`);
  }

  // Critical requirement: Once a payment has been made, prevent editing the bill in a way that
  // silently changes the paid amount or creates an inconsistent balance.
  if (existingBill.paidPaise > 0n) {
    throw new ValidationError(
      "Cannot modify bill: Payments have already been recorded on this bill."
    );
  }

  let totalPaise = existingBill.totalPaise;
  let calculatedSubtotal = existingBill.subtotalPaise;
  let taxPaise = data.taxPaise !== undefined ? data.taxPaise : existingBill.taxPaise;

  let itemsToUpdate: CreateBillItemInput[] | null = null;
  if (data.items && data.items.length > 0) {
    calculatedSubtotal = 0n;
    itemsToUpdate = [];
    for (const item of data.items) {
      const qty = BigInt(item.quantity ?? 1);
      calculatedSubtotal += item.unitRatePaise * qty;
      itemsToUpdate.push(item);
    }
    totalPaise = calculatedSubtotal + taxPaise;
  } else if (data.totalPaise && data.totalPaise > 0n) {
    totalPaise = data.totalPaise;
    calculatedSubtotal = totalPaise - taxPaise;
    itemsToUpdate = [
      {
        description: data.title || existingBill.title,
        quantity: 1,
        unitRatePaise: calculatedSubtotal,
        orderIndex: 0,
      },
    ];
  }

  const advancePercentageNum =
    data.advancePercentage !== undefined
      ? Number(data.advancePercentage)
      : Number(existingBill.advancePercentage);

  const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
    totalPaise,
    advancePercentageNum
  );

  const issueDate = data.issueDate || existingBill.issueDate;
  const dueDate = data.dueDate || existingBill.dueDate;
  const balanceDueDate = data.balanceDueAt || existingBill.balanceDueAt || dueDate;

  // Auto-generate or validate installments
  let finalInstallments: CreateBillInstallmentInput[] = [];
  if (data.installments && data.installments.length > 0) {
    finalInstallments = data.installments;
  } else {
    if (advancePercentageNum === 100) {
      finalInstallments = [
        {
          title: "Full Advance Payment (100%)",
          percentage: 100,
          amountPaise: totalPaise,
          dueAt: dueDate,
          orderIndex: 0,
        },
      ];
    } else if (advancePercentageNum === 0) {
      finalInstallments = [
        {
          title: "Full Payment (100%)",
          percentage: 100,
          amountPaise: totalPaise,
          dueAt: balanceDueDate,
          orderIndex: 0,
        },
      ];
    } else {
      finalInstallments = [
        {
          title: `Advance Payment (${advancePercentageNum}%)`,
          percentage: advancePercentageNum,
          amountPaise: advanceAmountPaise,
          dueAt: dueDate,
          orderIndex: 0,
        },
        {
          title: `Remaining Balance (${Number((100 - advancePercentageNum).toFixed(2))}%)`,
          percentage: Number((100 - advancePercentageNum).toFixed(2)),
          amountPaise: remainingBalancePaise,
          dueAt: balanceDueDate,
          orderIndex: 1,
        },
      ];
    }
  }

  return await db.transaction(async (tx) => {
    // Update bill
    await tx
      .update(clientBills)
      .set({
        title: data.title || existingBill.title,
        issueDate,
        dueDate,
        subtotalPaise: calculatedSubtotal,
        taxPaise,
        totalPaise,
        advancePercentage: advancePercentageNum.toFixed(2),
        advanceAmountPaise,
        balanceDueAt: balanceDueDate,
        notes: data.notes !== undefined ? data.notes : existingBill.notes,
        updatedAt: new Date(),
      })
      .where(eq(clientBills.id, billId));

    // Update items if provided
    if (itemsToUpdate) {
      await tx.delete(clientBillItems).where(eq(clientBillItems.billId, billId));
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const it = itemsToUpdate[i];
        const qty = it.quantity ?? 1;
        await tx.insert(clientBillItems).values({
          billId,
          description: it.description,
          quantity: qty,
          unitRatePaise: it.unitRatePaise,
          totalPaise: it.unitRatePaise * BigInt(qty),
          orderIndex: it.orderIndex ?? i,
        });
      }
    }

    // Update installments
    await tx
      .delete(clientBillInstallments)
      .where(eq(clientBillInstallments.billId, billId));

    for (let i = 0; i < finalInstallments.length; i++) {
      const inst = finalInstallments[i];
      await tx.insert(clientBillInstallments).values({
        billId,
        title: inst.title,
        percentage: Number(inst.percentage).toFixed(2),
        amountPaise: inst.amountPaise,
        paidPaise: 0n,
        dueAt: inst.dueAt,
        status: "PENDING",
        orderIndex: inst.orderIndex ?? i,
      });
    }

    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        action: "UPDATE_CLIENT_BILL",
        entityType: "CLIENT_BILL",
        entityId: billId,
        newValue: {
          totalPaise: totalPaise.toString(),
          advancePercentage: advancePercentageNum,
          advanceAmountPaise: advanceAmountPaise.toString(),
        },
      });
    }

    return await getBillById(billId);
  });
}

export async function publishBill(
  billId: string,
  actorId?: string
): Promise<ClientBillRecord> {
  const [bill] = await db
    .select()
    .from(clientBills)
    .where(eq(clientBills.id, billId))
    .limit(1);

  if (!bill) {
    throw new NotFoundError(`Client bill ${billId} not found`);
  }

  if (bill.status !== "DRAFT" && bill.status !== "DECLINED") {
    throw new ValidationError(`Cannot publish bill in ${bill.status} status`);
  }

  await db
    .update(clientBills)
    .set({
      status: "AWAITING_ACCEPTANCE",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientBills.id, billId));

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      action: "PUBLISH_CLIENT_BILL",
      entityType: "CLIENT_BILL",
      entityId: bill.id,
      oldValue: { status: bill.status },
      newValue: { status: "AWAITING_ACCEPTANCE" },
    });
  }

  return await getBillById(billId);
}

export async function respondToBill(
  billId: string,
  action: "ACCEPT" | "DECLINE",
  reason?: string,
  actorId?: string
): Promise<ClientBillRecord> {
  const [bill] = await db
    .select()
    .from(clientBills)
    .where(eq(clientBills.id, billId))
    .limit(1);

  if (!bill) {
    throw new NotFoundError(`Client bill ${billId} not found`);
  }

  if (bill.status !== "AWAITING_ACCEPTANCE") {
    throw new ValidationError(`Bill is not awaiting acceptance (current: ${bill.status})`);
  }

  if (action === "DECLINE") {
    await db
      .update(clientBills)
      .set({
        status: "DECLINED",
        declinedAt: new Date(),
        declineReason: reason || "Declined by client",
        updatedAt: new Date(),
      })
      .where(eq(clientBills.id, billId));

    if (actorId) {
      await db.insert(auditLogs).values({
        actorId,
        action: "DECLINE_CLIENT_BILL",
        entityType: "CLIENT_BILL",
        entityId: bill.id,
        newValue: { reason },
      });
    }

    return await getBillById(billId);
  }

  // ACCEPT ACTION:
  // 1. Update bill status to DUE and record acceptedAt
  // 2. Synchronize installments with clientPaymentMilestones for dual-ledger compatibility
  return await db.transaction(async (tx) => {
    await tx
      .update(clientBills)
      .set({
        status: "DUE",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientBills.id, billId));

    // Fetch bill installments
    const installments = await tx
      .select()
      .from(clientBillInstallments)
      .where(eq(clientBillInstallments.billId, billId))
      .orderBy(clientBillInstallments.orderIndex);

    for (const inst of installments) {
      const [milestone] = await tx
        .insert(clientPaymentMilestones)
        .values({
          weddingId: bill.weddingId,
          title: `${bill.billNumber}: ${inst.title}`,
          percentage: inst.percentage,
          amountPaise: inst.amountPaise,
          paidPaise: 0n,
          dueAt: inst.dueAt,
          status: "PENDING",
          orderIndex: inst.orderIndex,
          notes: `Linked to Bill ${bill.billNumber} installment`,
        })
        .returning();

      await tx
        .update(clientBillInstallments)
        .set({ linkedMilestoneId: milestone.id })
        .where(eq(clientBillInstallments.id, inst.id));
    }

    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        action: "ACCEPT_CLIENT_BILL",
        entityType: "CLIENT_BILL",
        entityId: bill.id,
        newValue: { status: "DUE" },
      });
    }

    return await getBillById(billId);
  });
}

export async function getBillById(billId: string): Promise<ClientBillRecord> {
  const [bill] = await db
    .select({
      id: clientBills.id,
      weddingId: clientBills.weddingId,
      weddingTitle: weddings.title,
      clientId: clientBills.clientId,
      clientName: clients.coupleName,
      billNumber: clientBills.billNumber,
      title: clientBills.title,
      issueDate: clientBills.issueDate,
      dueDate: clientBills.dueDate,
      subtotalPaise: clientBills.subtotalPaise,
      taxPaise: clientBills.taxPaise,
      totalPaise: clientBills.totalPaise,
      paidPaise: clientBills.paidPaise,
      advancePercentage: clientBills.advancePercentage,
      advanceAmountPaise: clientBills.advanceAmountPaise,
      balanceDueAt: clientBills.balanceDueAt,
      status: clientBills.status,
      acceptedAt: clientBills.acceptedAt,
      declinedAt: clientBills.declinedAt,
      declineReason: clientBills.declineReason,
      publishedAt: clientBills.publishedAt,
      notes: clientBills.notes,
      createdBy: clientBills.createdBy,
      createdByName: users.name,
      createdAt: clientBills.createdAt,
      updatedAt: clientBills.updatedAt,
    })
    .from(clientBills)
    .leftJoin(weddings, eq(clientBills.weddingId, weddings.id))
    .leftJoin(clients, eq(clientBills.clientId, clients.id))
    .leftJoin(users, eq(clientBills.createdBy, users.id))
    .where(eq(clientBills.id, billId))
    .limit(1);

  if (!bill) {
    throw new NotFoundError(`Client bill ${billId} not found`);
  }

  const items = await db
    .select()
    .from(clientBillItems)
    .where(eq(clientBillItems.billId, billId))
    .orderBy(clientBillItems.orderIndex);

  const installments = await db
    .select()
    .from(clientBillInstallments)
    .where(eq(clientBillInstallments.billId, billId))
    .orderBy(clientBillInstallments.orderIndex);

  const installmentsWithRemaining: ClientBillInstallmentRecord[] = installments.map(
    (inst) => ({
      ...inst,
      remainingPaise:
        inst.amountPaise > inst.paidPaise
          ? inst.amountPaise - inst.paidPaise
          : 0n,
    })
  );

  const outstandingPaise =
    bill.totalPaise > bill.paidPaise ? bill.totalPaise - bill.paidPaise : 0n;

  const remainingBalancePaise =
    bill.totalPaise > bill.advanceAmountPaise
      ? bill.totalPaise - bill.advanceAmountPaise
      : 0n;

  return {
    ...bill,
    status: bill.status as BillStatus,
    outstandingPaise,
    remainingBalancePaise,
    items,
    installments: installmentsWithRemaining,
  };
}

export async function getBillsForWedding(weddingId: string): Promise<ClientBillRecord[]> {
  return getAllBills({ weddingId });
}

export async function getBillsForClient(clientId: string): Promise<ClientBillRecord[]> {
  return getAllBills({ clientId });
}

export async function getAllBills(options?: {
  weddingId?: string;
  clientId?: string;
}): Promise<ClientBillRecord[]> {
  try {
    let query = db
      .select({
        id: clientBills.id,
        weddingId: clientBills.weddingId,
        weddingTitle: weddings.title,
        clientId: clientBills.clientId,
        clientName: clients.coupleName,
        billNumber: clientBills.billNumber,
        title: clientBills.title,
        issueDate: clientBills.issueDate,
        dueDate: clientBills.dueDate,
        subtotalPaise: clientBills.subtotalPaise,
        taxPaise: clientBills.taxPaise,
        totalPaise: clientBills.totalPaise,
        paidPaise: clientBills.paidPaise,
        advancePercentage: clientBills.advancePercentage,
        advanceAmountPaise: clientBills.advanceAmountPaise,
        balanceDueAt: clientBills.balanceDueAt,
        status: clientBills.status,
        acceptedAt: clientBills.acceptedAt,
        declinedAt: clientBills.declinedAt,
        declineReason: clientBills.declineReason,
        publishedAt: clientBills.publishedAt,
        notes: clientBills.notes,
        createdBy: clientBills.createdBy,
        createdByName: users.name,
        createdAt: clientBills.createdAt,
        updatedAt: clientBills.updatedAt,
      })
      .from(clientBills)
      .leftJoin(weddings, eq(clientBills.weddingId, weddings.id))
      .leftJoin(clients, eq(clientBills.clientId, clients.id))
      .leftJoin(users, eq(clientBills.createdBy, users.id));

    const conditions = [];
    if (options?.weddingId) {
      conditions.push(eq(clientBills.weddingId, options.weddingId));
    }
    if (options?.clientId) {
      conditions.push(eq(clientBills.clientId, options.clientId));
    }

    const bills =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(desc(clientBills.createdAt))
        : await query.orderBy(desc(clientBills.createdAt));

    const billIds = bills.map((b) => b.id);
    const fallbackBills = getFallbackBills(options);

    if (billIds.length === 0) {
      return fallbackBills;
    }

    const allItems = await db
      .select()
      .from(clientBillItems)
      .where(inArray(clientBillItems.billId, billIds))
      .orderBy(clientBillItems.orderIndex);

    const allInstallments = await db
      .select()
      .from(clientBillInstallments)
      .where(inArray(clientBillInstallments.billId, billIds))
      .orderBy(clientBillInstallments.orderIndex);

    const mappedDbBills = bills.map((b) => {
      const items = allItems.filter((item) => item.billId === b.id);
      const installments = allInstallments
        .filter((inst) => inst.billId === b.id)
        .map((inst) => ({
          ...inst,
          remainingPaise:
            inst.amountPaise > inst.paidPaise
              ? inst.amountPaise - inst.paidPaise
              : 0n,
        }));

      const outstandingPaise =
        b.totalPaise > b.paidPaise ? b.totalPaise - b.paidPaise : 0n;
      const remainingBalancePaise =
        b.totalPaise > b.advanceAmountPaise
          ? b.totalPaise - b.advanceAmountPaise
          : 0n;

      return {
        ...b,
        status: b.status as BillStatus,
        outstandingPaise,
        remainingBalancePaise,
        items,
        installments,
      };
    });

    const map = new Map<string, ClientBillRecord>();
    for (const b of mappedDbBills) map.set(b.id, b);
    for (const fb of fallbackBills) {
      if (!map.has(fb.id)) map.set(fb.id, fb);
    }
    return Array.from(map.values());
  } catch (dbErr) {
    logDbFallbackWarning('BillService.getAllBills', dbErr);
    return getFallbackBills(options);
  }
}
