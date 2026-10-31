/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getQuoteById } from "@/modules/vendors/services/quote-service";
import { calculateLandedCost } from "@/modules/vendors/services/landed-cost-engine";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const guestCount = parseInt(searchParams.get("guestCount") || "400", 10);
    const overtimeHours = parseFloat(searchParams.get("overtimeHours") || "0");

    const quote = await getQuoteById(id);
    const landedCost = calculateLandedCost(quote as any, { guestCount, overtimeHours });

    const serialized = {
      ...quote,
      basePricePaise: quote.basePricePaise?.toString(),
      travelFeePaise: quote.travelFeePaise?.toString(),
      overtimeHourlyRatePaise: quote.overtimeHourlyRatePaise?.toString(),
      items: quote.items.map((it) => ({
        ...it,
        unitPricePaise: it.unitPricePaise?.toString(),
        fixedChargePaise: it.fixedChargePaise?.toString(),
      })),
      landedCost: {
        ...landedCost,
        itemsSubtotalPaise: landedCost.itemsSubtotalPaise.toString(),
        totalServiceChargePaise: landedCost.totalServiceChargePaise.toString(),
        totalTaxPaise: landedCost.totalTaxPaise.toString(),
        travelFeePaise: landedCost.travelFeePaise.toString(),
        overtimePaise: landedCost.overtimePaise.toString(),
        totalLandedCostPaise: landedCost.totalLandedCostPaise.toString(),
        costPerGuestPaise: landedCost.costPerGuestPaise.toString(),
        itemBreakdowns: landedCost.itemBreakdowns.map((it) => ({
          ...it,
          unitPricePaise: it.unitPricePaise.toString(),
          fixedChargePaise: it.fixedChargePaise.toString(),
          subtotalPaise: it.subtotalPaise.toString(),
          serviceChargePaise: it.serviceChargePaise.toString(),
          taxPaise: it.taxPaise.toString(),
          totalPaise: it.totalPaise.toString(),
          effectivePerGuestPaise: it.effectivePerGuestPaise.toString(),
        })),
      },
    };

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}
