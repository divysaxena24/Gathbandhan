import {
  packageTypeEnum,
  taskStatusEnum,
} from "@/lib/db/schema/enums";

export type PackageType = (typeof packageTypeEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TaskTemplate {
  id: string;
  packageType: PackageType | null;
  category: string;
  title: string;
  description: string | null;
  defaultPriority: TaskPriority;
  offsetDays: number;
  referenceEvent: string;
  estimatedMinutes: number;
  suggestedRole: string;
  createdAt: Date;
  updatedAt: Date;
  dependencyIds?: string[];
}

export interface Task {
  id: string;
  weddingId: string;
  eventId: string | null;
  sourceTemplateId: string | null;
  title: string;
  description: string | null;
  category: string;
  ownerId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date;
  estimatedMinutes: number;
  actualMinutes: number;
  completedAt: Date | null;
  isCriticalPath: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  wedding?: {
    id: string;
    title: string;
    startDate: string;
  } | null;
  dependencies?: Array<{
    id: string;
    dependsOnTaskId: string;
    dependsOnTaskTitle?: string;
    dependsOnTaskStatus?: TaskStatus;
  }>;
  dependentTasks?: Array<{
    id: string;
    taskId: string;
    taskTitle?: string;
  }>;
}

export interface CycleCheckResult {
  hasCycle: boolean;
  cyclePath?: string[];
}

export interface ScheduleImpact {
  affectedTaskId: string;
  taskTitle: string;
  currentDueAt: Date;
  projectedDueAt: Date;
  delayDays: number;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
}

export interface DateShiftPreview {
  weddingId: string;
  previousStartDate: string;
  newStartDate: string;
  shiftDays: number;
  totalTasks: number;
  affectedTasks: Array<{
    taskId: string;
    title: string;
    category: string;
    currentDueAt: string;
    newDueAt: string;
    isOverdue: boolean;
    isAtRisk: boolean;
  }>;
  atRiskCount: number;
  overdueCount: number;
}

export interface PlannerWorkload {
  plannerId: string;
  plannerName: string;
  plannerEmail: string;
  activeWeddingsCount: number;
  totalTasksCount: number;
  overdueTasksCount: number;
  atRiskTasksCount: number;
  completedTasksCount: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
}

