import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { signAgreement } from "@/modules/guests/services/client-portal-service";
import { signAgreementSchema } from "@/modules/guests/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = signAgreementSchema.parse({
      ...body,
      agreementId: id,
    });

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    const signed = await signAgreement(id, {
      signerName: validated.signerName,
      signerEmail: validated.signerEmail,
      signerIp: ip,
    });

    return successResponse({
      ...signed,
      totalAmountPaise: signed.totalAmountPaise.toString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

