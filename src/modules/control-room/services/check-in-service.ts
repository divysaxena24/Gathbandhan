import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  vendorCheckIns,
  weddingVendors,
  vendors,
  weddings,
  weddingEvents,
  controlRoomAlerts,
} from "@/lib/db/schema";
import {
  CheckInStatus,
  LateCheckResult,
  PublicVendorPass,
  VendorCheckInRecord,
} from "../types";
import { NotFoundError } from "@/lib/errors";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Ensures all vendors assigned to a wedding have a secure check-in pass.
 * Generates an opaque random token, stores its SHA-256 hash for authentication,
 * and preserves raw token for QR generation.
 */
export async function generateCheckInTokensForWedding(
  weddingId: string
): Promise<VendorCheckInRecord[]> {
  const assignments = await db
    .select({
      id: weddingVendors.id,
      weddingId: weddingVendors.weddingId,
      eventId: weddingVendors.eventId,
      vendorId: weddingVendors.vendorId,
      expectedArrivalAt: weddingVendors.expectedArrivalAt,
      graceMinutes: weddingVendors.graceMinutes,
    })
    .from(weddingVendors)
    .where(eq(weddingVendors.weddingId, weddingId));

  for (const assignment of assignments) {
    const existing = await db
      .select({ id: vendorCheckIns.id })
      .from(vendorCheckIns)
      .where(eq(vendorCheckIns.weddingVendorId, assignment.id))
      .limit(1);

    if (existing.length === 0) {
      const rawToken = crypto.randomBytes(16).toString("hex");
      const tokenHash = hashToken(rawToken);

      const defaultArrival =
        assignment.expectedArrivalAt ||
        new Date(Date.now() + 2 * 60 * 60 * 1000);

      await db.insert(vendorCheckIns).values({
        weddingVendorId: assignment.id,
        weddingId: assignment.weddingId,
        eventId: assignment.eventId,
        rawToken,
        tokenHash,
        expectedArrivalAt: defaultArrival,
        graceMinutes: assignment.graceMinutes || 15,
        status: "EXPECTED",
      });
    }
  }

  return getCheckInsForWedding(weddingId);
}

/**
 * Retrieves all vendor check-in records for a wedding with joined vendor details.
 */
export async function getCheckInsForWedding(
  weddingId: string
): Promise<VendorCheckInRecord[]> {
  const records = await db
    .select({
      id: vendorCheckIns.id,
      weddingVendorId: vendorCheckIns.weddingVendorId,
      weddingId: vendorCheckIns.weddingId,
      eventId: vendorCheckIns.eventId,
      vendorId: vendors.id,
      vendorName: vendors.name,
      category: vendors.category,
      contactName: vendors.contactName,
      contactPhone: vendors.phone,
      expectedArrivalAt: vendorCheckIns.expectedArrivalAt,
      graceMinutes: vendorCheckIns.graceMinutes,
      status: vendorCheckIns.status,
      arrivedAt: vendorCheckIns.arrivedAt,
      setupCompletedAt: vendorCheckIns.setupCompletedAt,
      completedAt: vendorCheckIns.completedAt,
      checkInSource: vendorCheckIns.checkInSource,
      checkedInBy: vendorCheckIns.checkedInBy,
      notes: vendorCheckIns.notes,
      rawToken: vendorCheckIns.rawToken,
      lateAlertSentAt: vendorCheckIns.lateAlertSentAt,
      eventName: weddingEvents.name,
    })
    .from(vendorCheckIns)
    .innerJoin(
      weddingVendors,
      eq(vendorCheckIns.weddingVendorId, weddingVendors.id)
    )
    .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .leftJoin(weddingEvents, eq(vendorCheckIns.eventId, weddingEvents.id))
    .where(eq(vendorCheckIns.weddingId, weddingId));

  return records;
}

/**
 * Public pass verification for mobile gate check-in page.
 * Authenticates via SHA-256 hash of the token.
 */
export async function getPublicCheckInPass(
  token: string
): Promise<PublicVendorPass> {
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      checkInId: vendorCheckIns.id,
      vendorName: vendors.name,
      category: vendors.category,
      contactName: vendors.contactName,
      weddingTitle: weddings.title,
      weddingCity: weddings.city,
      weddingVenue: weddings.venue,
      eventName: weddingEvents.name,
      eventVenue: weddingEvents.venue,
      expectedArrivalAt: vendorCheckIns.expectedArrivalAt,
      graceMinutes: vendorCheckIns.graceMinutes,
      status: vendorCheckIns.status,
      arrivedAt: vendorCheckIns.arrivedAt,
      setupCompletedAt: vendorCheckIns.setupCompletedAt,
      completedAt: vendorCheckIns.completedAt,
    })
    .from(vendorCheckIns)
    .innerJoin(
      weddingVendors,
      eq(vendorCheckIns.weddingVendorId, weddingVendors.id)
    )
    .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .innerJoin(weddings, eq(vendorCheckIns.weddingId, weddings.id))
    .leftJoin(weddingEvents, eq(vendorCheckIns.eventId, weddingEvents.id))
    .where(eq(vendorCheckIns.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    throw new NotFoundError("Invalid or expired check-in pass token");
  }

  // Calculate allowed state transitions based on current status
  const allowedActions: CheckInStatus[] = [];
  if (row.status === "EXPECTED" || row.status === "LATE") {
    allowedActions.push("ARRIVED");
  } else if (row.status === "ARRIVED") {
    allowedActions.push("SETUP_COMPLETE", "WORKING");
  } else if (row.status === "SETUP_COMPLETE") {
    allowedActions.push("WORKING", "COMPLETED");
  } else if (row.status === "WORKING") {
    allowedActions.push("COMPLETED");
  }

  return {
    valid: true,
    checkInId: row.checkInId,
    vendorName: row.vendorName,
    category: row.category,
    contactName: row.contactName,
    weddingTitle: row.weddingTitle,
    weddingCity: row.weddingCity,
    weddingVenue: row.weddingVenue,
    eventName: row.eventName,
    eventVenue: row.eventVenue,
    expectedArrivalAt: row.expectedArrivalAt.toISOString(),
    graceMinutes: row.graceMinutes,
    status: row.status as CheckInStatus,
    arrivedAt: row.arrivedAt ? row.arrivedAt.toISOString() : null,
    setupCompletedAt: row.setupCompletedAt
      ? row.setupCompletedAt.toISOString()
      : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    allowedActions,
  };
}

/**
 * Submits a public state transition from the vendor's mobile device.
 */
export async function submitPublicCheckIn(
  token: string,
  newStatus: CheckInStatus,
  notes?: string,
  checkedInBy?: string
): Promise<PublicVendorPass> {
  const tokenHash = hashToken(token);

  const [existing] = await db
    .select({ id: vendorCheckIns.id, status: vendorCheckIns.status })
    .from(vendorCheckIns)
    .where(eq(vendorCheckIns.tokenHash, tokenHash))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Invalid or expired check-in token");
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: newStatus,
    checkInSource: "QR_SCAN",
    updatedAt: now,
  };

  if (checkedInBy) {
    updateData.checkedInBy = checkedInBy;
  }
  if (notes) {
    updateData.notes = notes;
  }

  if (newStatus === "ARRIVED") {
    updateData.arrivedAt = now;
  } else if (newStatus === "SETUP_COMPLETE") {
    updateData.setupCompletedAt = now;
  } else if (newStatus === "COMPLETED") {
    updateData.completedAt = now;
  }

  await db
    .update(vendorCheckIns)
    .set(updateData)
    .where(eq(vendorCheckIns.id, existing.id));

  return getPublicCheckInPass(token);
}

/**
 * Coordinator manual status override from the Control Room dashboard.
 */
export async function updateCheckInStatus(
  checkInId: string,
  status: CheckInStatus,
  source: string = "COORDINATOR_MANUAL",
  notes?: string,
  checkedInBy?: string
): Promise<void> {
  const now = new Date();
  const updateData: Record<string, unknown> = {
    status,
    checkInSource: source,
    updatedAt: now,
  };

  if (notes !== undefined) updateData.notes = notes;
  if (checkedInBy !== undefined) updateData.checkedInBy = checkedInBy;

  if (status === "ARRIVED") {
    updateData.arrivedAt = now;
  } else if (status === "SETUP_COMPLETE") {
    updateData.setupCompletedAt = now;
  } else if (status === "COMPLETED") {
    updateData.completedAt = now;
  }

  await db
    .update(vendorCheckIns)
    .set(updateData)
    .where(eq(vendorCheckIns.id, checkInId));
}

/**
 * Idempotent late arrival detection engine.
 *
 * Requirements:
 * - Expected arrival + grace period; if no check-in, mark status LATE.
 * - Persist exactly one late alert per overdue vendor (idempotent).
 * - Repeated executions do not produce duplicate alerts.
 */
export async function checkVendorLateStatus(
  weddingId: string,
  asOfTime?: Date
): Promise<LateCheckResult> {
  const asOf = asOfTime || new Date();

  // Find all active check-ins that are still EXPECTED or already flagged LATE
  const candidates = await db
    .select({
      id: vendorCheckIns.id,
      vendorName: vendors.name,
      category: vendors.category,
      expectedArrivalAt: vendorCheckIns.expectedArrivalAt,
      graceMinutes: vendorCheckIns.graceMinutes,
      status: vendorCheckIns.status,
      lateAlertSentAt: vendorCheckIns.lateAlertSentAt,
    })
    .from(vendorCheckIns)
    .innerJoin(
      weddingVendors,
      eq(vendorCheckIns.weddingVendorId, weddingVendors.id)
    )
    .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .where(
      and(
        eq(vendorCheckIns.weddingId, weddingId),
        eq(vendorCheckIns.status, "EXPECTED")
      )
    );

  const lateVendors: LateCheckResult["lateVendors"] = [];
  let newlyLateCount = 0;
  let alertsGenerated = 0;

  for (const candidate of candidates) {
    const thresholdMs =
      candidate.expectedArrivalAt.getTime() +
      candidate.graceMinutes * 60 * 1000;

    if (asOf.getTime() > thresholdMs) {
      const minutesLate = Math.floor(
        (asOf.getTime() - candidate.expectedArrivalAt.getTime()) / 60000
      );

      lateVendors.push({
        checkInId: candidate.id,
        vendorName: candidate.vendorName,
        category: candidate.category,
        expectedArrivalAt: candidate.expectedArrivalAt.toISOString(),
        graceMinutes: candidate.graceMinutes,
        minutesLate,
      });

      // Mark status as LATE
      await db
        .update(vendorCheckIns)
        .set({ status: "LATE", updatedAt: asOf })
        .where(eq(vendorCheckIns.id, candidate.id));

      newlyLateCount++;

      // Idempotent alert generation: only persist if no alert has been sent yet
      if (!candidate.lateAlertSentAt) {
        await db
          .update(vendorCheckIns)
          .set({ lateAlertSentAt: asOf })
          .where(eq(vendorCheckIns.id, candidate.id));

        await db.insert(controlRoomAlerts).values({
          weddingId,
          alertType: "VENDOR_LATE",
          severity: "WARNING",
          title: `Vendor Late: ${candidate.vendorName} (${candidate.category})`,
          message: `Expected arrival was ${candidate.expectedArrivalAt.toLocaleTimeString(
            "en-IN",
            { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }
          )} IST. Grace period of ${candidate.graceMinutes}m exceeded by ${minutesLate}m without gate check-in.`,
          relatedEntityType: "vendor_check_ins",
          relatedEntityId: candidate.id,
        });

        alertsGenerated++;
      }
    }
  }

  return {
    evaluatedCount: candidates.length,
    newlyLateCount,
    lateVendors,
    alertsGenerated,
  };
}
