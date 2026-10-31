export type TimelineItemStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DELAYED"
  | "CANCELLED";

export type CheckInStatus =
  | "EXPECTED"
  | "ARRIVED"
  | "SETUP_COMPLETE"
  | "WORKING"
  | "COMPLETED"
  | "LATE"
  | "NO_SHOW";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus = "OPEN" | "INVESTIGATING" | "RESOLVED";

export type CheckInSource = "QR_SCAN" | "WEB_LINK" | "COORDINATOR_MANUAL";

export interface TimelineItemWithDeps {
  id: string;
  weddingId: string;
  eventId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  ownerId: string | null;
  ownerName?: string | null;
  vendorId: string | null;
  vendorName?: string | null;
  weddingVendorId: string | null;
  status: TimelineItemStatus;
  isKeyMoment: boolean;
  location: string | null;
  orderIndex: number;
  actualStartsAt: Date | null;
  actualEndsAt: Date | null;
  delayMinutes: number;
  notes: string | null;
  prerequisites: Array<{
    id: string;
    timelineItemId: string;
    dependsOnItemId: string;
    dependsOnTitle: string;
    bufferMinutes: number;
  }>;
}

export interface AffectedCascadeItem {
  itemId: string;
  title: string;
  originalStartsAt: string;
  originalEndsAt: string;
  projectedStartsAt: string;
  projectedEndsAt: string;
  delayShiftMinutes: number;
  isKeyMoment: boolean;
  reason: string;
}

export interface CascadeImpactAnalysis {
  delayedItemId: string;
  delayedItemTitle: string;
  delayMinutes: number;
  affectedItems: AffectedCascadeItem[];
  criticalMomentsAffected: number;
  recoveryRecommendations: string[];
}

export interface VendorCheckInRecord {
  id: string;
  weddingVendorId: string;
  weddingId: string;
  eventId: string | null;
  vendorId: string;
  vendorName: string;
  category: string;
  contactName: string | null;
  contactPhone: string | null;
  expectedArrivalAt: Date;
  graceMinutes: number;
  status: CheckInStatus;
  arrivedAt: Date | null;
  setupCompletedAt: Date | null;
  completedAt: Date | null;
  checkInSource: string | null;
  checkedInBy: string | null;
  notes: string | null;
  rawToken: string;
  lateAlertSentAt: Date | null;
  eventName?: string | null;
}

export interface LateCheckResult {
  evaluatedCount: number;
  newlyLateCount: number;
  lateVendors: Array<{
    checkInId: string;
    vendorName: string;
    category: string;
    expectedArrivalAt: string;
    graceMinutes: number;
    minutesLate: number;
  }>;
  alertsGenerated: number;
}

export interface PublicVendorPass {
  valid: boolean;
  checkInId: string;
  vendorName: string;
  category: string;
  contactName: string | null;
  weddingTitle: string;
  weddingCity: string | null;
  weddingVenue: string | null;
  eventName: string | null;
  eventVenue: string | null;
  expectedArrivalAt: string;
  graceMinutes: number;
  status: CheckInStatus;
  arrivedAt: string | null;
  setupCompletedAt: string | null;
  completedAt: string | null;
  allowedActions: CheckInStatus[];
}

export interface IncidentRecord {
  id: string;
  weddingId: string;
  eventId: string | null;
  eventName?: string | null;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  ownerId: string | null;
  ownerName?: string | null;
  vendorId: string | null;
  vendorName?: string | null;
  reportedBy: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  costImpactPaise: bigint;
}

export interface ControlRoomAlertRecord {
  id: string;
  weddingId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isDismissed: boolean;
  dismissedAt: Date | null;
  createdAt: Date;
}
