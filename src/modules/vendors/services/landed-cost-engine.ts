import {
  Quote,
  LandedCostScenario,
  LandedCostResult,
  ItemCostBreakdown,
} from "../types";
import { formatINR } from "@/lib/money";

/**
 * Calculates landed cost deterministically from quote line items, guest quantity, and scenario inputs.
 * Uses exact integer paise representation to prevent floating point drift.
 */
export function calculateLandedCost(
  quote: Quote & { vendor?: { name: string } },
  scenario: LandedCostScenario
): LandedCostResult {
  const guestCount = Math.max(1, scenario.guestCount);
  const overtimeHours = Math.max(0, scenario.overtimeHours ?? 0);

  const items = quote.items ?? [];
  const itemBreakdowns: ItemCostBreakdown[] = [];
  const assumptions: string[] = [];

  let itemsSubtotalPaise = BigInt(0);
  let totalServiceChargePaise = BigInt(0);
  let totalTaxPaise = BigInt(0);

  assumptions.push(`Simulated Guest Count: ${guestCount} guests.`);
  if (overtimeHours > 0) {
    assumptions.push(`Overtime: ${overtimeHours} hours modeled.`);
  }

  for (const item of items) {
    const unitPrice = item.unitPricePaise ?? BigInt(0);
    const fixedCharge = item.fixedChargePaise ?? BigInt(0);
    const effectiveQty = item.isPerGuest ? guestCount : item.quantity;

    // Item Subtotal
    const subtotal = BigInt(effectiveQty) * unitPrice + fixedCharge;

    // Service Charge (percentage of subtotal)
    const servicePercentNum = parseFloat(item.serviceChargePercent || "0");
    const serviceCharge =
      servicePercentNum > 0
        ? BigInt(Math.round((Number(subtotal) * servicePercentNum) / 100))
        : BigInt(0);

    // GST Tax (applied on subtotal + service charge)
    const taxPercentNum = parseFloat(item.taxPercent || "18");
    const taxableBase = subtotal + serviceCharge;
    const tax =
      taxPercentNum > 0
        ? BigInt(Math.round((Number(taxableBase) * taxPercentNum) / 100))
        : BigInt(0);

    const itemTotal = subtotal + serviceCharge + tax;
    const effectivePerGuest = itemTotal / BigInt(guestCount);

    itemsSubtotalPaise += subtotal;
    totalServiceChargePaise += serviceCharge;
    totalTaxPaise += tax;

    itemBreakdowns.push({
      id: item.id,
      name: item.name,
      category: item.category || "General",
      quantity: effectiveQty,
      unit: item.unit,
      unitPricePaise: unitPrice,
      fixedChargePaise: fixedCharge,
      isPerGuest: item.isPerGuest,
      subtotalPaise: subtotal,
      serviceChargePaise: serviceCharge,
      taxPaise: tax,
      totalPaise: itemTotal,
      inclusionStatus: item.inclusionStatus,
      effectivePerGuestPaise: effectivePerGuest,
    });
  }

  // Quote-level logistics & overtime
  const travelFeePaise = quote.travelFeePaise ?? BigInt(0);
  if (travelFeePaise > BigInt(0)) {
    assumptions.push(
      `Travel & Logistics: ${formatINR(travelFeePaise)} fixed.`
    );
  }

  const overtimeHourlyRate = quote.overtimeHourlyRatePaise ?? BigInt(0);
  const overtimePaise =
    overtimeHours > 0
      ? BigInt(Math.round(overtimeHours * Number(overtimeHourlyRate)))
      : BigInt(0);

  if (overtimePaise > BigInt(0)) {
    assumptions.push(
      `Overtime Surcharge: ${overtimeHours} hrs @ ${formatINR(overtimeHourlyRate)}/hr = ${formatINR(overtimePaise)}.`
    );
  }

  const totalLandedCostPaise =
    itemsSubtotalPaise +
    totalServiceChargePaise +
    totalTaxPaise +
    travelFeePaise +
    overtimePaise;

  const costPerGuestPaise =
    guestCount > 0 ? totalLandedCostPaise / BigInt(guestCount) : BigInt(0);

  assumptions.push(
    `Effective landed cost: ${formatINR(totalLandedCostPaise)} (~${formatINR(costPerGuestPaise)}/guest).`
  );

  return {
    quoteId: quote.id,
    vendorId: quote.vendorId,
    vendorName: quote.vendor?.name ?? "Unknown Vendor",
    guestCount,
    itemsSubtotalPaise,
    totalServiceChargePaise,
    totalTaxPaise,
    travelFeePaise,
    overtimePaise,
    overtimeHours,
    totalLandedCostPaise,
    costPerGuestPaise,
    itemBreakdowns,
    assumptions,
  };
}

/**
 * Evaluates guest count sensitivity for a quote across multiple guest scenarios (e.g., 250, 400, 600 guests).
 */
export function calculateGuestSensitivity(
  quote: Quote & { vendor?: { name: string } },
  guestCounts: number[] = [250, 400, 600]
): LandedCostResult[] {
  return guestCounts.map((guestCount) =>
    calculateLandedCost(quote, { guestCount })
  );
}
