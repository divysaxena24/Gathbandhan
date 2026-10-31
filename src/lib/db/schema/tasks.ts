import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import {
  packageTypeEnum,
  taskStatusEnum,
} from "./enums";
import { weddings, weddingEvents } from "./weddings";
import { users } from "./users";

export const taskTemplates = pgTable(
  "task_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageType: packageTypeEnum("package_type"),
    category: text("category").notNull().default("General"),
    title: text("title").notNull(),
    description: text("description"),
    defaultPriority: text("default_priority").notNull().default("MEDIUM"),
    offsetDays: integer("offset_days").notNull(),
    referenceEvent: text("reference_event").notNull().default("WEDDING_START"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(120),
    suggestedRole: text("suggested_role").notNull().default("PLANNER"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_templates_package_type_idx").on(table.packageType),
    index("task_templates_category_idx").on(table.category),
  ]
);

export const taskTemplateDependencies = pgTable(
  "task_template_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => taskTemplates.id, { onDelete: "cascade" })
      .notNull(),
    dependsOnTemplateId: uuid("depends_on_template_id")
      .references(() => taskTemplates.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_template_deps_template_id_idx").on(table.templateId),
    index("task_template_deps_depends_idx").on(table.dependsOnTemplateId),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id, { onDelete: "cascade" })
      .notNull(),
    eventId: uuid("event_id").references(() => weddingEvents.id, {
      onDelete: "set null",
    }),
    sourceTemplateId: uuid("source_template_id").references(
      () => taskTemplates.id,
      { onDelete: "set null" }
    ),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("General"),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: taskStatusEnum("status").notNull().default("TO_PLAN"),
    priority: text("priority").notNull().default("MEDIUM"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull().default(60),
    actualMinutes: integer("actual_minutes").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    isCriticalPath: boolean("is_critical_path").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_wedding_id_idx").on(table.weddingId),
    index("tasks_owner_id_idx").on(table.ownerId),
    index("tasks_status_idx").on(table.status),
    index("tasks_due_at_idx").on(table.dueAt),
  ]
);

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    dependsOnTaskId: uuid("depends_on_task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_deps_task_id_idx").on(table.taskId),
    index("task_deps_depends_idx").on(table.dependsOnTaskId),
  ]
);
