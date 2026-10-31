import { describe, it, expect } from "vitest";
import {
  saveFallbackBookingRequest,
  getFallbackBookingRequestById,
  getFallbackBookingRequests,
  addFallbackMessage,
  updateFallbackBookingRequestStatus,
} from "@/lib/booking-requests-fallback";

describe("Booking Requests Offline Fallback Store", () => {
  it("creates and retrieves a booking request in fallback memory", () => {
    const created = saveFallbackBookingRequest({
      coupleName: "Aarav & Priya",
      contactName: "Aarav Sharma",
      contactEmail: "aarav@example.com",
      contactPhone: "+91 99999 88888",
      weddingType: "Rajasthani Royal",
      destinationCity: "Jaipur",
      estimatedBudgetPaise: "500000000",
    });

    expect(created.id).toBeDefined();
    expect(created.coupleName).toBe("Aarav & Priya");
    expect(created.status).toBe("SUBMITTED");
    expect(created.messages.length).toBeGreaterThan(0);

    const fetched = getFallbackBookingRequestById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.contactName).toBe("Aarav Sharma");
  });

  it("lists and filters fallback booking requests", () => {
    const list = getFallbackBookingRequests();
    expect(list.length).toBeGreaterThan(0);

    const submittedOnly = getFallbackBookingRequests("SUBMITTED");
    expect(submittedOnly.every((r) => r.status === "SUBMITTED")).toBe(true);
  });

  it("appends messages to a booking request", () => {
    const created = saveFallbackBookingRequest({
      coupleName: "Rohan & Ananya",
      contactName: "Rohan Mehta",
    });

    const msg = addFallbackMessage(created.id, {
      senderName: "Rohan Mehta",
      senderRole: "CLIENT",
      message: "Can we add fireworks during the palace entrance?",
    });

    expect(msg.message).toContain("fireworks");
    const updated = getFallbackBookingRequestById(created.id);
    expect(updated?.messages.some((m) => m.id === msg.id)).toBe(true);
  });

  it("updates request status cleanly", () => {
    const created = saveFallbackBookingRequest({
      coupleName: "Vikram & Simran",
      contactName: "Vikram Singh",
    });

    const updated = updateFallbackBookingRequestStatus(
      created.id,
      "ACCEPTED",
      "Welcome to Gathbandhan!"
    );

    expect(updated?.status).toBe("ACCEPTED");
    expect(updated?.reviewNotes).toBe("Welcome to Gathbandhan!");

    const refetched = getFallbackBookingRequestById(created.id);
    expect(refetched?.status).toBe("ACCEPTED");
  });
});
