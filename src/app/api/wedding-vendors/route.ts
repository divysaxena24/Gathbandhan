import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weddingVendors, vendors, vendorCheckIns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError, ForbiddenError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId parameter is required");
    }

    const records = await db
      .select({
        id: weddingVendors.id,
        weddingId: weddingVendors.weddingId,
        vendorId: vendors.id,
        name: vendors.name,
        category: vendors.category,
        contactName: vendors.contactName,
        phone: vendors.phone,
        email: vendors.email,
        city: vendors.city,
        averageRating: vendors.averageRating,
        contractAmountPaise: weddingVendors.contractAmountPaise,
        currency: weddingVendors.currency,
        scope: weddingVendors.scope,
        status: weddingVendors.status,
        checkInStatus: vendorCheckIns.status,
        arrivedAt: vendorCheckIns.arrivedAt,
        expectedArrivalAt: vendorCheckIns.expectedArrivalAt,
      })
      .from(weddingVendors)
      .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
      .leftJoin(vendorCheckIns, eq(vendorCheckIns.weddingVendorId, weddingVendors.id))
      .where(eq(weddingVendors.weddingId, weddingId))
      .orderBy(desc(weddingVendors.contractAmountPaise));

    const serialized = records.map((r) => ({
      ...r,
      contractAmountPaise: r.contractAmountPaise?.toString() || "0",
    }));

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can assign vendors");
    }

    const body = await req.json();
    const { weddingId, vendorId, contractAmountPaise, scope } = body;

    if (!weddingId || !vendorId) {
      throw new ValidationError("weddingId and vendorId are required");
    }

    const [assignment] = await db
      .insert(weddingVendors)
      .values({
        weddingId,
        vendorId,
        contractAmountPaise: contractAmountPaise ? BigInt(contractAmountPaise) : 0n,
        scope: scope || "Wedding service agreement",
        status: "assigned",
      })
      .returning();

    return successResponse(assignment);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can remove vendors");
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Assignment id is required");
    }

    await db.delete(weddingVendors).where(eq(weddingVendors.id, id));
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
