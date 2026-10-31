import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reconcileVendorInvoice } from "@/modules/finance/services/vendor-settlement-service";
import { reconcileInvoiceSchema } from "@/modules/finance/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const validated = reconcileInvoiceSchema.parse({
      ...body,
      invoiceId: id,
    });

    const result = await reconcileVendorInvoice(
      validated.invoiceId,
      user.id,
      {
        approvedExtrasAllowed: validated.approvedExtrasAllowed,
        reconciliationNotes: validated.reconciliationNotes,
      }
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
