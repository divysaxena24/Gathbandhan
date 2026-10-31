import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { extractQuoteFromText } from "@/modules/vendors/services/extraction-adapter";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const documentText = body.documentText || body.text || "";
    const fileName = body.fileName || "proposal.pdf";

    if (!documentText) {
      throw new ValidationError("Document content is required", {
        documentText: ["Document text or content is required for extraction"],
      });
    }

    const extraction = await extractQuoteFromText(documentText, fileName);
    const serialized = {
      ...extraction,
      suggestedBasePricePaise: extraction.suggestedBasePricePaise.toString(),
      suggestedTravelFeePaise: extraction.suggestedTravelFeePaise.toString(),
      items: extraction.items.map((it) => ({
        ...it,
        unitPricePaise: it.unitPricePaise.toString(),
        fixedChargePaise: it.fixedChargePaise.toString(),
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}
