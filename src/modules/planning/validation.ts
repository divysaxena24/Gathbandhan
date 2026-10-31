import { z } from "zod";

export const taskStatusSchema = z.enum([
  "TO_PLAN",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
]);

export const taskPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const packageTypeSchema = z.enum([
  "FULL_SERVICE",
  "PARTIAL",
  "DAY_OF",
]);

// ── Task Template Validation ────────────────────────────────────
export const createTaskTemplateSchema = z.object({
  packageType: packageTypeSchema.optional().nullable(),
  category: z.string().min(2, "Category is required").default("General"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  defaultPriority: taskPrioritySchema.default("MEDIUM"),
  offsetDays: z.number().int(),
  referenceEvent: z.string().default("WEDDING_START"),
  estimatedMinutes: z.number().int().min(5).default(120),
  suggestedRole: z.string().default("PLANNER"),
  dependencyTemplateIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTaskTemplateSchema = createTaskTemplateSchema.partial();

// ── Task Validation ─────────────────────────────────────────────
export const createTaskSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  eventId: z.string().uuid("Invalid event ID").optional().nullable(),
  sourceTemplateId: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  category: z.string().default("General"),
  ownerId: z.string().uuid("Invalid planner/owner ID").optional().nullable(),
  status: taskStatusSchema.default("TO_PLAN"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueAt: z.string().min(1, "Due date is required"),
  estimatedMinutes: z.number().int().min(0).default(60),
  actualMinutes: z.number().int().min(0).default(0),
  isCriticalPath: z.boolean().default(false),
  dependsOnTaskIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  ownerId: z.string().uuid().optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  actualMinutes: z.number().int().min(0).optional(),
  isCriticalPath: z.boolean().optional(),
});

// ── Dependency Validation ───────────────────────────────────────
export const addDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid("Invalid prerequisite task ID"),
});

// ── Generate Plan from Templates ────────────────────────────────
export const generatePlanSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  packageType: packageTypeSchema.default("FULL_SERVICE"),
  assignedPlannerId: z.string().uuid().optional().nullable(),
});

// ── Date Shift Preview & Confirmation ───────────────────────────
export const previewDateShiftSchema = z.object({
  newStartDate: z.string().min(1, "New wedding date is required"),
});

export const confirmDateShiftSchema = z.object({
  newStartDate: z.string().min(1, "New wedding date is required"),
});

