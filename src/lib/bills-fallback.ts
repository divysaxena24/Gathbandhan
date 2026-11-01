// ============================================================
// Gathbandhan — In-Memory Fallback Client Bills Store
// Used when PostgreSQL is offline or restarting on Windows localhost
// ============================================================

import { ClientBillRecord } from "@/modules/finance/types";

const globalForBills = globalThis as unknown as {
  __gathbandhanFallbackBills?: Map<string, ClientBillRecord>;
};

function getStore(): Map<string, ClientBillRecord> {
  if (!globalForBills.__gathbandhanFallbackBills) {
    const map = new Map<string, ClientBillRecord>();

    // Pre-seed a sample initial bill for client Divya & Knox
    const sampleBillId = "bill-fallback-demo-001";
    const now = new Date();
    const issueDate = now.toISOString().split("T")[0];
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const balanceDueDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const sampleBill: ClientBillRecord = {
      id: sampleBillId,
      weddingId: "wedding-demo-1",
      weddingTitle: "The Royal Udaipur Heritage Wedding",
      clientId: "client-demo-1",
      clientName: "Divya & Knox",
      billNumber: "BILL-2026-7801",
      title: "Royal Palace Wedding Planning & Production Package",
      issueDate,
      dueDate,
      subtotalPaise: 42372881n, // ₹4,23,728.81
      taxPaise: 7627119n,       // ₹76,271.19 (18% GST)
      totalPaise: 50000000n,    // ₹5,00,000.00
      paidPaise: 10000000n,     // ₹1,00,000.00 paid
      outstandingPaise: 40000000n, // ₹4,00,000.00 due
      advancePercentage: "20.00",
      advanceAmountPaise: 10000000n,
      remainingBalancePaise: 40000000n,
      balanceDueAt: balanceDueDate,
      status: "PARTIALLY_PAID",
      acceptedAt: now,
      declinedAt: null,
      declineReason: null,
      publishedAt: now,
      notes: "Initial consultation & royal planning retainer fee",
      createdBy: "planner_admin",
      createdByName: "Senior Wedding Architect",
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "item-001",
          billId: sampleBillId,
          description: "Royal Palace Wedding Planning & Design Execution",
          quantity: 1,
          unitRatePaise: 42372881n,
          totalPaise: 42372881n,
          orderIndex: 0,
          createdAt: now,
        },
      ],
      installments: [
        {
          id: "inst-001",
          billId: sampleBillId,
          title: "Advance Payment (20%)",
          percentage: "20.00",
          amountPaise: 10000000n,
          paidPaise: 10000000n,
          remainingPaise: 0n,
          dueAt: dueDate,
          status: "PAID",
          orderIndex: 0,
          paidAt: now,
          linkedMilestoneId: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "inst-002",
          billId: sampleBillId,
          title: "Remaining Balance (80%)",
          percentage: "80.00",
          amountPaise: 40000000n,
          paidPaise: 0n,
          remainingPaise: 40000000n,
          dueAt: balanceDueDate,
          status: "PENDING",
          orderIndex: 1,
          paidAt: null,
          linkedMilestoneId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    map.set(sampleBillId, sampleBill);

    // Pre-seed a sample initial bill for client Divya Saxena | AP24110011570
    const sampleBill2Id = "bill-fallback-demo-002";
    const sampleBill2: ClientBillRecord = {
      id: sampleBill2Id,
      weddingId: "wedding-ap24110011570",
      weddingTitle: "The Heritage Palace Wedding (Divya Saxena)",
      clientId: "173f48fd-48c6-41d3-8af5-e22ba8f3db6c",
      clientName: "Divya Saxena | AP24110011570",
      billNumber: "BILL-2026-7802",
      title: "Custom Luxury Wedding Planning Package",
      issueDate,
      dueDate,
      subtotalPaise: 25423728n,
      taxPaise: 4576272n,
      totalPaise: 30000000n, // ₹3,00,000.00
      paidPaise: 6000000n,   // ₹60,000.00 paid
      outstandingPaise: 24000000n, // ₹2,40,000.00 due
      advancePercentage: "20.00",
      advanceAmountPaise: 6000000n,
      remainingBalancePaise: 24000000n,
      balanceDueAt: balanceDueDate,
      status: "PARTIALLY_PAID",
      acceptedAt: now,
      declinedAt: null,
      declineReason: null,
      publishedAt: now,
      notes: "Custom package deposit for Divya Saxena | AP24110011570",
      createdBy: "planner_admin",
      createdByName: "Senior Wedding Architect",
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "item-002",
          billId: sampleBill2Id,
          description: "Luxury Palace Wedding Coordination & Production",
          quantity: 1,
          unitRatePaise: 25423728n,
          totalPaise: 25423728n,
          orderIndex: 0,
          createdAt: now,
        },
      ],
      installments: [
        {
          id: "inst-003",
          billId: sampleBill2Id,
          title: "Advance Deposit (20%)",
          percentage: "20.00",
          amountPaise: 6000000n,
          paidPaise: 6000000n,
          remainingPaise: 0n,
          dueAt: dueDate,
          status: "PAID",
          orderIndex: 0,
          paidAt: now,
          linkedMilestoneId: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "inst-004",
          billId: sampleBill2Id,
          title: "Remaining Balance (80%)",
          percentage: "80.00",
          amountPaise: 24000000n,
          paidPaise: 0n,
          remainingPaise: 24000000n,
          dueAt: balanceDueDate,
          status: "PENDING",
          orderIndex: 1,
          paidAt: null,
          linkedMilestoneId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    map.set(sampleBill2Id, sampleBill2);

    globalForBills.__gathbandhanFallbackBills = map;
  }
  return globalForBills.__gathbandhanFallbackBills;
}

export function getFallbackBills(options?: {
  weddingId?: string;
  clientId?: string;
  clientIds?: string[];
}): ClientBillRecord[] {
  const store = getStore();
  const all = Array.from(store.values());

  return all.filter((b) => {
    if (options?.weddingId && b.weddingId !== options.weddingId) {
      return false;
    }
    if (options?.clientId && b.clientId !== options.clientId) {
      return false;
    }
    if (
      options?.clientIds &&
      options.clientIds.length > 0 &&
      !options.clientIds.includes(b.clientId)
    ) {
      return false;
    }
    return true;
  });
}

export function getFallbackBillById(id: string): ClientBillRecord | null {
  const store = getStore();
  return store.get(id) || null;
}

export function saveFallbackBill(bill: ClientBillRecord): ClientBillRecord {
  const store = getStore();
  store.set(bill.id, bill);
  return bill;
}

export function updateFallbackBill(
  billId: string,
  update: Partial<ClientBillRecord>
): ClientBillRecord | null {
  const store = getStore();
  const bill = store.get(billId);
  if (!bill) return null;

  const updated: ClientBillRecord = {
    ...bill,
    ...update,
    updatedAt: new Date(),
  };
  store.set(billId, updated);
  return updated;
}

export function publishFallbackBill(billId: string): ClientBillRecord | null {
  const store = getStore();
  const bill = store.get(billId);
  if (!bill) return null;

  const updated: ClientBillRecord = {
    ...bill,
    status: "AWAITING_ACCEPTANCE",
    publishedAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(billId, updated);
  return updated;
}

export function respondFallbackBill(
  billId: string,
  action: "ACCEPT" | "DECLINE",
  reason?: string
): ClientBillRecord | null {
  const store = getStore();
  const bill = store.get(billId);
  if (!bill) return null;

  if (action === "DECLINE") {
    const updated: ClientBillRecord = {
      ...bill,
      status: "DECLINED",
      declinedAt: new Date(),
      declineReason: reason || "Declined by client",
      updatedAt: new Date(),
    };
    store.set(billId, updated);
    return updated;
  }

  const updated: ClientBillRecord = {
    ...bill,
    status: "DUE",
    acceptedAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(billId, updated);
  return updated;
}
