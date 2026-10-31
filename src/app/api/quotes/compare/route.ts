/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getQuoteById } from "@/modules/vendors/services/quote-service";
import { compareQuotes } from "@/modules/vendors/services/comparison-engine";
import { compareQuotesSchema } from "@/modules/vendors/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const validated = compareQuotesSchema.parse(body);

    const quotes = await Promise.all(
      validated.quoteIds.map((id) => getQuoteById(id))
    );

    if (quotes.length < 2) {
      throw new ValidationError("Invalid quote selection", {
        quoteIds: ["At least 2 valid quotes are required for comparison"],
      });
    }

    const firstQuote = quotes[0];
    const comparison = compareQuotes(
      quotes as any,
      firstQuote.quoteRequestId,
      firstQuote.quoteRequest.weddingId,
      firstQuote.quoteRequest.category,
      validated.scenario,
      validated.weights
    );

    const serialized = {
      ...comparison,
      quotes: comparison.quotes.map((q) => ({
        ...q,
        itemsSubtotalPaise: q.itemsSubtotalPaise.toString(),
        totalServiceChargePaise: q.totalServiceChargePaise.toString(),
        totalTaxPaise: q.totalTaxPaise.toString(),
        travelFeePaise: q.travelFeePaise.toString(),
        overtimePaise: q.overtimePaise.toString(),
        totalLandedCostPaise: q.totalLandedCostPaise.toString(),
        costPerGuestPaise: q.costPerGuestPaise.toString(),
        itemBreakdowns: q.itemBreakdowns.map((it) => ({
          ...it,
          unitPricePaise: it.unitPricePaise.toString(),
          fixedChargePaise: it.fixedChargePaise.toString(),
          subtotalPaise: it.subtotalPaise.toString(),
          serviceChargePaise: it.serviceChargePaise.toString(),
          taxPaise: it.taxPaise.toString(),
          totalPaise: it.totalPaise.toString(),
          effectivePerGuestPaise: it.effectivePerGuestPaise.toString(),
        })),
      })),
      scores: comparison.scores.map((s) => ({
        ...s,
        landedCostPaise: s.landedCostPaise.toString(),
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}
