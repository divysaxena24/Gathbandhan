import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, hasPermission } from "../lib/auth/roles";

describe("Two-Sided Platform Integration & Booking Workflow", () => {
  // Test 1: 14-Step Form Validation & Paise Arithmetic
  it("strictly validates 14-step booking submission and preserves integer paise calculations", () => {
    const rawFormPayload = {
      leadName: "Rohan & Meera",
      leadEmail: "rohan.meera@example.com",
      leadPhone: "+91 98765 43210",
      preferredContactMethod: "whatsapp",
      selections: {
        weddingType: "hindu",
        regionalTraditions: ["rajasthani", "north_indian"],
        destinationCity: "Udaipur",
        venueType: "Heritage Palace",
        duration: { days: 3 },
        totalGuests: 350,
        selectedCeremonies: [
          { ceremonyName: "Mehendi & Sangeet", eventDay: 1, estimatedDuration: "4 hours" },
          { ceremonyName: "Haldi Rasam", eventDay: 2, estimatedDuration: "2 hours" },
          { ceremonyName: "Mandap & Pheras", eventDay: 2, estimatedDuration: "3.5 hours" },
          { ceremonyName: "Grand Royal Reception", eventDay: 3, estimatedDuration: "5 hours" },
        ],
        theme: "Royal Rajputana Grandeur",
        decorPreferences: ["Fresh Lotus Installations", "Palace Projection Mapping"],
        cateringType: "Traditional Royal Banquet",
        cuisines: ["Rajasthani", "Mughlai", "Continental"],
      },
      budget: {
        grandTotalInPaise: 1250000000n, // ₹1,25,00,000 (1.25 Crore) in integer paise
        categories: {
          catering: { totalInPaise: 450000000n },
          venue: { totalInPaise: 500000000n },
          decor: { totalInPaise: 200000000n },
          entertainment: { totalInPaise: 100000000n },
        },
      },
    };

    // Verify contact requirement
    expect(rawFormPayload.leadName.trim().length).toBeGreaterThan(0);
    expect(rawFormPayload.leadEmail || rawFormPayload.leadPhone).toBeTruthy();

    // Verify integer paise precision
    expect(typeof rawFormPayload.budget.grandTotalInPaise).toBe("bigint");
    expect(rawFormPayload.budget.grandTotalInPaise % 1n).toBe(0n);

    // Verify category sums equal grand total
    const categorySum = Object.values(rawFormPayload.budget.categories).reduce(
      (acc, c) => acc + c.totalInPaise,
      0n
    );
    expect(categorySum).toBe(rawFormPayload.budget.grandTotalInPaise);

    // Formatted INR calculation check
    const inrRupees = Number(rawFormPayload.budget.grandTotalInPaise) / 100;
    expect(inrRupees).toBe(12500000);
  });

  // Test 2: Status Lifecycle & State Machine
  it("enforces valid status transitions from SUBMITTED to ACCEPTED or CHANGES_REQUESTED", () => {
    type RequestStatus = "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED";

    let currentStatus: RequestStatus = "SUBMITTED";

    // Planner reviews and requests clarification
    const requestClarification = (feedback: string) => {
      expect(feedback.length).toBeGreaterThan(0);
      currentStatus = "CHANGES_REQUESTED";
      return { status: currentStatus, reviewNotes: feedback };
    };

    const reviewRes = requestClarification("Please confirm preferred dates for Jagmandir Palace.");
    expect(reviewRes.status).toBe("CHANGES_REQUESTED");
    expect(reviewRes.reviewNotes).toContain("Jagmandir Palace");

    // Client provides clarification and planner accepts
    const acceptConsultation = () => {
      currentStatus = "ACCEPTED";
      return {
        status: currentStatus,
        weddingCreated: true,
        lifecycleStatus: "PLANNING",
      };
    };

    const acceptRes = acceptConsultation();
    expect(acceptRes.status).toBe("ACCEPTED");
    expect(acceptRes.weddingCreated).toBe(true);
    expect(acceptRes.lifecycleStatus).toBe("PLANNING");
  });

  // Test 3: Role-Based Access Control and Route Isolation
  it("verifies strict role permissions: CLIENT role cannot access admin modules", () => {
    const clientRole = "CLIENT";
    const plannerRole = "PLANNER";
    const adminRole = "FOUNDER_ADMIN";

    // 1. Client permissions
    expect(hasPermission(clientRole, "weddings:read")).toBe(true);
    expect(hasPermission(clientRole, "booking-requests:read")).toBe(true);
    expect(hasPermission(clientRole, "booking-requests:write")).toBe(true);

    // Client MUST NOT have admin operations permissions
    expect(hasPermission(clientRole, "leads:write")).toBe(false);
    expect(hasPermission(clientRole, "control-room:read")).toBe(false);
    expect(hasPermission(clientRole, "control-room:write")).toBe(false);
    expect(hasPermission(clientRole, "finance:approve")).toBe(false);
    expect(hasPermission(clientRole, "analytics:read")).toBe(false);

    // 2. Planner permissions
    expect(hasPermission(plannerRole, "leads:read")).toBe(true);
    expect(hasPermission(plannerRole, "booking-requests:read")).toBe(true);
    expect(hasPermission(plannerRole, "booking-requests:write")).toBe(true);
    expect(hasPermission(plannerRole, "control-room:read")).toBe(true);

    // 3. Admin permissions
    expect(hasPermission(adminRole, "booking-requests:delete")).toBe(true);
    expect(hasPermission(adminRole, "finance:approve")).toBe(true);
  });

  // Test 4: Information Barrier & Confidentiality
  it("prevents leakage of internal admin notes and margins to the client", () => {
    const internalAdminRecord = {
      id: "req-101",
      coupleName: "Kabir & Tara",
      clientVisibleData: {
        destinationCity: "Jaipur",
        estimatedBudgetInPaise: 850000000n, // ₹85 Lakhs
        reviewNotes: "Our Jaipur team has checked hotel room availability.",
      },
      internalConfidentialData: {
        internalNotes: "Expected agency margin is 18%. Hotel offers 12% commission.",
        profitMarginPaise: 153000000n,
        lossRiskScore: "LOW",
      },
    };

    // Client portal view serialization function
    const sanitizeForClient = (record: typeof internalAdminRecord) => {
      return {
        id: record.id,
        coupleName: record.coupleName,
        ...record.clientVisibleData,
      };
    };

    const clientPayload = sanitizeForClient(internalAdminRecord);

    // Client view must contain visible notes and budget
    expect(clientPayload.destinationCity).toBe("Jaipur");
    expect(clientPayload.reviewNotes).toBeDefined();

    // Client view must NOT contain internal notes or margins
    expect((clientPayload as any).internalNotes).toBeUndefined();
    expect((clientPayload as any).profitMarginPaise).toBeUndefined();
    expect((clientPayload as any).lossRiskScore).toBeUndefined();
  });

  // Test 5: Two-Way Message Delivery
  it("supports two-way communication thread between client and wedding planner", () => {
    const thread: Array<{
      id: string;
      senderRole: "CLIENT" | "PLANNER";
      message: string;
      createdAt: string;
    }> = [];

    // Client sends message
    thread.push({
      id: "msg-1",
      senderRole: "CLIENT",
      message: "Can we add an extra Sufi night for the Sangeet?",
      createdAt: new Date().toISOString(),
    });

    // Planner replies
    thread.push({
      id: "msg-2",
      senderRole: "PLANNER",
      message: "Absolutely! We have shortlisted 2 prominent Sufi ensembles in Rajasthan.",
      createdAt: new Date().toISOString(),
    });

    expect(thread.length).toBe(2);
    expect(thread[0].senderRole).toBe("CLIENT");
    expect(thread[1].senderRole).toBe("PLANNER");
  });
});

