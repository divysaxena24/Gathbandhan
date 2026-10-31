import {
  AffectedCascadeItem,
  CascadeImpactAnalysis,
} from "../types";

export interface TimelineNode {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  isKeyMoment: boolean;
  vendorName?: string | null;
}

export interface DependencyEdge {
  timelineItemId: string; // The dependent item (child)
  dependsOnItemId: string; // The prerequisite item (parent)
  bufferMinutes: number;
}

/**
 * Calculates deterministic delay cascade impact across event timeline dependencies.
 *
 * Traversal semantics:
 * - A dependency specifies: `timelineItemId` depends on `dependsOnItemId` with `bufferMinutes`.
 * - When `dependsOnItemId` is delayed by `delayMinutes`, its projected end time moves later.
 * - If `parent.projectedEnd + bufferMinutes > child.startsAt`, the child must shift.
 * - The shift cascades downstream recursively through the directed acyclic graph.
 */
export function calculateCascadeImpact(
  items: TimelineNode[],
  dependencies: DependencyEdge[],
  delayedItemId: string,
  delayMinutes: number
): CascadeImpactAnalysis {
  const itemMap = new Map<string, TimelineNode>();
  items.forEach((item) => itemMap.set(item.id, item));

  const targetItem = itemMap.get(delayedItemId);
  if (!targetItem) {
    throw new Error(`Timeline item ${delayedItemId} not found`);
  }

  // Build adjacency list: parent -> children (predecessor -> dependents)
  const childrenMap = new Map<
    string,
    Array<{ childId: string; bufferMinutes: number }>
  >();

  dependencies.forEach((dep) => {
    const list = childrenMap.get(dep.dependsOnItemId) || [];
    list.push({ childId: dep.timelineItemId, bufferMinutes: dep.bufferMinutes });
    childrenMap.set(dep.dependsOnItemId, list);
  });

  // Track projected times and shift deltas for all items
  const projectedTimes = new Map<
    string,
    {
      projectedStart: Date;
      projectedEnd: Date;
      shiftMinutes: number;
      cause: string;
    }
  >();

  // Initialize the trigger delayed item
  const initialNewStart = new Date(targetItem.startsAt.getTime() + delayMinutes * 60000);
  const initialNewEnd = new Date(targetItem.endsAt.getTime() + delayMinutes * 60000);

  projectedTimes.set(delayedItemId, {
    projectedStart: initialNewStart,
    projectedEnd: initialNewEnd,
    shiftMinutes: delayMinutes,
    cause: `Primary delay of ${delayMinutes}m entered by coordinator`,
  });

  // Queue-based BFS propagation to push delays downstream
  const queue: string[] = [delayedItemId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentParentId = queue.shift()!;
    visited.add(currentParentId);

    const parentInfo = projectedTimes.get(currentParentId)!;
    const parentNode = itemMap.get(currentParentId)!;
    const children = childrenMap.get(currentParentId) || [];

    for (const { childId, bufferMinutes } of children) {
      const childNode = itemMap.get(childId);
      if (!childNode) continue;

      // Earliest time the child can start is parent's projected end + buffer
      const earliestChildStartMs =
        parentInfo.projectedEnd.getTime() + bufferMinutes * 60000;

      const currentChildStartMs = childNode.startsAt.getTime();
      const existingChildProjection = projectedTimes.get(childId);

      const effectiveChildStartMs = existingChildProjection
        ? existingChildProjection.projectedStart.getTime()
        : currentChildStartMs;

      if (earliestChildStartMs > effectiveChildStartMs) {
        // Child is forced to shift!
        const shiftMinutes = Math.ceil(
          (earliestChildStartMs - currentChildStartMs) / 60000
        );

        const durationMs = childNode.endsAt.getTime() - childNode.startsAt.getTime();
        const projectedStart = new Date(earliestChildStartMs);
        const projectedEnd = new Date(earliestChildStartMs + durationMs);

        const bufferNote =
          bufferMinutes > 0 ? ` plus ${bufferMinutes}m required buffer` : "";

        projectedTimes.set(childId, {
          projectedStart,
          projectedEnd,
          shiftMinutes,
          cause: `Delayed by ${shiftMinutes}m: Predecessor '${parentNode.title}' delayed to ${formatTime(
            parentInfo.projectedEnd
          )}${bufferNote}`,
        });

        // Continue downstream propagation
        queue.push(childId);
      }
    }
  }

  // Assemble list of affected downstream items (excluding the initial triggered item)
  const affectedItems: AffectedCascadeItem[] = [];
  let criticalMomentsAffected = 0;

  for (const [id, projection] of projectedTimes.entries()) {
    if (id === delayedItemId) continue;
    const node = itemMap.get(id)!;
    if (projection.shiftMinutes > 0) {
      if (node.isKeyMoment) {
        criticalMomentsAffected++;
      }

      affectedItems.push({
        itemId: id,
        title: node.title,
        originalStartsAt: node.startsAt.toISOString(),
        originalEndsAt: node.endsAt.toISOString(),
        projectedStartsAt: projection.projectedStart.toISOString(),
        projectedEndsAt: projection.projectedEnd.toISOString(),
        delayShiftMinutes: projection.shiftMinutes,
        isKeyMoment: node.isKeyMoment,
        reason: projection.cause,
      });
    }
  }

  // Sort affected items chronologically by projected start
  affectedItems.sort(
    (a, b) =>
      new Date(a.projectedStartsAt).getTime() -
      new Date(b.projectedStartsAt).getTime()
  );

  // Generate deterministic tactical recommendations
  const recoveryRecommendations: string[] = [];

  if (delayMinutes <= 15) {
    recoveryRecommendations.push(
      "Minor delay (≤ 15m): Can be absorbed through natural stage transition compression without notifying guests."
    );
  } else if (delayMinutes <= 30) {
    recoveryRecommendations.push(
      "Moderate delay (15-30m): Instruct Emcee to extend welcoming remarks and request Catering to serve welcome beverages."
    );
  } else {
    recoveryRecommendations.push(
      "Major delay (> 30m): Activate contingency protocol, adjust photographer shot list, and synchronize banquet captain."
    );
  }

  if (criticalMomentsAffected > 0) {
    const keyMomentTitles = affectedItems
      .filter((i) => i.isKeyMoment)
      .map((i) => `'${i.title}' (+${i.delayShiftMinutes}m)`)
      .join(", ");

    recoveryRecommendations.push(
      `CRITICAL ALERT: ${criticalMomentsAffected} key moment(s) shifted: ${keyMomentTitles}. Alert Pandit / VIP family and prioritize fast-track transition.`
    );
  }

  const itemsWithBuffer = dependencies.filter(
    (d) => d.dependsOnItemId === delayedItemId && d.bufferMinutes > 0
  );
  if (itemsWithBuffer.length > 0) {
    recoveryRecommendations.push(
      `Buffer recovery option: Compress existing buffer (${itemsWithBuffer[0].bufferMinutes}m) before downstream activities to reduce delay impact.`
    );
  }

  return {
    delayedItemId,
    delayedItemTitle: targetItem.title,
    delayMinutes,
    affectedItems,
    criticalMomentsAffected,
    recoveryRecommendations,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
