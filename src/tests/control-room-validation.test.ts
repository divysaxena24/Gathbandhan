import { describe, it, expect } from "vitest";
import {
  createTimelineItemSchema,
  addTimelineDependencySchema,
  cascadeImpactSchema,
  createIncidentSchema,
  resolveIncidentSchema,
} from "@/modules/control-room/validation";

describe("Control Room Schema Validation", () => {
  const validUuid = "11111111-1111-4111-a111-111111111111";
  const validUuid2 = "22222222-2222-4222-a222-222222222222";

  it("validates valid timeline item creation", () => {
    const valid = {
      weddingId: validUuid,
      eventId: validUuid2,
      title: "Royal Baraat Procession",
      startsAt: "2027-02-12T10:00:00+05:30",
      endsAt: "2027-02-12T11:00:00+05:30",
      isKeyMoment: true,
      location: "Main Gateway",
    };

    const res = createTimelineItemSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects timeline item when endsAt is before startsAt", () => {
    const invalid = {
      weddingId: validUuid,
      eventId: validUuid2,
      title: "Invalid Timeline",
      startsAt: "2027-02-12T11:00:00+05:30",
      endsAt: "2027-02-12T10:00:00+05:30",
    };

    const res = createTimelineItemSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects self-dependency in timeline dependencies", () => {
    const selfDep = {
      timelineItemId: validUuid,
      dependsOnItemId: validUuid, // identical
      bufferMinutes: 10,
    };

    const res = addTimelineDependencySchema.safeParse(selfDep);
    expect(res.success).toBe(false);
  });

  it("validates cascade impact query parameters", () => {
    const valid = {
      weddingId: validUuid,
      eventId: validUuid2,
      delayedItemId: validUuid,
      delayMinutes: 30,
    };

    const res = cascadeImpactSchema.safeParse(valid);
    expect(res.success).toBe(true);

    const invalid = {
      ...valid,
      delayMinutes: 0, // must be at least 1 min
    };
    expect(cascadeImpactSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates incident creation and converts cost impact to bigint paise", () => {
    const incidentData = {
      weddingId: validUuid,
      title: "Generator Failure",
      description: "Silent 100kVA generator tripped during sound check",
      severity: "CRITICAL" as const,
      reportedBy: "Coordinator Vikram",
      costImpactPaise: 2500000, // 25,000 INR
    };

    const res = createIncidentSchema.safeParse(incidentData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(typeof res.data.costImpactPaise).toBe("bigint");
      expect(res.data.costImpactPaise).toBe(2500000n);
    }
  });

  it("validates incident resolution", () => {
    const res = resolveIncidentSchema.safeParse({
      resolutionNotes: "Replaced with backup genset within 8 minutes",
      costImpactPaise: 1500000,
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.costImpactPaise).toBe(1500000n);
    }
  });
});
