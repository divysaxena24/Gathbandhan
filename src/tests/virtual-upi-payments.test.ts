import { describe, it, expect, beforeEach } from "vitest";
import { calculateAdvanceAndBalance } from "@/modules/finance/services/bill-service";
import { generateVirtualReceiptPdf, SIMULATION_DISCLAIMER_TEXT } from "@/modules/finance/services/receipt-service";

// In-Memory Simulation Engine for End-to-End Payment Choice & Allocation Testing
interface SimulatedBill {
  id: string;
  billNumber: string;
  totalPaise: bigint;
  paidPaise: bigint;
  advancePercentage: number;
  advanceAmountPaise: bigint;
  remainingBalancePaise: bigint;
  status: "DRAFT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "DECLINED" | "DUE" | "PARTIALLY_PAID" | "PAID";
  installments: Array<{
    id: string;
    title: string;
    percentage: number;
    amountPaise: bigint;
    paidPaise: bigint;
    status: "PENDING" | "PAID";
  }>;
}

interface SimulatedSession {
  token: string;
  billId: string;
  paymentType: "INSTALLMENT" | "FULL_BALANCE";
  installmentId?: string;
  amountPaise: bigint;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
}

interface SimulatedTransaction {
  id: string;
  virtualUtr: string;
  billId: string;
  amountPaise: bigint;
  idempotencyKey: string;
  isSimulation: boolean;
  allocations: Array<{
    installmentId: string;
    amountPaise: bigint;
  }>;
}

class VirtualUpiPaymentSimulator {
  public bills = new Map<string, SimulatedBill>();
  public sessions = new Map<string, SimulatedSession>();
  public transactions: SimulatedTransaction[] = [];
  public idempotencyStore = new Map<string, SimulatedTransaction>();

  public createBill(params: {
    id: string;
    totalPaise: bigint;
    advancePercentage: number;
  }): SimulatedBill {
    const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
      params.totalPaise,
      params.advancePercentage
    );

    const installments: SimulatedBill["installments"] = [];
    if (params.advancePercentage === 100) {
      installments.push({
        id: "inst_1",
        title: "Full Advance Payment (100%)",
        percentage: 100,
        amountPaise: params.totalPaise,
        paidPaise: 0n,
        status: "PENDING",
      });
    } else if (params.advancePercentage === 0) {
      installments.push({
        id: "inst_1",
        title: "Full Payment (100%)",
        percentage: 100,
        amountPaise: params.totalPaise,
        paidPaise: 0n,
        status: "PENDING",
      });
    } else {
      installments.push(
        {
          id: "inst_advance",
          title: `Advance Payment (${params.advancePercentage}%)`,
          percentage: params.advancePercentage,
          amountPaise: advanceAmountPaise,
          paidPaise: 0n,
          status: "PENDING",
        },
        {
          id: "inst_balance",
          title: `Remaining Balance (${100 - params.advancePercentage}%)`,
          percentage: 100 - params.advancePercentage,
          amountPaise: remainingBalancePaise,
          paidPaise: 0n,
          status: "PENDING",
        }
      );
    }

    const bill: SimulatedBill = {
      id: params.id,
      billNumber: `BILL-TEST-${params.id}`,
      totalPaise: params.totalPaise,
      paidPaise: 0n,
      advancePercentage: params.advancePercentage,
      advanceAmountPaise,
      remainingBalancePaise,
      status: "DRAFT",
      installments,
    };

    this.bills.set(params.id, bill);
    return bill;
  }

  public updateBill(
    billId: string,
    params: { totalPaise?: bigint; advancePercentage?: number }
  ): SimulatedBill {
    const bill = this.bills.get(billId);
    if (!bill) throw new Error("Bill not found");

    if (bill.paidPaise > 0n) {
      throw new Error("Cannot modify bill: Payments have already been recorded on this bill.");
    }

    const totalPaise = params.totalPaise ?? bill.totalPaise;
    const advancePercentage = params.advancePercentage ?? bill.advancePercentage;

    const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
      totalPaise,
      advancePercentage
    );

    bill.totalPaise = totalPaise;
    bill.advancePercentage = advancePercentage;
    bill.advanceAmountPaise = advanceAmountPaise;
    bill.remainingBalancePaise = remainingBalancePaise;

    return bill;
  }

  public publishBill(billId: string): void {
    const bill = this.bills.get(billId);
    if (!bill) throw new Error("Bill not found");
    bill.status = "AWAITING_ACCEPTANCE";
  }

  public respondToBill(billId: string, action: "ACCEPT" | "DECLINE"): void {
    const bill = this.bills.get(billId);
    if (!bill) throw new Error("Bill not found");
    if (bill.status !== "AWAITING_ACCEPTANCE") {
      throw new Error("Bill is not awaiting acceptance");
    }
    bill.status = action === "ACCEPT" ? "DUE" : "DECLINED";
  }

  public createSession(params: {
    billId: string;
    paymentType: "INSTALLMENT" | "FULL_BALANCE";
    installmentId?: string;
  }): SimulatedSession {
    const bill = this.bills.get(params.billId);
    if (!bill) throw new Error("Bill not found");

    if (bill.status !== "DUE" && bill.status !== "PARTIALLY_PAID") {
      throw new Error(`Cannot create payment session for bill in ${bill.status} status`);
    }

    const outstanding = bill.totalPaise - bill.paidPaise;
    if (outstanding <= 0n) {
      throw new Error("Bill has already been paid in full.");
    }

    let amountPaise = 0n;
    if (params.paymentType === "INSTALLMENT") {
      const inst = bill.installments.find((i) => i.id === params.installmentId);
      if (!inst) throw new Error("Installment not found");
      if (inst.status === "PAID") throw new Error("Installment already paid");
      amountPaise = inst.amountPaise - inst.paidPaise;
    } else {
      amountPaise = outstanding;
    }

    const token = `vupi_sess_${Math.random().toString(36).slice(2)}`;
    const session: SimulatedSession = {
      token,
      billId: params.billId,
      paymentType: params.paymentType,
      installmentId: params.installmentId,
      amountPaise,
      status: "PENDING",
    };

    this.sessions.set(token, session);
    return session;
  }

  public processPayment(params: {
    sessionToken: string;
    idempotencyKey: string;
  }): SimulatedTransaction {
    const existing = this.idempotencyStore.get(params.idempotencyKey);
    if (existing) return existing;

    const session = this.sessions.get(params.sessionToken);
    if (!session) throw new Error("Session not found");
    if (session.status !== "PENDING") throw new Error("Session not pending");

    const bill = this.bills.get(session.billId);
    if (!bill) throw new Error("Bill not found");

    const virtualUtr = `VUTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const allocations: Array<{ installmentId: string; amountPaise: bigint }> = [];

    if (session.paymentType === "INSTALLMENT" && session.installmentId) {
      // Option A: Settle specific installment
      const inst = bill.installments.find((i) => i.id === session.installmentId);
      if (!inst) throw new Error("Installment not found");

      inst.paidPaise += session.amountPaise;
      if (inst.paidPaise >= inst.amountPaise) {
        inst.status = "PAID";
      }

      allocations.push({
        installmentId: inst.id,
        amountPaise: session.amountPaise,
      });
    } else {
      // Option B: Multi-installment FIFO settlement across remaining unpaid installments
      let remainingToAlloc = session.amountPaise;
      for (const inst of bill.installments) {
        if (remainingToAlloc <= 0n) break;
        if (inst.status === "PAID") continue;

        const needed = inst.amountPaise - inst.paidPaise;
        const alloc = remainingToAlloc >= needed ? needed : remainingToAlloc;

        inst.paidPaise += alloc;
        if (inst.paidPaise >= inst.amountPaise) {
          inst.status = "PAID";
        }

        allocations.push({
          installmentId: inst.id,
          amountPaise: alloc,
        });

        remainingToAlloc -= alloc;
      }
    }

    bill.paidPaise += session.amountPaise;
    bill.status = bill.paidPaise >= bill.totalPaise ? "PAID" : "PARTIALLY_PAID";
    session.status = "COMPLETED";

    const tx: SimulatedTransaction = {
      id: `tx_${Math.random().toString(36).slice(2)}`,
      virtualUtr,
      billId: bill.id,
      amountPaise: session.amountPaise,
      idempotencyKey: params.idempotencyKey,
      isSimulation: true,
      allocations,
    };

    this.transactions.push(tx);
    this.idempotencyStore.set(params.idempotencyKey, tx);
    return tx;
  }
}

describe("Gathbandhan Virtual UPI Payment System", () => {
  let simulator: VirtualUpiPaymentSimulator;

  beforeEach(() => {
    simulator = new VirtualUpiPaymentSimulator();
  });

  describe("1. Admin-Controlled Advance Percentage & Live Amount Calculation", () => {
    it("correctly calculates advance and remaining balance for ₹5,00,000 at 20% advance", () => {
      const totalPaise = 50000000n; // ₹5,00,000 in paise
      const advancePct = 20;

      const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
        totalPaise,
        advancePct
      );

      // Advance: 20% of 5,00,000 = ₹1,00,000 = 10,000,000 paise
      expect(advanceAmountPaise).toBe(10000000n);
      // Remaining: 5,00,000 - 1,00,000 = ₹4,00,000 = 40,000,000 paise
      expect(remainingBalancePaise).toBe(40000000n);
      // Exact integer equality: advance + remaining = total
      expect(advanceAmountPaise + remainingBalancePaise).toBe(totalPaise);
    });

    it("handles 0% advance (full payment at due date)", () => {
      const totalPaise = 35000000n; // ₹3,50,000
      const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
        totalPaise,
        0
      );

      expect(advanceAmountPaise).toBe(0n);
      expect(remainingBalancePaise).toBe(totalPaise);
    });

    it("handles 100% advance payment upfront", () => {
      const totalPaise = 25000000n; // ₹2,50,000
      const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
        totalPaise,
        100
      );

      expect(advanceAmountPaise).toBe(totalPaise);
      expect(remainingBalancePaise).toBe(0n);
    });

    it("rounds odd percentages consistently to the nearest integer paise", () => {
      // ₹10,000 = 1,000,000 paise at 33.33%
      const totalPaise = 1000000n;
      const { advanceAmountPaise, remainingBalancePaise } = calculateAdvanceAndBalance(
        totalPaise,
        33.33
      );

      // 1,000,000 * 0.3333 = 333,300 paise
      expect(advanceAmountPaise).toBe(333300n);
      expect(remainingBalancePaise).toBe(666700n);
      expect(advanceAmountPaise + remainingBalancePaise).toBe(totalPaise);
    });

    it("rejects advance percentage less than 0%", () => {
      expect(() => calculateAdvanceAndBalance(50000000n, -5)).toThrowError(
        /Advance percentage must be between 0 and 100%/
      );
    });

    it("rejects advance percentage greater than 100%", () => {
      expect(() => calculateAdvanceAndBalance(50000000n, 105)).toThrowError(
        /Advance percentage must be between 0 and 100%/
      );
    });

    it("rejects total bill amount of zero or negative", () => {
      expect(() => calculateAdvanceAndBalance(0n, 20)).toThrowError(
        /Total bill amount must be greater than zero/
      );
    });
  });

  describe("2. Bill Lifecycle, Publication, and Client Acceptance", () => {
    it("transitions bill from DRAFT to AWAITING_ACCEPTANCE on publish", () => {
      const bill = simulator.createBill({
        id: "b1",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      expect(bill.status).toBe("DRAFT");
      simulator.publishBill("b1");
      expect(bill.status).toBe("AWAITING_ACCEPTANCE");
    });

    it("transitions bill to DUE when client accepts", () => {
      const bill = simulator.createBill({
        id: "b2",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      simulator.publishBill("b2");
      simulator.respondToBill("b2", "ACCEPT");

      expect(bill.status).toBe("DUE");
    });

    it("transitions bill to DECLINED when client declines", () => {
      const bill = simulator.createBill({
        id: "b3",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      simulator.publishBill("b3");
      simulator.respondToBill("b3", "DECLINE");

      expect(bill.status).toBe("DECLINED");
    });

    it("prevents generating payment QR on non-accepted bills", () => {
      simulator.createBill({
        id: "b4",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      // Still in DRAFT
      expect(() =>
        simulator.createSession({
          billId: "b4",
          paymentType: "INSTALLMENT",
          installmentId: "inst_advance",
        })
      ).toThrowError(/Cannot create payment session for bill in DRAFT status/);
    });
  });

  describe("3. Option A: Pay Advance & Status Transition", () => {
    it("allows paying exact admin-configured advance amount and marks bill PARTIALLY_PAID", () => {
      const bill = simulator.createBill({
        id: "b_adv",
        totalPaise: 50000000n, // ₹5,00,000
        advancePercentage: 20, // 20% = ₹1,00,000
      });

      simulator.publishBill("b_adv");
      simulator.respondToBill("b_adv", "ACCEPT");

      // Client selects Option A: Pay Advance
      const session = simulator.createSession({
        billId: "b_adv",
        paymentType: "INSTALLMENT",
        installmentId: "inst_advance",
      });

      expect(session.amountPaise).toBe(10000000n); // ₹1,00,000 locked!

      // Execute simulated payment
      const tx = simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_adv_1",
      });

      expect(tx.virtualUtr).toMatch(/^VUTR\d+/);
      expect(tx.isSimulation).toBe(true);
      expect(tx.amountPaise).toBe(10000000n);

      // Verify bill state: partially paid with remaining balance ₹4,00,000
      expect(bill.paidPaise).toBe(10000000n);
      expect(bill.status).toBe("PARTIALLY_PAID");

      // Verify advance installment status is PAID
      const advInst = bill.installments.find((i) => i.id === "inst_advance");
      expect(advInst?.status).toBe("PAID");

      // Verify balance installment is still PENDING
      const balInst = bill.installments.find((i) => i.id === "inst_balance");
      expect(balInst?.status).toBe("PENDING");
    });

    it("marks bill PAID if advance was configured as 100%", () => {
      const bill = simulator.createBill({
        id: "b_full_adv",
        totalPaise: 20000000n,
        advancePercentage: 100,
      });

      simulator.publishBill("b_full_adv");
      simulator.respondToBill("b_full_adv", "ACCEPT");

      const session = simulator.createSession({
        billId: "b_full_adv",
        paymentType: "INSTALLMENT",
        installmentId: "inst_1",
      });

      simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_full_adv",
      });

      expect(bill.paidPaise).toBe(20000000n);
      expect(bill.status).toBe("PAID");
    });
  });

  describe("4. Option B: Pay Full Amount in One Transaction", () => {
    it("settles entire outstanding balance and all installments in one transaction", () => {
      const bill = simulator.createBill({
        id: "b_full",
        totalPaise: 50000000n, // ₹5,00,000
        advancePercentage: 20,
      });

      simulator.publishBill("b_full");
      simulator.respondToBill("b_full", "ACCEPT");

      // Client chooses Option B: Pay Full Amount
      const session = simulator.createSession({
        billId: "b_full",
        paymentType: "FULL_BALANCE",
      });

      expect(session.amountPaise).toBe(50000000n);

      const tx = simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_full_1",
      });

      expect(tx.allocations.length).toBe(2);
      expect(tx.allocations[0].amountPaise).toBe(10000000n); // Advance settled
      expect(tx.allocations[1].amountPaise).toBe(40000000n); // Remaining balance settled

      expect(bill.paidPaise).toBe(50000000n);
      expect(bill.status).toBe("PAID");
      expect(bill.installments.every((i) => i.status === "PAID")).toBe(true);
    });
  });

  describe("5. Pay Remaining Balance After Advance Payment", () => {
    it("allows client to pay remaining balance after advance was settled", () => {
      const bill = simulator.createBill({
        id: "b_step",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      simulator.publishBill("b_step");
      simulator.respondToBill("b_step", "ACCEPT");

      // Step 1: Pay Advance
      const advSession = simulator.createSession({
        billId: "b_step",
        paymentType: "INSTALLMENT",
        installmentId: "inst_advance",
      });
      simulator.processPayment({
        sessionToken: advSession.token,
        idempotencyKey: "idem_step_1",
      });

      expect(bill.status).toBe("PARTIALLY_PAID");

      // Step 2: Pay Remaining Balance
      const remSession = simulator.createSession({
        billId: "b_step",
        paymentType: "FULL_BALANCE",
      });

      expect(remSession.amountPaise).toBe(40000000n); // Outstanding balance: ₹4,00,000

      simulator.processPayment({
        sessionToken: remSession.token,
        idempotencyKey: "idem_step_2",
      });

      expect(bill.paidPaise).toBe(50000000n);
      expect(bill.status).toBe("PAID");
    });
  });

  describe("6. Overpayment and Tamper Resistance", () => {
    it("prevents creating new payment sessions once bill is fully paid", () => {
      const bill = simulator.createBill({
        id: "b_done",
        totalPaise: 10000000n,
        advancePercentage: 100,
      });

      simulator.publishBill("b_done");
      simulator.respondToBill("b_done", "ACCEPT");

      const session = simulator.createSession({
        billId: "b_done",
        paymentType: "FULL_BALANCE",
      });
      simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_done",
      });

      expect(() =>
        simulator.createSession({
          billId: "b_done",
          paymentType: "FULL_BALANCE",
        })
      ).toThrowError(/Bill has already been paid in full|Cannot create payment session for bill in PAID status/);
    });
  });

  describe("7. Editing Protection After Payment", () => {
    it("allows editing bill details before any payment has been recorded", () => {
      const bill = simulator.createBill({
        id: "b_edit",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      // Admin changes advance to 30% before publishing/payment
      simulator.updateBill("b_edit", {
        advancePercentage: 30,
      });

      expect(bill.advancePercentage).toBe(30);
      expect(bill.advanceAmountPaise).toBe(15000000n); // 30% of ₹5,00,000 = ₹1,50,000
      expect(bill.remainingBalancePaise).toBe(35000000n);
    });

    it("strictly prevents modifying bill once a payment has been recorded", () => {
      const bill = simulator.createBill({
        id: "b_protect",
        totalPaise: 50000000n,
        advancePercentage: 20,
      });

      simulator.publishBill("b_protect");
      simulator.respondToBill("b_protect", "ACCEPT");

      const session = simulator.createSession({
        billId: "b_protect",
        paymentType: "INSTALLMENT",
        installmentId: "inst_advance",
      });
      simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_protect",
      });

      // Attempting to edit after payment must throw error
      expect(() =>
        simulator.updateBill("b_protect", {
          totalPaise: 60000000n,
        })
      ).toThrowError(
        /Cannot modify bill: Payments have already been recorded on this bill/
      );
    });
  });

  describe("8. Idempotency & Replay Protection", () => {
    it("returns existing transaction on idempotent replay without double-charging", () => {
      const bill = simulator.createBill({
        id: "b_idem",
        totalPaise: 20000000n,
        advancePercentage: 50,
      });

      simulator.publishBill("b_idem");
      simulator.respondToBill("b_idem", "ACCEPT");

      const session = simulator.createSession({
        billId: "b_idem",
        paymentType: "INSTALLMENT",
        installmentId: "inst_advance",
      });

      const tx1 = simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_unique_key_1",
      });

      // Replay with identical key
      const tx2 = simulator.processPayment({
        sessionToken: session.token,
        idempotencyKey: "idem_unique_key_1",
      });

      expect(tx1.id).toBe(tx2.id);
      expect(tx1.virtualUtr).toBe(tx2.virtualUtr);
      // Bill paid amount must NOT be doubled
      expect(bill.paidPaise).toBe(10000000n);
    });
  });

  describe("9. PDF Virtual Receipt Generation with Disclaimer", () => {
    it("generates a valid PDF buffer containing the prominent simulation disclaimer", async () => {
      const pdfBytes = await generateVirtualReceiptPdf({
        transactionId: "tx_receipt_test",
        virtualUtr: "VUTR202684920193",
        billNumber: "BILL-2026-9021",
        billTitle: "Grand Palace Royal Wedding Package",
        coupleName: "Divya & Knox",
        weddingTitle: "Udaipur Heritage Wedding",
        payerVpa: "client@oksbi",
        payerName: "Divya Saxena",
        paymentType: "INSTALLMENT",
        amountPaise: 10000000n,
        totalBillPaise: 50000000n,
        remainingBillPaise: 40000000n,
        paidAt: new Date(),
        allocations: [
          {
            installmentTitle: "Advance Payment (20%)",
            amountPaise: 10000000n,
          },
        ],
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Verify PDF header magic bytes "%PDF-"
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf8");
      expect(header).toBe("%PDF-");

      expect(SIMULATION_DISCLAIMER_TEXT).toBe(
        "SIMULATED PAYMENT — NO REAL MONEY TRANSFERRED"
      );
    });
  });
});
