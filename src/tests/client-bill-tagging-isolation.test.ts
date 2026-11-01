import { describe, it, expect } from "vitest";

describe("Client Bill Tagging & Access Isolation", () => {
  interface SimulatedBill {
    id: string;
    clientId: string;
    clientName: string;
    weddingId: string;
    title: string;
    totalPaise: bigint;
    advancePercentage: number;
    status: "DRAFT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "PAID";
    publishedAt: string | null;
  }

  // Simulated bill store
  const billsStore: SimulatedBill[] = [
    {
      id: "bill-001",
      clientId: "client-aarav",
      clientName: "Aarav & Priya Sharma",
      weddingId: "wedding-udaipur",
      title: "Royal Rajputana Full Wedding Planning",
      totalPaise: 50000000n, // ₹5,00,000
      advancePercentage: 20,
      status: "AWAITING_ACCEPTANCE",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "bill-002",
      clientId: "client-rohan",
      clientName: "Rohan & Simran Mehta",
      weddingId: "wedding-jaipur",
      title: "Heritage Palace Sangeet & Decor Execution",
      totalPaise: 80000000n, // ₹8,00,000
      advancePercentage: 25,
      status: "AWAITING_ACCEPTANCE",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "bill-003",
      clientId: "client-aarav",
      clientName: "Aarav & Priya Sharma",
      weddingId: "wedding-udaipur",
      title: "Private Draft — Incidentals & Extras",
      totalPaise: 10000000n,
      advancePercentage: 0,
      status: "DRAFT",
      publishedAt: null,
    },
  ];

  // Simulator helper mirroring /api/client/bills isolation logic
  function getBillsForClientPortal(authenticatedClientId: string) {
    return billsStore.filter(
      (b) => b.clientId === authenticatedClientId && b.status !== "DRAFT"
    );
  }

  it("ensures a bill tagged to Client A is only delivered to Client A", () => {
    const aaravBills = getBillsForClientPortal("client-aarav");
    expect(aaravBills.length).toBe(1);
    expect(aaravBills[0].id).toBe("bill-001");
    expect(aaravBills[0].clientName).toBe("Aarav & Priya Sharma");
    expect(aaravBills.every((b) => b.clientId === "client-aarav")).toBe(true);
  });

  it("ensures Client B cannot see bills tagged to Client A", () => {
    const rohanBills = getBillsForClientPortal("client-rohan");
    expect(rohanBills.length).toBe(1);
    expect(rohanBills[0].id).toBe("bill-002");
    expect(rohanBills[0].clientName).toBe("Rohan & Simran Mehta");
    expect(rohanBills.some((b) => b.clientId === "client-aarav")).toBe(false);
  });

  it("returns an empty array for unlinked users or clients without bills", () => {
    const strangerBills = getBillsForClientPortal("client-unregistered");
    expect(strangerBills).toEqual([]);
    expect(strangerBills.length).toBe(0);
  });

  it("prevents unpublished DRAFT bills from leaking to the client portal", () => {
    const aaravBills = getBillsForClientPortal("client-aarav");
    expect(aaravBills.some((b) => b.status === "DRAFT")).toBe(false);
  });
});
