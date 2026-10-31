import { describe, it, expect } from "vitest";

// In-memory simulator testing deduplication and idempotent notification dispatch
interface SimulatedNotification {
  id: string;
  userId: string;
  channel: "IN_APP" | "EMAIL" | "WHATSAPP" | "SMS";
  template: string;
  title: string;
  body: string;
  dedupeKey: string | null;
  status: "SENT" | "PENDING";
  providerReference: string;
  isSimulator: boolean;
}

class NotificationDispatcherSimulator {
  private store: Map<string, SimulatedNotification> = new Map();
  private dedupeIndex: Map<string, string> = new Map();

  async dispatch(input: {
    userId: string;
    channel?: "IN_APP" | "EMAIL" | "WHATSAPP" | "SMS";
    template: string;
    title: string;
    body: string;
    dedupeKey?: string;
  }): Promise<{ notification: SimulatedNotification; isDuplicate: boolean }> {
    if (input.dedupeKey && this.dedupeIndex.has(input.dedupeKey)) {
      const existingId = this.dedupeIndex.get(input.dedupeKey)!;
      return {
        notification: this.store.get(existingId)!,
        isDuplicate: true,
      };
    }

    const id = "notif_" + Math.random().toString(36).slice(2, 9);
    const channel = input.channel || "IN_APP";
    const record: SimulatedNotification = {
      id,
      userId: input.userId,
      channel,
      template: input.template,
      title: input.title,
      body: input.body,
      dedupeKey: input.dedupeKey || null,
      status: "SENT",
      providerReference: `mock-${channel.toLowerCase()}-${Date.now()}`,
      isSimulator: true,
    };

    this.store.set(id, record);
    if (input.dedupeKey) {
      this.dedupeIndex.set(input.dedupeKey, id);
    }

    return { notification: record, isDuplicate: false };
  }
}

describe("Notification Deduplication & Delivery Integrity", () => {
  it("dispatches notification and assigns mock provider reference", async () => {
    const dispatcher = new NotificationDispatcherSimulator();
    const { notification, isDuplicate } = await dispatcher.dispatch({
      userId: "u1",
      channel: "WHATSAPP",
      template: "CLIENT_PAYMENT_DUE",
      title: "Invoice Reminder",
      body: "Milestone payment is due in 3 days",
      dedupeKey: "milestone-101-due",
    });

    expect(isDuplicate).toBe(false);
    expect(notification.channel).toBe("WHATSAPP");
    expect(notification.isSimulator).toBe(true);
    expect(notification.providerReference).toMatch(/^mock-whatsapp-/);
  });

  it("prevents duplicate alerts on identical dedupeKey", async () => {
    const dispatcher = new NotificationDispatcherSimulator();

    // First attempt
    const res1 = await dispatcher.dispatch({
      userId: "u1",
      channel: "SMS",
      template: "VENDOR_LATE",
      title: "Late Arrival Notice",
      body: "Decorator is 15 minutes late",
      dedupeKey: "vendor-decor-late-checkin-44",
    });
    expect(res1.isDuplicate).toBe(false);

    // Second retry with same key
    const res2 = await dispatcher.dispatch({
      userId: "u1",
      channel: "SMS",
      template: "VENDOR_LATE",
      title: "Late Arrival Notice",
      body: "Decorator is 15 minutes late",
      dedupeKey: "vendor-decor-late-checkin-44",
    });

    expect(res2.isDuplicate).toBe(true);
    expect(res2.notification.id).toBe(res1.notification.id);
  });
});
