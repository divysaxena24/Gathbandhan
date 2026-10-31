import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  createTaskTemplateSchema,
  addDependencySchema,
  previewDateShiftSchema,
} from "@/modules/planning/validation";

describe("Planning Validation Schemas", () => {
  it("validates task creation with valid priority and status", () => {
    const valid = createTaskSchema.safeParse({
      weddingId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Confirm Palace Sound & Trussing Setup",
      category: "Production",
      priority: "HIGH",
      status: "TO_PLAN",
      dueAt: "2027-02-10T18:00:00Z",
      estimatedMinutes: 120,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects task creation with invalid status", () => {
    const invalid = createTaskSchema.safeParse({
      weddingId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Test",
      status: "INVALID_STATUS",
      dueAt: "2027-02-10T18:00:00Z",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates task template with offset days", () => {
    const valid = createTaskTemplateSchema.safeParse({
      title: "Royal Mandap Structural Render",
      category: "Decor",
      offsetDays: -90,
      defaultPriority: "HIGH",
      estimatedMinutes: 180,
    });
    expect(valid.success).toBe(true);
  });

  it("validates dependency addition schema", () => {
    const valid = addDependencySchema.safeParse({
      dependsOnTaskId: "123e4567-e89b-12d3-a456-426614174001",
    });
    expect(valid.success).toBe(true);
  });

  it("validates date shift preview schema", () => {
    const valid = previewDateShiftSchema.safeParse({
      newStartDate: "2027-02-28",
    });
    expect(valid.success).toBe(true);
  });
});
