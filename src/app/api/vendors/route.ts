/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getVendors, createVendor } from "@/modules/vendors/services/vendor-service";
import { createVendorSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") as any;
    const city = searchParams.get("city") || undefined;
    const search = searchParams.get("search") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const vendorList = await getVendors({ category, city, search, isActive });
    return successResponse(vendorList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can register vendors");
    }

    const body = await req.json();
    const validated = createVendorSchema.parse(body);

    const created = await createVendor(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
