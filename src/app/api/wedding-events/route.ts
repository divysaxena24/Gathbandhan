import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weddingEvents } from "@/lib/db/schema/weddings";
import { eq, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId parameter is required");
    }

    const list = await db
      .select({
        id: weddingEvents.id,
        weddingId: weddingEvents.weddingId,
        name: weddingEvents.name,
        eventType: weddingEvents.eventType,
        startsAt: weddingEvents.startsAt,
        endsAt: weddingEvents.endsAt,
        venue: weddingEvents.venue,
        expectedGuestCount: weddingEvents.expectedGuestCount,
        status: weddingEvents.status,
        notes: weddingEvents.notes,
      })
      .from(weddingEvents)
      .where(eq(weddingEvents.weddingId, weddingId))
      .orderBy(asc(weddingEvents.startsAt));

    const serialized = list.map((e) => ({
      ...e,
      startsAt: e.startsAt ? e.startsAt.toISOString() : null,
      endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    }));

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}

