/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getInvoicesForWedding,
  createVendorInvoice,
} from "@/modules/finance/services/vendor-settlement-service";
import { createVendorInvoiceSchema } from "@/modules/finance/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");
    const vendorId = searchParams.get("vendorId") || undefined;

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const invoices = await getInvoicesForWedding(weddingId, vendorId);
    return successResponse(invoices);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createVendorInvoiceSchema.parse(body);

    const invoice = await createVendorInvoice(validated as any);
    return successResponse(invoice);
  } catch (error) {
    return errorResponse(error);
  }
}
