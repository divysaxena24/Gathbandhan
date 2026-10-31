import { describe, it, expect } from "vitest";

interface PaymentTransaction {
  id: string;
  targetId: string; // milestoneId or invoiceId
  amountPaise: bigint;
  idempotencyKey: string;
  paidAt: Date;
  reference: string;
  notes: string | null;
}

interface ProcessPaymentRequest {
  targetId: string;
  amountPaise: bigint;
  idempotencyKey: string;
  paidAt: Date;
  reference: string;
  allowBusinessDuplicate?: boolean;
  notes?: string | null;
}

class SimulatedPaymentEngine {
  private transactions: PaymentTransaction[] = [];
  private idempotencyStore = new Map<string, PaymentTransaction>();

  public processPayment(request: ProcessPaymentRequest): {
    transaction: PaymentTransaction;
    isIdempotentReplay: boolean;
  } {
    // 1. Exact Idempotency Check
    const existingByIdempotency = this.idempotencyStore.get(
      request.idempotencyKey
    );
    if (existingByIdempotency) {
      return {
        transaction: existingByIdempotency,
        isIdempotentReplay: true,
      };
    }

    // 2. 24-Hour Business Duplicate Payment Heuristic
    if (!request.allowBusinessDuplicate) {
      const oneDayAgo = new Date(request.paidAt.getTime() - 24 * 60 * 60 * 1000);
      const duplicateRecentTx = this.transactions.find(
        (tx) =>
          tx.targetId === request.targetId &&
          tx.amountPaise === request.amountPaise &&
          tx.paidAt >= oneDayAgo &&
          tx.paidAt <= request.paidAt
      );

      if (duplicateRecentTx) {
        throw new Error(
          `Potential duplicate payment detected: An identical payment for ${request.targetId} of ${request.amountPaise} paise was recorded within 24 hours (Reference: ${duplicateRecentTx.reference}). Set allowBusinessDuplicate to proceed.`
        );
      }
    }

    // 3. Record new transaction
    const newTx: PaymentTransaction = {
      id: `tx-${this.transactions.length + 1}`,
      targetId: request.targetId,
      amountPaise: request.amountPaise,
      idempotencyKey: request.idempotencyKey,
      paidAt: request.paidAt,
      reference: request.reference,
      notes: request.notes || null,
    };

    this.transactions.push(newTx);
    this.idempotencyStore.set(request.idempotencyKey, newTx);

    return {
      transaction: newTx,
      isIdempotentReplay: false,
    };
  }

  public getTransactionsForTarget(targetId: string): PaymentTransaction[] {
    return this.transactions.filter((tx) => tx.targetId === targetId);
  }

  public getTotalPaidForTarget(targetId: string): bigint {
    return this.getTransactionsForTarget(targetId).reduce(
      (sum, tx) => sum + tx.amountPaise,
      0n
    );
  }
}

describe("Idempotent Payment Engine & Duplicate Safeguards", () => {
  it("records an initial payment successfully", () => {
    const engine = new SimulatedPaymentEngine();
    const result = engine.processPayment({
      targetId: "inv-001",
      amountPaise: 400000000n, // ₹40 Lakh
      idempotencyKey: "key-unique-001",
      paidAt: new Date("2027-01-15T10:00:00Z"),
      reference: "UTR-HDFC-998811",
    });

    expect(result.isIdempotentReplay).toBe(false);
    expect(result.transaction.amountPaise).toBe(400000000n);
    expect(engine.getTotalPaidForTarget("inv-001")).toBe(400000000n);
  });

  it("safely handles network retries using idempotency key without double billing", () => {
    const engine = new SimulatedPaymentEngine();
    const initial = engine.processPayment({
      targetId: "inv-002",
      amountPaise: 250000000n, // ₹25 Lakh
      idempotencyKey: "client-request-nonce-xyz",
      paidAt: new Date("2027-01-16T10:00:00Z"),
      reference: "UTR-ICICI-112233",
    });

    expect(initial.isIdempotentReplay).toBe(false);

    // Simulated network retry or browser re-click with identical key
    const replay = engine.processPayment({
      targetId: "inv-002",
      amountPaise: 250000000n,
      idempotencyKey: "client-request-nonce-xyz",
      paidAt: new Date("2027-01-16T10:00:02Z"),
      reference: "UTR-ICICI-112233",
    });

    expect(replay.isIdempotentReplay).toBe(true);
    expect(replay.transaction.id).toBe(initial.transaction.id);
    // Total balance MUST remain exactly 25 Lakh, not 50 Lakh
    expect(engine.getTotalPaidForTarget("inv-002")).toBe(250000000n);
    expect(engine.getTransactionsForTarget("inv-002")).toHaveLength(1);
  });

  it("detects and rejects duplicate payments to same target within 24 hours", () => {
    const engine = new SimulatedPaymentEngine();
    const t0 = new Date("2027-01-17T09:00:00Z");
    const t1 = new Date("2027-01-17T14:30:00Z"); // 5.5 hours later

    engine.processPayment({
      targetId: "milestone-003",
      amountPaise: 600000000n, // ₹60 Lakh
      idempotencyKey: "unique-key-first",
      paidAt: t0,
      reference: "UTR-KKBK-556677",
    });

    // Second payment to same milestone with different idempotency key but same amount
    expect(() => {
      engine.processPayment({
        targetId: "milestone-003",
        amountPaise: 600000000n,
        idempotencyKey: "unique-key-second",
        paidAt: t1,
        reference: "UTR-KKBK-889900",
        allowBusinessDuplicate: false,
      });
    }).toThrowError(/Potential duplicate payment detected/);

    expect(engine.getTotalPaidForTarget("milestone-003")).toBe(600000000n);
  });

  it("allows duplicate payment when explicitly authorized with allowBusinessDuplicate: true", () => {
    const engine = new SimulatedPaymentEngine();
    const t0 = new Date("2027-01-17T09:00:00Z");
    const t1 = new Date("2027-01-17T11:00:00Z");

    engine.processPayment({
      targetId: "milestone-004",
      amountPaise: 300000000n,
      idempotencyKey: "tx-legit-part-1",
      paidAt: t0,
      reference: "UTR-SBI-111111",
    });

    // Explicit override for legitimate identical installment
    const legitDuplicate = engine.processPayment({
      targetId: "milestone-004",
      amountPaise: 300000000n,
      idempotencyKey: "tx-legit-part-2",
      paidAt: t1,
      reference: "UTR-SBI-222222",
      allowBusinessDuplicate: true,
      notes: "Client paying milestone in two equal ₹30 Lakh RTGS tranches",
    });

    expect(legitDuplicate.isIdempotentReplay).toBe(false);
    expect(engine.getTotalPaidForTarget("milestone-004")).toBe(600000000n);
    expect(engine.getTransactionsForTarget("milestone-004")).toHaveLength(2);
  });

  it("allows distinct amounts to the same target within 24 hours without duplicate warning", () => {
    const engine = new SimulatedPaymentEngine();
    const t0 = new Date("2027-01-18T10:00:00Z");
    const t1 = new Date("2027-01-18T12:00:00Z");

    engine.processPayment({
      targetId: "inv-005",
      amountPaise: 100000000n, // ₹10 Lakh
      idempotencyKey: "tx-amount-1",
      paidAt: t0,
      reference: "UTR-1",
    });

    // Different amount (₹5 Lakh) to same invoice
    const second = engine.processPayment({
      targetId: "inv-005",
      amountPaise: 50000000n, // ₹5 Lakh
      idempotencyKey: "tx-amount-2",
      paidAt: t1,
      reference: "UTR-2",
    });

    expect(second.isIdempotentReplay).toBe(false);
    expect(engine.getTotalPaidForTarget("inv-005")).toBe(150000000n);
  });
});
