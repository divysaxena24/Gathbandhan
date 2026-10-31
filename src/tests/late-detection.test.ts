import { describe, it, expect } from "vitest";

interface SimulatedCheckIn {
  id: string;
  vendorName: string;
  expectedArrivalAt: Date;
  graceMinutes: number;
  status: "EXPECTED" | "ARRIVED" | "LATE";
  lateAlertSentAt: Date | null;
}

interface SimulatedAlert {
  checkInId: string;
  message: string;
}

function evaluateLateStatusPure(
  candidates: SimulatedCheckIn[],
  asOfTime: Date
): {
  updatedCandidates: SimulatedCheckIn[];
  newAlerts: SimulatedAlert[];
  newlyLateCount: number;
} {
  const newAlerts: SimulatedAlert[] = [];
  let newlyLateCount = 0;

  const updatedCandidates = candidates.map((c) => {
    if (c.status !== "EXPECTED" && c.status !== "LATE") {
      return c;
    }

    const thresholdMs =
      c.expectedArrivalAt.getTime() + c.graceMinutes * 60 * 1000;

    if (asOfTime.getTime() > thresholdMs) {
      const isNew = c.status !== "LATE";
      if (isNew) newlyLateCount++;

      let lateAlertSentAt = c.lateAlertSentAt;
      if (!lateAlertSentAt) {
        lateAlertSentAt = asOfTime;
        newAlerts.push({
          checkInId: c.id,
          message: `Vendor ${c.vendorName} is late by ${Math.floor(
            (asOfTime.getTime() - c.expectedArrivalAt.getTime()) / 60000
          )}m`,
        });
      }

      return {
        ...c,
        status: "LATE" as const,
        lateAlertSentAt,
      };
    }

    return c;
  });

  return { updatedCandidates, newAlerts, newlyLateCount };
}

describe("Event Control Room: Idempotent Late Detection Engine", () => {
  const baseArrival = new Date("2027-02-12T08:00:00+05:30");

  const initialCheckIns: SimulatedCheckIn[] = [
    {
      id: "vendor-1",
      vendorName: "Royal Sounds DJ",
      expectedArrivalAt: baseArrival, // 08:00 AM
      graceMinutes: 15,
      status: "EXPECTED",
      lateAlertSentAt: null,
    },
    {
      id: "vendor-2",
      vendorName: "Mehendi Studio",
      expectedArrivalAt: baseArrival, // 08:00 AM
      graceMinutes: 15,
      status: "ARRIVED", // Already arrived on time
      lateAlertSentAt: null,
    },
    {
      id: "vendor-3",
      vendorName: "Taj Florals",
      expectedArrivalAt: new Date(baseArrival.getTime() + 60 * 60000), // 09:00 AM
      graceMinutes: 15,
      status: "EXPECTED",
      lateAlertSentAt: null,
    },
  ];

  it("does not flag vendors who are still within their arrival grace period", () => {
    // Current time: 08:10 AM (within 15m grace of 08:00 AM)
    const currentTime = new Date("2027-02-12T08:10:00+05:30");
    const result = evaluateLateStatusPure(initialCheckIns, currentTime);

    expect(result.newlyLateCount).toBe(0);
    expect(result.newAlerts.length).toBe(0);
    expect(result.updatedCandidates.find((c) => c.id === "vendor-1")?.status).toBe(
      "EXPECTED"
    );
  });

  it("flags vendor as LATE and generates alert when grace period is exceeded", () => {
    // Current time: 08:20 AM (exceeded 08:15 AM threshold)
    const currentTime = new Date("2027-02-12T08:20:00+05:30");
    const result = evaluateLateStatusPure(initialCheckIns, currentTime);

    expect(result.newlyLateCount).toBe(1);
    expect(result.newAlerts.length).toBe(1);
    expect(result.newAlerts[0].checkInId).toBe("vendor-1");

    const v1 = result.updatedCandidates.find((c) => c.id === "vendor-1");
    expect(v1?.status).toBe("LATE");
    expect(v1?.lateAlertSentAt).toBeDefined();

    // Vendor 2 was already arrived, so untouched
    expect(result.updatedCandidates.find((c) => c.id === "vendor-2")?.status).toBe(
      "ARRIVED"
    );
    // Vendor 3 expected at 09:00 AM, untouched
    expect(result.updatedCandidates.find((c) => c.id === "vendor-3")?.status).toBe(
      "EXPECTED"
    );
  });

  it("is strictly idempotent: repeated executions produce ZERO duplicate alerts", () => {
    // First run at 08:20 AM
    const time1 = new Date("2027-02-12T08:20:00+05:30");
    const firstRun = evaluateLateStatusPure(initialCheckIns, time1);

    expect(firstRun.newAlerts.length).toBe(1);

    // Second run at 08:25 AM with the updated state
    const time2 = new Date("2027-02-12T08:25:00+05:30");
    const secondRun = evaluateLateStatusPure(firstRun.updatedCandidates, time2);

    // Exactly 0 new alerts generated!
    expect(secondRun.newAlerts.length).toBe(0);
    expect(secondRun.newlyLateCount).toBe(0);

    // Third run at 08:45 AM
    const time3 = new Date("2027-02-12T08:45:00+05:30");
    const thirdRun = evaluateLateStatusPure(secondRun.updatedCandidates, time3);

    expect(thirdRun.newAlerts.length).toBe(0);
  });
});
