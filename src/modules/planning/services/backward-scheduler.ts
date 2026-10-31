import { DateShiftPreview, Task } from "../types";

/**
 * Calculates a task due date backward from the anchor wedding date using offset days.
 */
export function calculateDueDateFromOffset(
  anchorDate: string | Date,
  offsetDays: number
): Date {
  const base = new Date(anchorDate);
  const due = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  due.setDate(due.getDate() + offsetDays);
  return due;
}

/**
 * Calculates a preview of what happens to all wedding tasks if the wedding date is shifted.
 * Previews before committing any updates to the database.
 */
export function previewDateShift(
  weddingId: string,
  previousStartDate: string,
  newStartDate: string,
  currentTasks: Task[]
): DateShiftPreview {
  const prevDate = new Date(previousStartDate);
  const nextDate = new Date(newStartDate);

  // Calculate difference in whole days
  const diffTime = nextDate.getTime() - prevDate.getTime();
  const shiftDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let atRiskCount = 0;
  let overdueCount = 0;

  const affectedTasks = currentTasks.map((task) => {
    const curDue = new Date(task.dueAt);
    const newDue = new Date(curDue.getTime() + shiftDays * 24 * 60 * 60 * 1000);

    const isDone = task.status === "DONE";
    const isOverdue = !isDone && newDue < now;
    const isAtRisk = !isDone && newDue >= now && newDue <= sevenDaysFromNow;

    if (isOverdue) overdueCount++;
    if (isAtRisk) atRiskCount++;

    return {
      taskId: task.id,
      title: task.title,
      category: task.category,
      currentDueAt: curDue.toISOString(),
      newDueAt: newDue.toISOString(),
      isOverdue,
      isAtRisk,
    };
  });

  return {
    weddingId,
    previousStartDate,
    newStartDate,
    shiftDays,
    totalTasks: currentTasks.length,
    affectedTasks,
    atRiskCount,
    overdueCount,
  };
}
