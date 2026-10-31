import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, tasks, weddings } from "@/lib/db/schema";
import { TeamWorkloadMetrics } from "../types";

/**
 * Computes capacity and workload metrics across wedding planning personnel.
 * Answers: Which employees are overloaded?
 */
export async function getTeamWorkloadMetrics(): Promise<TeamWorkloadMetrics[]> {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      or(
        eq(users.role, "PLANNER"),
        eq(users.role, "ONSITE_COORDINATOR"),
        eq(users.role, "FINANCE"),
        eq(users.role, "FOUNDER_ADMIN")
      )
    );

  const allWeddings = await db
    .select({
      id: weddings.id,
      assignedPlannerId: weddings.assignedPlannerId,
      lifecycle: weddings.lifecycleStatus,
    })
    .from(weddings)
    .where(isNull(weddings.deletedAt));

  const allTasks = await db
    .select({
      id: tasks.id,
      assigneeId: tasks.ownerId,
      status: tasks.status,
      dueAt: tasks.dueAt,
    })
    .from(tasks);

  const now = new Date();

  const results: TeamWorkloadMetrics[] = [];

  for (const u of allUsers) {
    const activeWeddings = allWeddings.filter(
      (w) =>
        w.assignedPlannerId === u.id &&
        (w.lifecycle === "PLANNING" || w.lifecycle === "ACTIVE")
    );

    const userTasks = allTasks.filter((t) => t.assigneeId === u.id);
    const inProgressTasks = userTasks.filter((t) => t.status === "IN_PROGRESS");
    const completedTasks = userTasks.filter((t) => t.status === "DONE");
    const overdueTasks = userTasks.filter(
      (t) => t.status !== "DONE" && new Date(t.dueAt) < now
    );

    // Overloaded rule: > 15 active tasks OR > 3 overdue tasks OR > 4 concurrent active weddings
    let workloadStatus: "BALANCED" | "HIGH" | "OVERLOADED" = "BALANCED";
    if (
      userTasks.length - completedTasks.length > 15 ||
      overdueTasks.length >= 3 ||
      activeWeddings.length >= 4
    ) {
      workloadStatus = "OVERLOADED";
    } else if (
      userTasks.length - completedTasks.length >= 8 ||
      overdueTasks.length >= 1 ||
      activeWeddings.length >= 2
    ) {
      workloadStatus = "HIGH";
    }

    results.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      activeWeddingsCount: activeWeddings.length,
      totalAssignedTasks: userTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      completedTasks: completedTasks.length,
      workloadStatus,
    });
  }

  // Sort overloaded to the top
  const statusWeight = { OVERLOADED: 3, HIGH: 2, BALANCED: 1 };
  return results.sort(
    (a, b) => statusWeight[b.workloadStatus] - statusWeight[a.workloadStatus]
  );
}
