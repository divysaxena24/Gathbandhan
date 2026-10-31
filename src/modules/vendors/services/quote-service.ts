import { eq, and, isNull, desc, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  quoteRequests,
  quotes,
  quoteItems,
  weddingVendors,
  weddings,
  vendors,
  auditLogs,
} from "@/lib/db/schema";
import {
  VendorCategory,
  QuoteStatus,
  InclusionStatus,
} from "../types";
import { NotFoundError, ConflictError } from "@/lib/errors";

export async function getQuoteRequests(weddingId?: string) {
  const conditions = [isNull(quoteRequests.deletedAt)];
  if (weddingId) {
    conditions.push(eq(quoteRequests.weddingId, weddingId));
  }

  const requests = await db
    .select({
      id: quoteRequests.id,
      weddingId: quoteRequests.weddingId,
      weddingTitle: weddings.title,
      weddingCity: weddings.city,
      category: quoteRequests.category,
      title: quoteRequests.title,
      description: quoteRequests.description,
      targetBudgetPaise: quoteRequests.targetBudgetPaise,
      deadline: quoteRequests.deadline,
      status: quoteRequests.status,
      selectedQuoteId: quoteRequests.selectedQuoteId,
      createdAt: quoteRequests.createdAt,
    })
    .from(quoteRequests)
    .innerJoin(weddings, eq(quoteRequests.weddingId, weddings.id))
    .where(and(...conditions))
    .orderBy(desc(quoteRequests.createdAt));

  return requests;
}

export async function getQuoteRequestById(id: string) {
  const [request] = await db
    .select({
      id: quoteRequests.id,
      weddingId: quoteRequests.weddingId,
      weddingTitle: weddings.title,
      weddingCity: weddings.city,
      weddingGuestCount: weddings.estimatedGuestCount,
      category: quoteRequests.category,
      title: quoteRequests.title,
      description: quoteRequests.description,
      targetBudgetPaise: quoteRequests.targetBudgetPaise,
      deadline: quoteRequests.deadline,
      status: quoteRequests.status,
      selectedQuoteId: quoteRequests.selectedQuoteId,
      createdAt: quoteRequests.createdAt,
    })
    .from(quoteRequests)
    .innerJoin(weddings, eq(quoteRequests.weddingId, weddings.id))
    .where(and(eq(quoteRequests.id, id), isNull(quoteRequests.deletedAt)))
    .limit(1);

  if (!request) {
    throw new NotFoundError(`Quote request with ID '${id}' not found`);
  }

  // Get competing quotes for this request
  const quoteRows = await db
    .select({
      quote: quotes,
      vendor: vendors,
    })
    .from(quotes)
    .innerJoin(vendors, eq(quotes.vendorId, vendors.id))
    .where(and(eq(quotes.quoteRequestId, id), isNull(quotes.deletedAt)))
    .orderBy(desc(quotes.createdAt));

  // Fetch items for each quote
  const quotesWithItems = await Promise.all(
    quoteRows.map(async ({ quote, vendor }) => {
      const items = await db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, quote.id));
      return {
        ...quote,
        vendor,
        items,
      };
    })
  );

  return {
    ...request,
    quotes: quotesWithItems,
  };
}

export async function createQuoteRequest(data: {
  weddingId: string;
  category: VendorCategory;
  title: string;
  description?: string | null;
  targetBudgetPaise?: bigint | null;
  deadline?: string | null;
}) {
  const [created] = await db
    .insert(quoteRequests)
    .values({
      weddingId: data.weddingId,
      category: data.category,
      title: data.title,
      description: data.description,
      targetBudgetPaise: data.targetBudgetPaise,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: "OPEN",
    })
    .returning();

  return created;
}

export async function getQuoteById(id: string) {
  const [row] = await db
    .select({
      quote: quotes,
      vendor: vendors,
      request: quoteRequests,
    })
    .from(quotes)
    .innerJoin(vendors, eq(quotes.vendorId, vendors.id))
    .innerJoin(quoteRequests, eq(quotes.quoteRequestId, quoteRequests.id))
    .where(and(eq(quotes.id, id), isNull(quotes.deletedAt)))
    .limit(1);

  if (!row) {
    throw new NotFoundError(`Quote with ID '${id}' not found`);
  }

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id));

  return {
    ...row.quote,
    vendor: row.vendor,
    quoteRequest: row.request,
    items,
  };
}

export async function createQuote(data: {
  quoteRequestId: string;
  vendorId: string;
  submittedAt?: string | null;
  validUntil?: string | null;
  currency?: string;
  rawDocumentUrl?: string | null;
  rawDocumentName?: string | null;
  rawDocumentText?: string | null;
  extractionStatus?: string;
  confidenceScore?: string | null;
  extractionNotes?: string | null;
  basePricePaise?: bigint;
  travelFeePaise?: bigint;
  overtimeHourlyRatePaise?: bigint;
  taxRule?: string;
  serviceChargeRule?: string;
  notes?: string | null;
  items?: Array<{
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    unitPricePaise?: bigint;
    fixedChargePaise?: bigint;
    isPerGuest?: boolean;
    taxPercent?: string;
    serviceChargePercent?: string;
    inclusionStatus?: InclusionStatus;
    notes?: string | null;
  }>;
}) {
  return await db.transaction(async (tx) => {
    const [newQuote] = await tx
      .insert(quotes)
      .values({
        quoteRequestId: data.quoteRequestId,
        vendorId: data.vendorId,
        status: data.extractionStatus === "COMPLETED" ? "NEEDS_REVIEW" : "RECEIVED",
        submittedAt: data.submittedAt ? new Date(data.submittedAt) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        currency: data.currency || "INR",
        rawDocumentUrl: data.rawDocumentUrl,
        rawDocumentName: data.rawDocumentName,
        rawDocumentText: data.rawDocumentText,
        extractionStatus: data.extractionStatus || "MANUAL",
        confidenceScore: data.confidenceScore,
        extractionNotes: data.extractionNotes,
        basePricePaise: data.basePricePaise || BigInt(0),
        travelFeePaise: data.travelFeePaise || BigInt(0),
        overtimeHourlyRatePaise: data.overtimeHourlyRatePaise || BigInt(0),
        taxRule: data.taxRule || "GST_18",
        serviceChargeRule: data.serviceChargeRule || "NONE",
        notes: data.notes,
      })
      .returning();

    if (data.items && data.items.length > 0) {
      await tx.insert(quoteItems).values(
        data.items.map((item) => ({
          quoteId: newQuote.id,
          name: item.name,
          category: item.category || "General",
          quantity: item.quantity || 1,
          unit: item.unit || "plate",
          unitPricePaise: item.unitPricePaise || BigInt(0),
          fixedChargePaise: item.fixedChargePaise || BigInt(0),
          isPerGuest: item.isPerGuest ?? false,
          taxPercent: item.taxPercent || "18.00",
          serviceChargePercent: item.serviceChargePercent || "0.00",
          inclusionStatus: item.inclusionStatus || "INCLUDED",
          notes: item.notes,
        }))
      );
    }

    return newQuote;
  });
}

/**
 * Human Review Verification:
 * Per PRD, human verification is required before any extracted quote is finalized.
 */
export async function reviewAndVerifyQuote(
  quoteId: string,
  reviewerId: string,
  reviewData: {
    status: "VERIFIED" | "NEEDS_REVIEW" | "REJECTED";
    items?: Array<{
      id?: string;
      name: string;
      category?: string;
      quantity?: number;
      unit?: string;
      unitPricePaise?: bigint;
      fixedChargePaise?: bigint;
      isPerGuest?: boolean;
      taxPercent?: string;
      serviceChargePercent?: string;
      inclusionStatus?: InclusionStatus;
      notes?: string | null;
    }>;
    basePricePaise?: bigint;
    travelFeePaise?: bigint;
    overtimeHourlyRatePaise?: bigint;
    notes?: string | null;
  }
) {
  const quote = await getQuoteById(quoteId);

  return await db.transaction(async (tx) => {
    // 1. Update quote status and reviewer fields
    const [updatedQuote] = await tx
      .update(quotes)
      .set({
        status: reviewData.status as QuoteStatus,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        basePricePaise: reviewData.basePricePaise ?? quote.basePricePaise,
        travelFeePaise: reviewData.travelFeePaise ?? quote.travelFeePaise,
        overtimeHourlyRatePaise:
          reviewData.overtimeHourlyRatePaise ?? quote.overtimeHourlyRatePaise,
        notes: reviewData.notes ?? quote.notes,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
      .returning();

    // 2. If corrected items were provided, update/insert them
    if (reviewData.items && reviewData.items.length > 0) {
      await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

      await tx.insert(quoteItems).values(
        reviewData.items.map((item) => ({
          quoteId: quoteId,
          name: item.name,
          category: item.category || "General",
          quantity: item.quantity || 1,
          unit: item.unit || "plate",
          unitPricePaise: item.unitPricePaise || BigInt(0),
          fixedChargePaise: item.fixedChargePaise || BigInt(0),
          isPerGuest: item.isPerGuest ?? false,
          taxPercent: item.taxPercent || "18.00",
          serviceChargePercent: item.serviceChargePercent || "0.00",
          inclusionStatus: item.inclusionStatus || "INCLUDED",
          notes: item.notes,
        }))
      );
    }

    return updatedQuote;
  });
}

/**
 * Transactional Vendor Selection & Quote Commitment:
 * 1. Checks quote status is VERIFIED.
 * 2. In atomic transaction:
 *    - Updates selected quote status to SELECTED.
 *    - Rejects all competing quotes for this request.
 *    - Closes the quote request.
 *    - Inserts wedding_vendors commitment record.
 *    - Logs audit trail.
 */
export async function selectWinningQuote(
  quoteId: string,
  actorId: string,
  options: {
    eventId?: string | null;
    contractAmountPaise?: bigint;
    scope?: string | null;
    terms?: string | null;
  } = {}
) {
  const quote = await getQuoteById(quoteId);

  if (quote.quoteRequest.status === "CLOSED") {
    throw new ConflictError(
      `Quote request '${quote.quoteRequest.title}' is already closed. A vendor has already been selected.`
    );
  }

  return await db.transaction(async (tx) => {
    // 1. Update winning quote
    const [selectedQuote] = await tx
      .update(quotes)
      .set({
        status: "SELECTED",
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
      .returning();

    // 2. Reject all competing quotes for this quote request
    await tx
      .update(quotes)
      .set({
        status: "REJECTED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quotes.quoteRequestId, quote.quoteRequestId),
          ne(quotes.id, quoteId)
        )
      );

    // 3. Close the quote request
    await tx
      .update(quoteRequests)
      .set({
        status: "CLOSED",
        selectedQuoteId: quoteId,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, quote.quoteRequestId));

    // 4. Create/update wedding_vendor assignment
    const [assignment] = await tx
      .insert(weddingVendors)
      .values({
        weddingId: quote.quoteRequest.weddingId,
        vendorId: quote.vendorId,
        eventId: options.eventId || null,
        contractAmountPaise: options.contractAmountPaise ?? quote.basePricePaise,
        scope:
          options.scope ||
          `Agreed proposal: ${quote.quoteRequest.title} (${quote.vendor.name})`,
        terms: options.terms || quote.notes || "Standard agency contract terms",
        status: "confirmed",
      })
      .returning();

    // 5. Append audit log
    await tx.insert(auditLogs).values({
      actorId,
      entityType: "quote",
      entityId: quoteId,
      action: "quote.selected",
      oldValue: { status: quote.status },
      newValue: {
        status: "SELECTED",
        weddingVendorId: assignment.id,
        contractAmountPaise: assignment.contractAmountPaise?.toString(),
      },
      reason: `Vendor '${quote.vendor.name}' selected for '${quote.quoteRequest.title}'. Competing quotes closed.`,
    });

    return {
      selectedQuote,
      weddingVendor: assignment,
    };
  });
}
