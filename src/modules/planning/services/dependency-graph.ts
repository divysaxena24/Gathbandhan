import { CycleCheckResult, ScheduleImpact, Task } from "../types";

export interface DependencyEdge {
  taskId: string;        // Dependent task
  dependsOnTaskId: string; // Prerequisite task
}

/**
 * Builds an adjacency list where key is task and value is array of tasks it depends on.
 */
export function buildAdjacencyList(edges: DependencyEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adj.get(edge.taskId) || [];
    list.push(edge.dependsOnTaskId);
    adj.set(edge.taskId, list);
  }
  return adj;
}

/**
 * Builds a reverse adjacency list where key is prerequisite task and value is array of tasks that depend on it.
 */
export function buildReverseAdjacencyList(edges: DependencyEdge[]): Map<string, string[]> {
  const reverse = new Map<string, string[]>();
  for (const edge of edges) {
    const list = reverse.get(edge.dependsOnTaskId) || [];
    list.push(edge.taskId);
    reverse.set(edge.dependsOnTaskId, list);
  }
  return reverse;
}

/**
 * Validates whether adding a proposed dependency edge (taskId depends on dependsOnTaskId)
 * would create a circular dependency cycle.
 *
 * A cycle is formed if there is already a path from dependsOnTaskId to taskId.
 */
export function checkForCycles(
  existingEdges: DependencyEdge[],
  newEdge: DependencyEdge
): CycleCheckResult {
  // If a task depends on itself, immediate cycle
  if (newEdge.taskId === newEdge.dependsOnTaskId) {
    return {
      hasCycle: true,
      cyclePath: [newEdge.taskId, newEdge.taskId],
    };
  }

  const allEdges = [...existingEdges, newEdge];
  const adj = buildAdjacencyList(allEdges);

  // Cycle detection via DFS with 3-color marking (0 = unvisited, 1 = visiting, 2 = visited)
  const state = new Map<string, number>();
  const parent = new Map<string, string>();
  let cyclePath: string[] = [];
  let foundCycle = false;

  function dfs(node: string, path: string[]) {
    if (foundCycle) return;
    state.set(node, 1); // visiting
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (foundCycle) return;
      const neighborState = state.get(neighbor) || 0;

      if (neighborState === 1) {
        // Found back-edge -> Cycle detected!
        foundCycle = true;
        const cycleStartIndex = path.indexOf(neighbor);
        cyclePath = [...path.slice(cycleStartIndex), neighbor];
        return;
      }

      if (neighborState === 0) {
        parent.set(neighbor, node);
        dfs(neighbor, path);
      }
    }

    path.pop();
    state.set(node, 2); // visited
  }

  // Check from all nodes
  const allNodes = new Set<string>();
  for (const edge of allEdges) {
    allNodes.add(edge.taskId);
    allNodes.add(edge.dependsOnTaskId);
  }

  for (const node of allNodes) {
    if ((state.get(node) || 0) === 0) {
      dfs(node, []);
      if (foundCycle) break;
    }
  }

  return {
    hasCycle: foundCycle,
    cyclePath: foundCycle ? cyclePath : undefined,
  };
}

/**
 * Performs a topological sort of tasks based on their dependencies.
 * Returns tasks in execution order (prerequisites first).
 */
export function topologicalSortTasks<T extends { id: string }>(
  tasks: T[],
  edges: DependencyEdge[]
): T[] {
  const inDegree = new Map<string, number>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
  }

  // Count incoming dependencies
  for (const edge of edges) {
    inDegree.set(edge.taskId, (inDegree.get(edge.taskId) || 0) + 1);
  }

  // Queue of tasks with 0 dependencies
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const resultIds: string[] = [];
  const reverseAdj = buildReverseAdjacencyList(edges);

  while (queue.length > 0) {
    const current = queue.shift()!;
    resultIds.push(current);

    const dependents = reverseAdj.get(current) || [];
    for (const dep of dependents) {
      const newDeg = (inDegree.get(dep) || 1) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) {
        queue.push(dep);
      }
    }
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const sorted: T[] = [];
  for (const id of resultIds) {
    const task = taskMap.get(id);
    if (task) sorted.push(task);
  }

  // Append any disconnected tasks
  for (const task of tasks) {
    if (!resultIds.includes(task.id)) {
      sorted.push(task);
    }
  }

  return sorted;
}

/**
 * Calculates downstream schedule impact when a task is delayed.
 * Recursively identifies all affected successor tasks and projects shifted dates.
 */
export function calculateScheduleImpact(
  delayedTaskId: string,
  delayDays: number,
  allTasks: Task[],
  edges: DependencyEdge[]
): ScheduleImpact[] {
  if (delayDays <= 0) return [];

  const reverseAdj = buildReverseAdjacencyList(edges);
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  const delayedTask = taskMap.get(delayedTaskId);

  if (!delayedTask) return [];

  const impacts: ScheduleImpact[] = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; cumulativeDelay: number; parentTitle: string }> = [
    { id: delayedTaskId, cumulativeDelay: delayDays, parentTitle: delayedTask.title },
  ];

  while (queue.length > 0) {
    const { id, cumulativeDelay, parentTitle } = queue.shift()!;
    const dependents = reverseAdj.get(id) || [];

    for (const depId of dependents) {
      if (visited.has(depId)) continue;
      visited.add(depId);

      const depTask = taskMap.get(depId);
      if (!depTask) continue;

      const currentDueAt = new Date(depTask.dueAt);
      const projectedDueAt = new Date(currentDueAt.getTime() + cumulativeDelay * 24 * 60 * 60 * 1000);

      let criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
      if (depTask.isCriticalPath || depTask.priority === "CRITICAL") {
        criticality = "CRITICAL";
      } else if (cumulativeDelay >= 7) {
        criticality = "HIGH";
      }

      impacts.push({
        affectedTaskId: depTask.id,
        taskTitle: depTask.title,
        currentDueAt,
        projectedDueAt,
        delayDays: cumulativeDelay,
        criticality,
        reason: `Dependent on '${parentTitle}', which is delayed by ${cumulativeDelay} days.`,
      });

      queue.push({
        id: depId,
        cumulativeDelay,
        parentTitle: depTask.title,
      });
    }
  }

  return impacts;
}
