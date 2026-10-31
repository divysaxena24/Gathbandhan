import { describe, it, expect } from "vitest";
import {
  checkForCycles,
  topologicalSortTasks,
  calculateScheduleImpact,
  DependencyEdge,
} from "@/modules/planning/services/dependency-graph";
import { Task } from "@/modules/planning/types";

describe("Dependency Graph Engine", () => {
  it("allows valid acyclic dependency chains", () => {
    // A -> B -> C (C depends on B, B depends on A)
    const existingEdges: DependencyEdge[] = [
      { taskId: "task-b", dependsOnTaskId: "task-a" },
    ];
    const newEdge: DependencyEdge = {
      taskId: "task-c",
      dependsOnTaskId: "task-b",
    };

    const result = checkForCycles(existingEdges, newEdge);
    expect(result.hasCycle).toBe(false);
    expect(result.cyclePath).toBeUndefined();
  });

  it("rejects direct self-dependencies (A depends on A)", () => {
    const result = checkForCycles([], {
      taskId: "task-a",
      dependsOnTaskId: "task-a",
    });
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toEqual(["task-a", "task-a"]);
  });

  it("detects and rejects 2-task cycles (A -> B -> A)", () => {
    // Task B depends on Task A
    const existingEdges: DependencyEdge[] = [
      { taskId: "task-b", dependsOnTaskId: "task-a" },
    ];
    // Adding: Task A depends on Task B
    const result = checkForCycles(existingEdges, {
      taskId: "task-a",
      dependsOnTaskId: "task-b",
    });

    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toBeDefined();
    expect(result.cyclePath).toContain("task-a");
    expect(result.cyclePath).toContain("task-b");
  });

  it("detects and rejects multi-node cycles (A -> B -> C -> D -> A)", () => {
    const existingEdges: DependencyEdge[] = [
      { taskId: "task-b", dependsOnTaskId: "task-a" },
      { taskId: "task-c", dependsOnTaskId: "task-b" },
      { taskId: "task-d", dependsOnTaskId: "task-c" },
    ];
    // Adding: Task A depends on Task D
    const result = checkForCycles(existingEdges, {
      taskId: "task-a",
      dependsOnTaskId: "task-d",
    });

    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toBeDefined();
  });

  it("topologically sorts tasks in valid prerequisite execution order", () => {
    const tasks = [
      { id: "decor-setup" },
      { id: "floor-plan" },
      { id: "decor-render" },
      { id: "venue-booking" },
    ];

    // Dependencies:
    // floor-plan depends on venue-booking
    // decor-render depends on floor-plan
    // decor-setup depends on decor-render
    const edges: DependencyEdge[] = [
      { taskId: "floor-plan", dependsOnTaskId: "venue-booking" },
      { taskId: "decor-render", dependsOnTaskId: "floor-plan" },
      { taskId: "decor-setup", dependsOnTaskId: "decor-render" },
    ];

    const sorted = topologicalSortTasks(tasks, edges);
    const sortedIds = sorted.map((t) => t.id);

    expect(sortedIds.indexOf("venue-booking")).toBeLessThan(sortedIds.indexOf("floor-plan"));
    expect(sortedIds.indexOf("floor-plan")).toBeLessThan(sortedIds.indexOf("decor-render"));
    expect(sortedIds.indexOf("decor-render")).toBeLessThan(sortedIds.indexOf("decor-setup"));
  });

  it("calculates downstream schedule impacts when a prerequisite is delayed", () => {
    const baseDate = new Date("2027-01-01T18:00:00Z");

    const tasks: Task[] = [
      {
        id: "task-1",
        weddingId: "wed-1",
        eventId: null,
        sourceTemplateId: null,
        title: "Floor Plan Layout",
        description: null,
        category: "Venue",
        ownerId: null,
        status: "TO_PLAN",
        priority: "MEDIUM",
        dueAt: baseDate,
        estimatedMinutes: 120,
        actualMinutes: 0,
        completedAt: null,
        isCriticalPath: false,
        createdAt: baseDate,
        updatedAt: baseDate,
        deletedAt: null,
      },
      {
        id: "task-2",
        weddingId: "wed-1",
        eventId: null,
        sourceTemplateId: null,
        title: "Decor Mandap Render",
        description: null,
        category: "Decor",
        ownerId: null,
        status: "TO_PLAN",
        priority: "HIGH",
        dueAt: new Date("2027-01-10T18:00:00Z"),
        estimatedMinutes: 180,
        actualMinutes: 0,
        completedAt: null,
        isCriticalPath: true,
        createdAt: baseDate,
        updatedAt: baseDate,
        deletedAt: null,
      },
      {
        id: "task-3",
        weddingId: "wed-1",
        eventId: null,
        sourceTemplateId: null,
        title: "Mandap Production Setup",
        description: null,
        category: "Decor",
        ownerId: null,
        status: "TO_PLAN",
        priority: "CRITICAL",
        dueAt: new Date("2027-01-20T18:00:00Z"),
        estimatedMinutes: 240,
        actualMinutes: 0,
        completedAt: null,
        isCriticalPath: true,
        createdAt: baseDate,
        updatedAt: baseDate,
        deletedAt: null,
      },
    ];

    const edges: DependencyEdge[] = [
      { taskId: "task-2", dependsOnTaskId: "task-1" },
      { taskId: "task-3", dependsOnTaskId: "task-2" },
    ];

    // Delay task-1 by 5 days
    const impacts = calculateScheduleImpact("task-1", 5, tasks, edges);

    expect(impacts).toHaveLength(2);
    expect(impacts[0].affectedTaskId).toBe("task-2");
    expect(impacts[0].delayDays).toBe(5);
    expect(impacts[1].affectedTaskId).toBe("task-3");
    expect(impacts[1].criticality).toBe("CRITICAL");
  });
});
