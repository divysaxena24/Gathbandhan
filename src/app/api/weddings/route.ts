import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weddings } from "@/lib/db/schema/weddings";
import { isNull, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    const list = await db
      .select({
        id: weddings.id,
        title: weddings.title,
        city: weddings.city,
        venue: weddings.venue,
        startDate: weddings.startDate,
        endDate: weddings.endDate,
        budgetPaise: weddings.budgetPaise,
        lifecycleStatus: weddings.lifecycleStatus,
        createdAt: weddings.createdAt,
      })
      .from(weddings)
      .where(isNull(weddings.deletedAt))
      .orderBy(desc(weddings.createdAt));

    // Convert bigint budgetPaise to string for JSON serialization
    const serialized = list.map((w) => ({
      ...w,
      budgetPaise: w.budgetPaise?.toString() || "0",
    }));

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}
