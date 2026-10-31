import crypto from "crypto";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  weddings,
  clients,
  weddingEvents,
  agreements,
  clientPaymentMilestones,
  clientPaymentTransactions,
  guests,
  guestEventRsvps,
} from "@/lib/db/schema";
import { AgreementRecord, AgreementStatus } from "../types";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { AppUser } from "@/lib/auth";

export async function getClientPortalData(
  weddingId: string,
  user?: AppUser
) {
  // 1. Fetch wedding with client details
  const [wedding] = await db
    .select({
      id: weddings.id,
      clientId: weddings.clientId,
      title: weddings.title,
      city: weddings.city,
      venue: weddings.venue,
      startDate: weddings.startDate,
      endDate: weddings.endDate,
      packageType: weddings.packageType,
      estimatedGuestCount: weddings.estimatedGuestCount,
      budgetPaise: weddings.budgetPaise,
      coupleName: clients.coupleName,
      partnerOneName: clients.partnerOneName,
      partnerTwoName: clients.partnerTwoName,
      portalUserId: clients.portalUserId,
      partnerOneEmail: clients.partnerOneEmail,
    })
    .from(weddings)
    .innerJoin(clients, eq(weddings.clientId, clients.id))
    .where(and(eq(weddings.id, weddingId), isNull(weddings.deletedAt)))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError(`Wedding ${weddingId} not found`);
  }

  // Security Check: If actor is a CLIENT, they can ONLY access their own wedding
  if (user && user.role === "CLIENT") {
    const isOwner =
      wedding.portalUserId === user.id ||
      wedding.partnerOneEmail?.toLowerCase() === user.email?.toLowerCase();

    if (!isOwner) {
      throw new ForbiddenError(
        "Access denied: You are not authorized to view this wedding portal"
      );
    }
  }

  // 2. Fetch Agreement
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.weddingId, weddingId))
    .orderBy(desc(agreements.createdAt))
    .limit(1);

  // 3. Fetch Milestones & Client Transactions (Cleaned of internal planner margin)
  const milestones = await db
    .select({
      id: clientPaymentMilestones.id,
      title: clientPaymentMilestones.title,
      percentage: clientPaymentMilestones.percentage,
      amountPaise: clientPaymentMilestones.amountPaise,
      paidPaise: clientPaymentMilestones.paidPaise,
      dueAt: clientPaymentMilestones.dueAt,
      status: clientPaymentMilestones.status,
      orderIndex: clientPaymentMilestones.orderIndex,
    })
    .from(clientPaymentMilestones)
    .where(eq(clientPaymentMilestones.weddingId, weddingId))
    .orderBy(clientPaymentMilestones.orderIndex);

  const transactions = await db
    .select({
      id: clientPaymentTransactions.id,
      milestoneId: clientPaymentTransactions.milestoneId,
      amountPaise: clientPaymentTransactions.amountPaise,
      paidAt: clientPaymentTransactions.paidAt,
      paymentMethod: clientPaymentTransactions.paymentMethod,
      reference: clientPaymentTransactions.reference,
      receiptUrl: clientPaymentTransactions.receiptUrl,
    })
    .from(clientPaymentTransactions)
    .where(eq(clientPaymentTransactions.weddingId, weddingId))
    .orderBy(desc(clientPaymentTransactions.paidAt));

  // 4. Fetch Wedding Ceremonies / Itinerary
  const events = await db
    .select({
      id: weddingEvents.id,
      name: weddingEvents.name,
      eventType: weddingEvents.eventType,
      startsAt: weddingEvents.startsAt,
      endsAt: weddingEvents.endsAt,
      venue: weddingEvents.venue,
    })
    .from(weddingEvents)
    .where(eq(weddingEvents.weddingId, weddingId))
    .orderBy(weddingEvents.startsAt);

  // 5. Fetch Guest RSVP Summary for Couple
  const weddingGuests = await db
    .select({ id: guests.id })
    .from(guests)
    .where(and(eq(guests.weddingId, weddingId), isNull(guests.deletedAt)));

  const rsvps = await db
    .select({
      status: guestEventRsvps.status,
      plusOnes: guestEventRsvps.plusOnes,
    })
    .from(guestEventRsvps)
    .where(eq(guestEventRsvps.weddingId, weddingId));

  const attendingCount = rsvps
    .filter((r) => r.status === "ATTENDING")
    .reduce((sum, r) => sum + 1 + r.plusOnes, 0);

  const declinedCount = rsvps.filter((r) => r.status === "DECLINED").length;

  const totalContractPaise = milestones.reduce(
    (sum, m) => sum + m.amountPaise,
    0n
  );
  const totalPaidPaise = transactions.reduce(
    (sum, t) => sum + t.amountPaise,
    0n
  );
  const remainingPaise =
    totalContractPaise > totalPaidPaise ? totalContractPaise - totalPaidPaise : 0n;

  return {
    wedding: {
      id: wedding.id,
      title: wedding.title,
      coupleName: wedding.coupleName,
      partnerOneName: wedding.partnerOneName,
      partnerTwoName: wedding.partnerTwoName,
      city: wedding.city,
      venue: wedding.venue,
      startDate: wedding.startDate,
      endDate: wedding.endDate,
      packageType: wedding.packageType,
      estimatedGuestCount: wedding.estimatedGuestCount,
    },
    agreement: agreement
      ? {
          id: agreement.id,
          title: agreement.title,
          version: agreement.version,
          status: agreement.status as AgreementStatus,
          totalAmountPaise: agreement.totalAmountPaise,
          documentUrl: agreement.documentUrl,
          documentHash: agreement.documentHash,
          termsSummary: agreement.termsSummary,
          sentAt: agreement.sentAt,
          signedAt: agreement.signedAt,
          signerName: agreement.signerName,
          signatureEvidence: agreement.signatureEvidence,
        }
      : null,
    financials: {
      totalContractPaise,
      totalPaidPaise,
      remainingPaise,
      milestones: milestones.map((m) => ({
        ...m,
        remainingPaise: m.amountPaise > m.paidPaise ? m.amountPaise - m.paidPaise : 0n,
      })),
      transactions,
    },
    itinerary: events,
    guestStats: {
      totalInvited: weddingGuests.length,
      confirmedAttending: attendingCount,
      declined: declinedCount,
      pending: Math.max(0, weddingGuests.length - attendingCount - declinedCount),
    },
  };
}

export async function getAgreementForWedding(
  weddingId: string
): Promise<AgreementRecord | null> {
  const [row] = await db
    .select({
      id: agreements.id,
      weddingId: agreements.weddingId,
      weddingTitle: weddings.title,
      clientId: agreements.clientId,
      coupleName: clients.coupleName,
      title: agreements.title,
      version: agreements.version,
      status: agreements.status,
      totalAmountPaise: agreements.totalAmountPaise,
      documentUrl: agreements.documentUrl,
      documentHash: agreements.documentHash,
      termsSummary: agreements.termsSummary,
      sentAt: agreements.sentAt,
      signedAt: agreements.signedAt,
      signerName: agreements.signerName,
      signerEmail: agreements.signerEmail,
      signerIp: agreements.signerIp,
      signatureEvidence: agreements.signatureEvidence,
      notes: agreements.notes,
      createdAt: agreements.createdAt,
    })
    .from(agreements)
    .innerJoin(weddings, eq(agreements.weddingId, weddings.id))
    .innerJoin(clients, eq(agreements.clientId, clients.id))
    .where(eq(agreements.weddingId, weddingId))
    .orderBy(desc(agreements.createdAt))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    status: row.status as AgreementStatus,
  };
}

export async function signAgreement(
  agreementId: string,
  data: {
    signerName: string;
    signerEmail: string;
    signerIp?: string | null;
  }
): Promise<AgreementRecord> {
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.id, agreementId))
    .limit(1);

  if (!agreement) {
    throw new NotFoundError(`Agreement ${agreementId} not found`);
  }

  const now = new Date();
  const signatureText = `ELECTRONIC ACCEPTANCE by ${data.signerName} (${data.signerEmail}) via Gathbandhan Portal on ${now.toISOString()} [IP: ${data.signerIp || "127.0.0.1"}]`;
  const documentHash = crypto
    .createHash("sha256")
    .update(`${agreementId}:${agreement.totalAmountPaise}:${signatureText}`)
    .digest("hex");

  const [signed] = await db
    .update(agreements)
    .set({
      status: "SIGNED",
      signedAt: now,
      signerName: data.signerName,
      signerEmail: data.signerEmail,
      signerIp: data.signerIp || "127.0.0.1",
      documentHash,
      signatureEvidence: signatureText,
      updatedAt: now,
    })
    .where(eq(agreements.id, agreementId))
    .returning();

  return {
    ...signed,
    status: signed.status as AgreementStatus,
  };
}
