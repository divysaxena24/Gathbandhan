/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq, and, isNull, desc, or, ilike, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tasks,
  taskDependencies,
  taskTemplates,
  taskTemplateDependencies,
  weddings,
  users,
  auditLogs,
} from "@/lib/db/schema";
import {
  TaskStatus,
  TaskPriority,
  PackageType,
} from "../types";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import { checkForCycles } from "./dependency-graph";
import { calculateDueDateFromOffset, previewDateShift } from "./backward-scheduler";

export interface TaskFilters {
  weddingId?: string;
  ownerId?: string;
  status?: TaskStatus;
  category?: string;
  priority?: TaskPriority;
  search?: string;
}

export async function getTasks(filters: TaskFilters = {}) {
  const conditions = [isNull(tasks.deletedAt)];

  if (filters.weddingId) {
    conditions.push(eq(tasks.weddingId, filters.weddingId));
  }
  if (filters.ownerId) {
    conditions.push(eq(tasks.ownerId, filters.ownerId));
  }
  if (filters.status) {
    conditions.push(eq(tasks.status, filters.status));
  }
  if (filters.category) {
    conditions.push(eq(tasks.category, filters.category));
  }
  if (filters.priority) {
    conditions.push(eq(tasks.priority, filters.priority));
  }
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(tasks.title, pattern),
        ilike(tasks.description, pattern),
        ilike(tasks.category, pattern)
      )!
    );
  }

  const taskRows = await db
    .select({
      task: tasks,
      owner: {
        id: users.id,
        fullName: users.name,
        email: users.email,
      },
      wedding: {
        id: weddings.id,
        title: weddings.title,
        startDate: weddings.startDate,
      },
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.ownerId, users.id))
    .innerJoin(weddings, eq(tasks.weddingId, weddings.id))
    .where(and(...conditions))
    .orderBy(tasks.dueAt);

  // Fetch dependencies for all returned tasks
  const taskIds = taskRows.map((r) => r.task.id);
  const deps =
    taskIds.length > 0
      ? await db
          .select({
            id: taskDependencies.id,
            taskId: taskDependencies.taskId,
            dependsOnTaskId: taskDependencies.dependsOnTaskId,
            dependsOnTitle: tasks.title,
            dependsOnStatus: tasks.status,
          })
          .from(taskDependencies)
          .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
          .where(inArray(taskDependencies.taskId, taskIds))
      : [];

  const depsByTaskId = new Map<string, any[]>();
  for (const dep of deps) {
    const list = depsByTaskId.get(dep.taskId) || [];
    list.push({
      id: dep.id,
      dependsOnTaskId: dep.dependsOnTaskId,
      dependsOnTaskTitle: dep.dependsOnTitle,
      dependsOnTaskStatus: dep.dependsOnStatus,
    });
    depsByTaskId.set(dep.taskId, list);
  }

  return taskRows.map(({ task, owner, wedding }) => ({
    ...task,
    owner: owner?.id ? owner : null,
    wedding,
    dependencies: depsByTaskId.get(task.id) || [],
  }));
}

export async function getTaskById(id: string) {
  const [row] = await db
    .select({
      task: tasks,
      owner: {
        id: users.id,
        fullName: users.name,
        email: users.email,
      },
      wedding: {
        id: weddings.id,
        title: weddings.title,
        startDate: weddings.startDate,
      },
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.ownerId, users.id))
    .innerJoin(weddings, eq(tasks.weddingId, weddings.id))
    .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
    .limit(1);

  if (!row) {
    throw new NotFoundError(`Task with ID '${id}' not found`);
  }

  // Fetch prerequisites (dependencies)
  const dependencies = await db
    .select({
      id: taskDependencies.id,
      dependsOnTaskId: taskDependencies.dependsOnTaskId,
      dependsOnTaskTitle: tasks.title,
      dependsOnTaskStatus: tasks.status,
    })
    .from(taskDependencies)
    .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
    .where(eq(taskDependencies.taskId, id));

  // Fetch downstream dependents
  const dependentTasks = await db
    .select({
      id: taskDependencies.id,
      taskId: taskDependencies.taskId,
      taskTitle: tasks.title,
    })
    .from(taskDependencies)
    .innerJoin(tasks, eq(taskDependencies.taskId, tasks.id))
    .where(eq(taskDependencies.dependsOnTaskId, id));

  return {
    ...row.task,
    owner: row.owner?.id ? row.owner : null,
    wedding: row.wedding,
    dependencies,
    dependentTasks,
  };
}

export async function createTask(data: {
  weddingId: string;
  eventId?: string | null;
  sourceTemplateId?: string | null;
  title: string;
  description?: string | null;
  category?: string;
  ownerId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  isCriticalPath?: boolean;
  dependsOnTaskIds?: string[];
}) {
  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        weddingId: data.weddingId,
        eventId: data.eventId,
        sourceTemplateId: data.sourceTemplateId,
        title: data.title,
        description: data.description,
        category: data.category || "General",
        ownerId: data.ownerId,
        status: data.status || "TO_PLAN",
        priority: data.priority || "MEDIUM",
        dueAt: new Date(data.dueAt),
        estimatedMinutes: data.estimatedMinutes || 60,
        actualMinutes: data.actualMinutes || 0,
        isCriticalPath: data.isCriticalPath || false,
      })
      .returning();

    // Link dependencies if provided
    if (data.dependsOnTaskIds && data.dependsOnTaskIds.length > 0) {
      // Validate acyclic
      const existingDeps = await tx
        .select({
          taskId: taskDependencies.taskId,
          dependsOnTaskId: taskDependencies.dependsOnTaskId,
        })
        .from(taskDependencies)
        .innerJoin(tasks, eq(taskDependencies.taskId, tasks.id))
        .where(eq(tasks.weddingId, data.weddingId));

      for (const depId of data.dependsOnTaskIds) {
        const cycle = checkForCycles(existingDeps, {
          taskId: created.id,
          dependsOnTaskId: depId,
        });
        if (cycle.hasCycle) {
          throw new ConflictError(
            `Circular dependency detected: Cannot add prerequisite task '${depId}'.`
          );
        }
      }

      await tx.insert(taskDependencies).values(
        data.dependsOnTaskIds.map((depId) => ({
          taskId: created.id,
          dependsOnTaskId: depId,
        }))
      );
    }

    return created;
  });
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    category: string;
    ownerId: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string;
    estimatedMinutes: number;
    actualMinutes: number;
    isCriticalPath: boolean;
  }>
) {
  const current = await getTaskById(id);

  // Auto-set completedAt timestamp if transitioning to DONE
  let completedAt = current.completedAt;
  if (data.status === "DONE" && current.status !== "DONE") {
    completedAt = new Date();
  } else if (data.status && data.status !== "DONE") {
    completedAt = null;
  }

  const [updated] = await db
    .update(tasks)
    .set({
      ...data,
      dueAt: data.dueAt ? new Date(data.dueAt) : current.dueAt,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  return updated;
}

export async function deleteTask(id: string) {
  await getTaskById(id);

  const [deleted] = await db
    .update(tasks)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  return deleted;
}

/**
 * Adds an explicit dependency link from taskId to dependsOnTaskId.
 * Strictly verifies the dependency graph is acyclic before inserting.
 */
export async function addDependency(taskId: string, dependsOnTaskId: string) {
  if (taskId === dependsOnTaskId) {
    throw new ValidationError("A task cannot depend on itself");
  }

  const task = await getTaskById(taskId);
  await getTaskById(dependsOnTaskId);

  // Fetch all existing dependency edges for this wedding
  const existingEdges = await db
    .select({
      taskId: taskDependencies.taskId,
      dependsOnTaskId: taskDependencies.dependsOnTaskId,
    })
    .from(taskDependencies)
    .innerJoin(tasks, eq(taskDependencies.taskId, tasks.id))
    .where(eq(tasks.weddingId, task.weddingId));

  // Check for cycle
  const cycleResult = checkForCycles(existingEdges, {
    taskId,
    dependsOnTaskId,
  });

  if (cycleResult.hasCycle) {
    throw new ConflictError(
      `Circular dependency rejected: Adding this dependency would create a cycle (${cycleResult.cyclePath?.join(
        " → "
      )}).`
    );
  }

  const [created] = await db
    .insert(taskDependencies)
    .values({
      taskId,
      dependsOnTaskId,
    })
    .returning();

  return created;
}

export async function removeDependency(taskId: string, dependsOnTaskId: string) {
  return await db
    .delete(taskDependencies)
    .where(
      and(
        eq(taskDependencies.taskId, taskId),
        eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
      )
    );
}

/**
 * Instantiates tasks from database-driven templates for a wedding.
 * Generates at least 25 tasks for a full destination wedding.
 */
export async function generateTasksForWedding(
  weddingId: string,
  packageType: PackageType = "FULL_SERVICE",
  assignedPlannerId?: string | null
) {
  const [wedding] = await db
    .select()
    .from(weddings)
    .where(eq(weddings.id, weddingId))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError(`Wedding with ID '${weddingId}' not found`);
  }

  const plannerId = assignedPlannerId || wedding.assignedPlannerId;

  // Fetch matching templates from database
  const templates = await db
    .select()
    .from(taskTemplates)
    .where(
      or(
        eq(taskTemplates.packageType, packageType),
        isNull(taskTemplates.packageType)
      )
    )
    .orderBy(desc(taskTemplates.offsetDays));

  if (templates.length === 0) {
    return [];
  }

  return await db.transaction(async (tx) => {
    // Map template ID to created task ID
    const templateToTaskMap = new Map<string, string>();
    const createdTasks = [];

    for (const tmpl of templates) {
      const dueAt = calculateDueDateFromOffset(
        wedding.startDate || new Date().toISOString(),
        tmpl.offsetDays
      );

      const [task] = await tx
        .insert(tasks)
        .values({
          weddingId: wedding.id,
          sourceTemplateId: tmpl.id,
          title: tmpl.title,
          description: tmpl.description,
          category: tmpl.category,
          ownerId: plannerId,
          status: "TO_PLAN",
          priority: tmpl.defaultPriority,
          dueAt,
          estimatedMinutes: tmpl.estimatedMinutes,
          actualMinutes: 0,
          isCriticalPath: tmpl.offsetDays <= -30 && tmpl.defaultPriority === "HIGH",
        })
        .returning();

      templateToTaskMap.set(tmpl.id, task.id);
      createdTasks.push(task);
    }

    // Copy template dependencies
    const templateDeps = await tx.select().from(taskTemplateDependencies);
    const depsToInsert: Array<{ taskId: string; dependsOnTaskId: string }> = [];

    for (const dep of templateDeps) {
      const taskId = templateToTaskMap.get(dep.templateId);
      const dependsOnId = templateToTaskMap.get(dep.dependsOnTemplateId);

      if (taskId && dependsOnId) {
        depsToInsert.push({
          taskId,
          dependsOnTaskId: dependsOnId,
        });
      }
    }

    if (depsToInsert.length > 0) {
      await tx.insert(taskDependencies).values(depsToInsert);
    }

    return createdTasks;
  });
}

/**
 * Previews or confirms date shifting for all backward-scheduled wedding tasks.
 */
export async function handleDateShift(
  weddingId: string,
  newStartDate: string,
  apply = false,
  actorId?: string
) {
  const [wedding] = await db
    .select()
    .from(weddings)
    .where(eq(weddings.id, weddingId))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError(`Wedding with ID '${weddingId}' not found`);
  }

  const currentTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.weddingId, weddingId), isNull(tasks.deletedAt)));

  const preview = previewDateShift(
    weddingId,
    wedding.startDate || new Date().toISOString(),
    newStartDate,
    currentTasks as any
  );

  if (!apply) {
    return preview;
  }

  // Apply shifts in transaction
  await db.transaction(async (tx) => {
    for (const item of preview.affectedTasks) {
      await tx
        .update(tasks)
        .set({
          dueAt: new Date(item.newDueAt),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, item.taskId));
    }

    await tx
      .update(weddings)
      .set({
        startDate: newStartDate,
        updatedAt: new Date(),
      })
      .where(eq(weddings.id, weddingId));

    if (actorId) {
      await tx.insert(auditLogs).values({
        actorId,
        entityType: "wedding",
        entityId: weddingId,
        action: "wedding.dates_shifted",
        oldValue: { startDate: wedding.startDate },
        newValue: {
          startDate: newStartDate,
          shiftDays: preview.shiftDays,
          tasksUpdated: preview.totalTasks,
        },
        reason: `Shifted wedding dates by ${preview.shiftDays} days. ${preview.totalTasks} tasks rescheduled.`,
      });
    }
  });

  return preview;
}

/**
 * Generates planner workload metrics across all active weddings.
 */
export async function getTeamWorkload() {
  const planners = await db
    .select({
      id: users.id,
      fullName: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      or(eq(users.role, "PLANNER"), eq(users.role, "FOUNDER_ADMIN"))
    );

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const workloadResults = await Promise.all(
    planners.map(async (planner) => {
      const plannerTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.ownerId, planner.id), isNull(tasks.deletedAt)));

      const activeTasks = plannerTasks.filter((t) => t.status !== "DONE");
      const overdueTasks = activeTasks.filter((t) => new Date(t.dueAt) < now);
      const atRiskTasks = activeTasks.filter((t) => {
        const d = new Date(t.dueAt);
        return d >= now && d <= sevenDaysFromNow;
      });
      const completedTasks = plannerTasks.filter((t) => t.status === "DONE");

      const totalEstimatedMinutes = activeTasks.reduce(
        (sum, t) => sum + (t.estimatedMinutes || 0),
        0
      );
      const totalActualMinutes = plannerTasks.reduce(
        (sum, t) => sum + (t.actualMinutes || 0),
        0
      );

      // Unique weddings assigned
      const assignedWeddings = new Set(plannerTasks.map((t) => t.weddingId));

      return {
        plannerId: planner.id,
        plannerName: planner.fullName,
        plannerEmail: planner.email,
        activeWeddingsCount: assignedWeddings.size,
        totalTasksCount: plannerTasks.length,
        activeTasksCount: activeTasks.length,
        overdueTasksCount: overdueTasks.length,
        atRiskTasksCount: atRiskTasks.length,
        completedTasksCount: completedTasks.length,
        totalEstimatedMinutes,
        totalActualMinutes,
      };
    })
  );

  return workloadResults;
}
