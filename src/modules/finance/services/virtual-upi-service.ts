import crypto from "crypto";
import QRCode from "qrcode";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientBills,
  clientBillInstallments,
  virtualPaymentSessions,
  virtualPaymentTransactions,
  virtualPaymentAllocations,
  clientPaymentMilestones,
  clientPaymentTransactions,
  weddings,
  clients,
  auditLogs,
} from "@/lib/db/schema";
import {
  VirtualPaymentSessionRecord,
  VirtualPaymentTransactionRecord,
  VirtualPaymentType,
  VirtualPaymentSessionStatus,
} from "../types";
import {
  NotFoundError,
  ValidationError,
  DuplicatePaymentError,
} from "@/lib/errors";

export const SIMULATION_DISCLAIMER =
  "SIMULATED PAYMENT — NO REAL MONEY TRANSFERRED";

export interface CreateSessionParams {
  billId: string;
  paymentType: VirtualPaymentType;
  installmentId?: string;
  appBaseUrl?: string;
}

export interface ProcessPaymentParams {
  sessionToken: string;
  payerVpa: string;
  payerName?: string;
  idempotencyKey?: string;
  allowBusinessDuplicate?: boolean;
}

/**
 * Creates an opaque virtual UPI checkout session and generates a high-res QR code.
 */
export async function createVirtualPaymentSession(
  params: CreateSessionParams
): Promise<VirtualPaymentSessionRecord> {
  const [bill] = await db
    .select({
      id: clientBills.id,
      title: clientBills.title,
      billNumber: clientBills.billNumber,
      totalPaise: clientBills.totalPaise,
      paidPaise: clientBills.paidPaise,
      status: clientBills.status,
      weddingId: clientBills.weddingId,
      clientId: clientBills.clientId,
    })
    .from(clientBills)
    .where(eq(clientBills.id, params.billId))
    .limit(1);

  if (!bill) {
    throw new NotFoundError(`Client bill ${params.billId} not found`);
  }

  // Bill must be accepted and payable
  if (
    bill.status !== "DUE" &&
    bill.status !== "PARTIALLY_PAID" &&
    bill.status !== "ACCEPTED"
  ) {
    throw new ValidationError(
      `Cannot generate payment QR for bill in '${bill.status}' status. Bill must be accepted and outstanding.`
    );
  }

  const outstandingPaise = bill.totalPaise - bill.paidPaise;
  if (outstandingPaise <= 0n) {
    throw new ValidationError("Bill has already been paid in full.");
  }

  let payableAmountPaise = 0n;
  let targetInstallmentId: string | null = null;
  let installmentTitle: string | null = null;

  if (params.paymentType === "INSTALLMENT") {
    if (!params.installmentId) {
      throw new ValidationError("installmentId is required for installment payment option");
    }

    const [installment] = await db
      .select()
      .from(clientBillInstallments)
      .where(
        and(
          eq(clientBillInstallments.id, params.installmentId),
          eq(clientBillInstallments.billId, params.billId)
        )
      )
      .limit(1);

    if (!installment) {
      throw new NotFoundError(`Installment ${params.installmentId} not found on this bill`);
    }

    if (installment.status === "PAID") {
      throw new ValidationError(`Installment '${installment.title}' has already been paid.`);
    }

    payableAmountPaise = installment.amountPaise - installment.paidPaise;
    targetInstallmentId = installment.id;
    installmentTitle = installment.title;
  } else if (params.paymentType === "FULL_BALANCE") {
    payableAmountPaise = outstandingPaise;
  } else {
    throw new ValidationError(`Unsupported payment type: ${params.paymentType}`);
  }

  if (payableAmountPaise <= 0n) {
    throw new ValidationError("Payable amount must be greater than zero.");
  }

  // Generate secure opaque token
  const randomHex = crypto.randomBytes(20).toString("hex");
  const sessionToken = `vupi_sess_${randomHex}`;

  // Session valid for 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Construct checkout URL (No real UPI URIs!)
  const baseUrl =
    params.appBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const checkoutUrl = `${baseUrl.replace(/\/+$/, "")}/pay/vupi/${sessionToken}`;

  // Generate QR code data URL (SVG / PNG representation)
  const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#1A202C",
      light: "#FFFFFF",
    },
  });

  const [session] = await db
    .insert(virtualPaymentSessions)
    .values({
      sessionToken,
      billId: params.billId,
      paymentType: params.paymentType,
      installmentId: targetInstallmentId,
      amountPaise: payableAmountPaise,
      status: "PENDING",
      qrPayload: checkoutUrl,
      expiresAt,
      metadata: JSON.stringify({
        disclaimer: SIMULATION_DISCLAIMER,
        billNumber: bill.billNumber,
        installmentTitle,
      }),
    })
    .returning();

  // Fetch client couple name
  const [clientRecord] = await db
    .select({ coupleName: clients.coupleName })
    .from(clients)
    .where(eq(clients.id, bill.clientId))
    .limit(1);

  return {
    ...session,
    billTitle: bill.title,
    billNumber: bill.billNumber,
    coupleName: clientRecord?.coupleName || "Valued Client",
    installmentTitle,
    qrDataUrl,
  };
}

/**
 * Retrieves payment session and validates its status/expiry.
 */
export async function getVirtualPaymentSession(
  sessionToken: string
): Promise<VirtualPaymentSessionRecord> {
  const [session] = await db
    .select({
      id: virtualPaymentSessions.id,
      sessionToken: virtualPaymentSessions.sessionToken,
      billId: virtualPaymentSessions.billId,
      paymentType: virtualPaymentSessions.paymentType,
      installmentId: virtualPaymentSessions.installmentId,
      amountPaise: virtualPaymentSessions.amountPaise,
      status: virtualPaymentSessions.status,
      qrPayload: virtualPaymentSessions.qrPayload,
      expiresAt: virtualPaymentSessions.expiresAt,
      completedAt: virtualPaymentSessions.completedAt,
      metadata: virtualPaymentSessions.metadata,
      createdAt: virtualPaymentSessions.createdAt,
      billTitle: clientBills.title,
      billNumber: clientBills.billNumber,
      clientId: clientBills.clientId,
    })
    .from(virtualPaymentSessions)
    .leftJoin(clientBills, eq(virtualPaymentSessions.billId, clientBills.id))
    .where(eq(virtualPaymentSessions.sessionToken, sessionToken))
    .limit(1);

  if (!session) {
    throw new NotFoundError("Payment session not found or invalid token");
  }

  // Check Expiry
  if (session.status === "PENDING" && new Date() > session.expiresAt) {
    await db
      .update(virtualPaymentSessions)
      .set({ status: "EXPIRED", updatedAt: new Date() })
      .where(eq(virtualPaymentSessions.id, session.id));

    throw new ValidationError(
      "This payment session has expired. Please return to the bill and generate a fresh QR code."
    );
  }

  let coupleName = "Valued Client";
  if (session.clientId) {
    const [c] = await db
      .select({ coupleName: clients.coupleName })
      .from(clients)
      .where(eq(clients.id, session.clientId))
      .limit(1);
    if (c?.coupleName) coupleName = c.coupleName;
  }

  let installmentTitle: string | null = null;
  if (session.installmentId) {
    const [inst] = await db
      .select({ title: clientBillInstallments.title })
      .from(clientBillInstallments)
      .where(eq(clientBillInstallments.id, session.installmentId))
      .limit(1);
    installmentTitle = inst?.title || null;
  }

  // Generate QR data URL for display
  const qrDataUrl = await QRCode.toDataURL(session.qrPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#1A202C",
      light: "#FFFFFF",
    },
  });

  return {
    ...session,
    paymentType: session.paymentType as VirtualPaymentType,
    status: session.status as VirtualPaymentSessionStatus,
    coupleName,
    installmentTitle,
    qrDataUrl,
  };
}

/**
 * Processes simulated UPI payment atomically:
 * - Option A: Settle selected installment
 * - Option B: FIFO settlement across all remaining unpaid installments
 * - Dual-ledger sync to client_payment_milestones & client_payment_transactions
 */
export async function processVirtualPayment(
  params: ProcessPaymentParams
): Promise<VirtualPaymentTransactionRecord> {
  const session = await getVirtualPaymentSession(params.sessionToken);

  if (session.status === "COMPLETED") {
    // If idempotent retry with same session, return the completed transaction
    const [existingTx] = await db
      .select()
      .from(virtualPaymentTransactions)
      .where(eq(virtualPaymentTransactions.sessionId, session.id))
      .limit(1);
    if (existingTx) {
      return {
        ...existingTx,
        paymentType: existingTx.paymentType as VirtualPaymentType,
      };
    }
    throw new ValidationError("Payment session has already been completed.");
  }

  if (session.status !== "PENDING") {
    throw new ValidationError(`Payment session cannot be processed (Status: ${session.status})`);
  }

  // Idempotency check if caller provided key
  const idempotencyKey =
    params.idempotencyKey ||
    `vupi_idem_${session.sessionToken}_${Date.now()}`;

  const [existingByIdem] = await db
    .select()
    .from(virtualPaymentTransactions)
    .where(eq(virtualPaymentTransactions.idempotencyKey, idempotencyKey))
    .limit(1);

  if (existingByIdem) {
    return {
      ...existingByIdem,
      paymentType: existingByIdem.paymentType as VirtualPaymentType,
    };
  }

  // Business duplicate heuristic: same session or bill + same amount within 24h
  if (!params.allowBusinessDuplicate) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTx = await db
      .select({ id: virtualPaymentTransactions.id, virtualUtr: virtualPaymentTransactions.virtualUtr })
      .from(virtualPaymentTransactions)
      .where(
        and(
          eq(virtualPaymentTransactions.billId, session.billId),
          eq(virtualPaymentTransactions.amountPaise, session.amountPaise),
          sql`${virtualPaymentTransactions.createdAt} > ${oneDayAgo}`
        )
      )
      .limit(1);

    if (recentTx.length > 0) {
      throw new DuplicatePaymentError(
        `Potential duplicate payment detected: An identical simulated payment was recorded recently (UTR: ${recentTx[0].virtualUtr}). Confirm payment or provide explicit authorization.`,
        recentTx[0].id
      );
    }
  }

  // Amount is strictly taken from the locked server-side session
  const totalPaymentPaise = session.amountPaise;

  // Generate unique Virtual UTR (e.g. VUTR202683920194)
  const virtualUtr = `VUTR${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Atomic Execution
  return await db.transaction(async (tx) => {
    // 1. Fetch fresh bill state
    const [bill] = await tx
      .select()
      .from(clientBills)
      .where(eq(clientBills.id, session.billId))
      .limit(1);

    if (!bill) {
      throw new NotFoundError(`Bill ${session.billId} not found`);
    }

    // 2. Insert Virtual Transaction Record
    const [newTx] = await tx
      .insert(virtualPaymentTransactions)
      .values({
        sessionId: session.id,
        billId: session.billId,
        virtualUtr,
        amountPaise: totalPaymentPaise,
        payerVpa: params.payerVpa.trim(),
        payerName: params.payerName || "Simulated Payer",
        paymentType: session.paymentType,
        idempotencyKey,
        isSimulation: true,
      })
      .returning();

    const allocations: Array<{
      id: string;
      transactionId: string;
      installmentId: string;
      installmentTitle?: string;
      amountPaise: bigint;
      previousInstallmentStatus: string;
      newInstallmentStatus: string;
      createdAt: Date;
    }> = [];

    // 3. Payment Allocation Logic
    if (session.paymentType === "INSTALLMENT" && session.installmentId) {
      // ── Option A: Single Installment Settlement ──
      const [installment] = await tx
        .select()
        .from(clientBillInstallments)
        .where(eq(clientBillInstallments.id, session.installmentId))
        .limit(1);

      if (!installment) {
        throw new NotFoundError(`Installment ${session.installmentId} not found`);
      }

      const prevStatus = installment.status;
      const newPaidPaise = installment.paidPaise + totalPaymentPaise;
      const newStatus =
        newPaidPaise >= installment.amountPaise ? "PAID" : "PARTIALLY_PAID";

      await tx
        .update(clientBillInstallments)
        .set({
          paidPaise: newPaidPaise,
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date() : installment.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(clientBillInstallments.id, installment.id));

      const [alloc] = await tx
        .insert(virtualPaymentAllocations)
        .values({
          transactionId: newTx.id,
          installmentId: installment.id,
          amountPaise: totalPaymentPaise,
          previousInstallmentStatus: prevStatus,
          newInstallmentStatus: newStatus,
        })
        .returning();

      allocations.push({
        ...alloc,
        installmentTitle: installment.title,
      });

      // Dual-ledger sync: if installment has linked milestone
      if (installment.linkedMilestoneId) {
        await syncMilestonePayment(tx, {
          milestoneId: installment.linkedMilestoneId,
          weddingId: bill.weddingId,
          amountPaise: totalPaymentPaise,
          virtualUtr,
          idempotencyKey: `sync_${idempotencyKey}_${installment.id}`,
        });
      }
    } else {
      // ── Option B: Full Balance Multi-Installment Allocation (FIFO) ──
      const unpaidInstallments = await tx
        .select()
        .from(clientBillInstallments)
        .where(
          and(
            eq(clientBillInstallments.billId, session.billId),
            sql`${clientBillInstallments.status} != 'PAID'`
          )
        )
        .orderBy(clientBillInstallments.orderIndex);

      let remainingPaymentToAllocate = totalPaymentPaise;

      for (const inst of unpaidInstallments) {
        if (remainingPaymentToAllocate <= 0n) break;

        const unpaidOnInst = inst.amountPaise - inst.paidPaise;
        const allocAmount =
          remainingPaymentToAllocate >= unpaidOnInst
            ? unpaidOnInst
            : remainingPaymentToAllocate;

        const prevStatus = inst.status;
        const newPaidPaise = inst.paidPaise + allocAmount;
        const newStatus =
          newPaidPaise >= inst.amountPaise ? "PAID" : "PARTIALLY_PAID";

        await tx
          .update(clientBillInstallments)
          .set({
            paidPaise: newPaidPaise,
            status: newStatus,
            paidAt: newStatus === "PAID" ? new Date() : inst.paidAt,
            updatedAt: new Date(),
          })
          .where(eq(clientBillInstallments.id, inst.id));

        const [alloc] = await tx
          .insert(virtualPaymentAllocations)
          .values({
            transactionId: newTx.id,
            installmentId: inst.id,
            amountPaise: allocAmount,
            previousInstallmentStatus: prevStatus,
            newInstallmentStatus: newStatus,
          })
          .returning();

        allocations.push({
          ...alloc,
          installmentTitle: inst.title,
        });

        // Dual-ledger sync
        if (inst.linkedMilestoneId) {
          await syncMilestonePayment(tx, {
            milestoneId: inst.linkedMilestoneId,
            weddingId: bill.weddingId,
            amountPaise: allocAmount,
            virtualUtr: `${virtualUtr}_${inst.orderIndex}`,
            idempotencyKey: `sync_${idempotencyKey}_${inst.id}`,
          });
        }

        remainingPaymentToAllocate -= allocAmount;
      }
    }

    // 4. Update Bill Totals and Status
    const newBillPaidPaise = bill.paidPaise + totalPaymentPaise;
    const newBillStatus =
      newBillPaidPaise >= bill.totalPaise ? "PAID" : "PARTIALLY_PAID";

    await tx
      .update(clientBills)
      .set({
        paidPaise: newBillPaidPaise,
        status: newBillStatus,
        updatedAt: new Date(),
      })
      .where(eq(clientBills.id, bill.id));

    // 5. Complete Payment Session
    await tx
      .update(virtualPaymentSessions)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(virtualPaymentSessions.id, session.id));

    // 6. Audit Trail
    if (bill.createdBy) {
      await tx.insert(auditLogs).values({
        actorId: bill.createdBy,
        action: "PROCESS_VIRTUAL_UPI_PAYMENT",
        entityType: "VIRTUAL_PAYMENT_TRANSACTION",
        entityId: newTx.id,
        newValue: {
          virtualUtr,
          amountPaise: totalPaymentPaise.toString(),
          paymentType: session.paymentType,
          payerVpa: params.payerVpa,
          isSimulation: true,
        },
      });
    }

    return {
      ...newTx,
      paymentType: newTx.paymentType as VirtualPaymentType,
      billNumber: bill.billNumber,
      allocations,
    };
  });
}

/**
 * Helper to record virtual payment into standard client milestone & transactions ledger.
 */
async function syncMilestonePayment(
  tx: any,
  data: {
    milestoneId: string;
    weddingId: string;
    amountPaise: bigint;
    virtualUtr: string;
    idempotencyKey: string;
  }
) {
  const [milestone] = await tx
    .select()
    .from(clientPaymentMilestones)
    .where(eq(clientPaymentMilestones.id, data.milestoneId))
    .limit(1);

  if (!milestone) return;

  const newMilestonePaidPaise = milestone.paidPaise + data.amountPaise;
  const newMilestoneStatus =
    newMilestonePaidPaise >= milestone.amountPaise ? "PAID" : "PARTIALLY_PAID";

  await tx
    .update(clientPaymentMilestones)
    .set({
      paidPaise: newMilestonePaidPaise,
      status: newMilestoneStatus,
      updatedAt: new Date(),
    })
    .where(eq(clientPaymentMilestones.id, milestone.id));

  await tx.insert(clientPaymentTransactions).values({
    milestoneId: milestone.id,
    weddingId: data.weddingId,
    amountPaise: data.amountPaise,
    paidAt: new Date(),
    paymentMethod: "VIRTUAL_UPI",
    reference: `SIMULATED_${data.virtualUtr}`,
    idempotencyKey: data.idempotencyKey,
    notes: `Simulated UPI payment via Gathbandhan Virtual Payment System (${SIMULATION_DISCLAIMER})`,
  });
}

/**
 * Get all virtual payment transactions for a given bill.
 */
export async function getVirtualTransactionsForBill(
  billId: string
): Promise<VirtualPaymentTransactionRecord[]> {
  const txRows = await db
    .select()
    .from(virtualPaymentTransactions)
    .where(eq(virtualPaymentTransactions.billId, billId))
    .orderBy(desc(virtualPaymentTransactions.createdAt));

  if (txRows.length === 0) return [];

  const txIds = txRows.map((t) => t.id);
  const allocRows = await db
    .select({
      id: virtualPaymentAllocations.id,
      transactionId: virtualPaymentAllocations.transactionId,
      installmentId: virtualPaymentAllocations.installmentId,
      installmentTitle: clientBillInstallments.title,
      amountPaise: virtualPaymentAllocations.amountPaise,
      previousInstallmentStatus: virtualPaymentAllocations.previousInstallmentStatus,
      newInstallmentStatus: virtualPaymentAllocations.newInstallmentStatus,
      createdAt: virtualPaymentAllocations.createdAt,
    })
    .from(virtualPaymentAllocations)
    .leftJoin(
      clientBillInstallments,
      eq(virtualPaymentAllocations.installmentId, clientBillInstallments.id)
    )
    .where(inArray(virtualPaymentAllocations.transactionId, txIds));

  return txRows.map((tx) => ({
    ...tx,
    paymentType: tx.paymentType as VirtualPaymentType,
    allocations: allocRows
      .filter((a) => a.transactionId === tx.id)
      .map((a) => ({
        ...a,
        installmentTitle: a.installmentTitle || undefined,
      })),
  }));
}
