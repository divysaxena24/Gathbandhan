import { describe, it, expect } from "vitest";
import {
  calculateDueDateFromOffset,
  previewDateShift,
} from "@/modules/planning/services/backward-scheduler";
import { Task } from "@/modules/planning/types";

describe("Backward Scheduler Engine", () => {
  it("calculates due dates backward from wedding date using negative offsets", () => {
    // Wedding start: Feb 12, 2027
    const anchorDate = "2027-02-12";
    // -120 days = approx Oct 15, 2026
    const due120DaysPrior = calculateDueDateFromOffset(anchorDate, -120);

    expect(due120DaysPrior.getTime()).toBeLessThan(new Date(anchorDate).getTime());
    const diffDays = Math.round(
      (new Date(anchorDate).getTime() - due120DaysPrior.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(120);
  });

  it("calculates date shift preview and identifies at-risk tasks", () => {
    const prevDate = "2027-02-12";
    const newDate = "2027-02-26"; // shifted by +14 days

    const tasks: Task[] = [
      {
        id: "t-1",
        weddingId: "wed-1",
        eventId: null,
        sourceTemplateId: null,
        title: "Vendor Advance Payment",
        description: null,
        category: "Finance",
        ownerId: null,
        status: "TO_PLAN",
        priority: "HIGH",
        dueAt: new Date("2027-01-15T18:00:00Z"),
        estimatedMinutes: 60,
        actualMinutes: 0,
        completedAt: null,
        isCriticalPath: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    const preview = previewDateShift("wed-1", prevDate, newDate, tasks);

    expect(preview.shiftDays).toBe(14);
    expect(preview.affectedTasks).toHaveLength(1);

    const shiftedDue = new Date(preview.affectedTasks[0].newDueAt);
    const originalDue = new Date(tasks[0].dueAt);
    const diffDays = Math.round(
      (shiftedDue.getTime() - originalDue.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(14);
  });
});

