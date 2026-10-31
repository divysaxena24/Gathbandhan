import { describe, it, expect } from "vitest";
import {
  calculateCascadeImpact,
  TimelineNode,
  DependencyEdge,
} from "@/modules/control-room/services/cascade-engine";

describe("Event Control Room: Delay Cascade Engine", () => {
  const baseTime = new Date("2027-02-12T10:00:00+05:30");

  const nodes: TimelineNode[] = [
    {
      id: "node-1",
      title: "Guest Welcome Refreshments",
      startsAt: new Date(baseTime.getTime()), // 10:00 AM
      endsAt: new Date(baseTime.getTime() + 30 * 60000), // 10:30 AM
      isKeyMoment: false,
    },
    {
      id: "node-2",
      title: "Baraat Procession & Dhol Entry",
      startsAt: new Date(baseTime.getTime() + 30 * 60000), // 10:30 AM
      endsAt: new Date(baseTime.getTime() + 75 * 60000), // 11:15 AM
      isKeyMoment: false,
    },
    {
      id: "node-3",
      title: "Royal Varmala Exchange",
      startsAt: new Date(baseTime.getTime() + 90 * 60000), // 11:30 AM (15m buffer after Baraat)
      endsAt: new Date(baseTime.getTime() + 120 * 60000), // 12:00 PM
      isKeyMoment: true,
    },
    {
      id: "node-4",
      title: "Vedic Pheras (Auspicious Mahurat)",
      startsAt: new Date(baseTime.getTime() + 120 * 60000), // 12:00 PM
      endsAt: new Date(baseTime.getTime() + 180 * 60000), // 01:00 PM
      isKeyMoment: true,
    },
  ];

  const dependencies: DependencyEdge[] = [
    // Baraat depends on Guest Welcome (buffer: 0m)
    {
      timelineItemId: "node-2",
      dependsOnItemId: "node-1",
      bufferMinutes: 0,
    },
    // Varmala depends on Baraat (buffer: 15m)
    {
      timelineItemId: "node-3",
      dependsOnItemId: "node-2",
      bufferMinutes: 15,
    },
    // Pheras depends on Varmala (buffer: 0m)
    {
      timelineItemId: "node-4",
      dependsOnItemId: "node-3",
      bufferMinutes: 0,
    },
  ];

  it("propagates delays downstream across dependencies", () => {
    // Delay Baraat by 30 mins
    const impact = calculateCascadeImpact(nodes, dependencies, "node-2", 30);

    expect(impact.delayedItemId).toBe("node-2");
    expect(impact.delayMinutes).toBe(30);

    // Varmala was scheduled at 11:30 AM with 15m buffer.
    // Baraat originally ended at 11:15 AM. With 30m delay, Baraat ends at 11:45 AM.
    // Required Varmala start = 11:45 AM + 15m buffer = 12:00 PM.
    // Original Varmala start was 11:30 AM, so shift is 30m!
    const varmalaImpact = impact.affectedItems.find((i) => i.itemId === "node-3");
    expect(varmalaImpact).toBeDefined();
    expect(varmalaImpact?.delayShiftMinutes).toBe(30);

    // Pheras depends on Varmala. Varmala delayed by 30m => Pheras delayed by 30m!
    const pherasImpact = impact.affectedItems.find((i) => i.itemId === "node-4");
    expect(pherasImpact).toBeDefined();
    expect(pherasImpact?.delayShiftMinutes).toBe(30);
  });

  it("absorbs delays into existing buffers when buffer is larger than delay", () => {
    // If Baraat is delayed by only 10 minutes:
    // Baraat ends at 11:25 AM. Required Varmala start = 11:25 AM + 15m buffer = 11:40 AM.
    // Varmala was scheduled at 11:30 AM, so it shifts by 10 mins.
    // But what if Guest Welcome is delayed by 10m?
    // Guest welcome was 10:00 - 10:30. Delayed by 10m => ends at 10:40 AM.
    // Baraat scheduled at 10:30 AM with buffer 0 => shifts to 10:40 AM (+10m).
    const impact = calculateCascadeImpact(nodes, dependencies, "node-1", 10);
    expect(impact.affectedItems.length).toBeGreaterThan(0);
  });

  it("identifies critical key moments impacted by cascade delay", () => {
    const impact = calculateCascadeImpact(nodes, dependencies, "node-2", 45);

    // Both Varmala and Pheras are key moments
    expect(impact.criticalMomentsAffected).toBe(2);
    expect(
      impact.recoveryRecommendations.some((r) =>
        r.includes("CRITICAL ALERT")
      )
    ).toBe(true);
  });

  it("provides deterministic tactical recovery advice", () => {
    const impact = calculateCascadeImpact(nodes, dependencies, "node-2", 20);

    expect(impact.recoveryRecommendations.length).toBeGreaterThan(0);
    expect(
      impact.recoveryRecommendations.some((r) => r.includes("Emcee") || r.includes("buffer"))
    ).toBe(true);
  });

  it("throws error if target item does not exist", () => {
    expect(() =>
      calculateCascadeImpact(nodes, dependencies, "non-existent-id", 15)
    ).toThrow();
  });
});
