/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getVendorById,
  updateVendor,
  deleteVendor,
} from "@/modules/vendors/services/vendor-service";
import { updateVendorSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ForbiddenError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const vendor = await getVendorById(id);
    return successResponse(vendor);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN" && user.role !== "PLANNER") {
      throw new ForbiddenError("Only planners and founders can update vendors");
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateVendorSchema.parse(body);

    const updated = await updateVendor(id, validated as any);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "FOUNDER_ADMIN") {
      throw new ForbiddenError("Only founder admins can delete vendors");
    }

    const { id } = await params;
    const deleted = await deleteVendor(id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error);
  }
}
