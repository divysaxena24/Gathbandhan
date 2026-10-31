import {
  ExtractedCommercialDetails,
  FinancialAuditResult,
  LineItemAudit,
} from "./types";

/**
 * Safe integer cents / paise conversion to avoid floating-point rounding errors.
 */
function toPaise(rupees: number | null | undefined): number {
  if (rupees === null || rupees === undefined || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Performs strict deterministic financial auditing on extracted quotation data.
 * Pure application-level mathematical validation; does not trust or rely on AI arithmetic.
 */
export function auditQuotationFinances(
  commercial: ExtractedCommercialDetails
): FinancialAuditResult {
  const lineItemAudits: LineItemAudit[] = [];
  const discrepancyFlags: FinancialAuditResult["discrepancyFlags"] = [];
  const missingInformationFlags: string[] = [];

  let calculatedSubtotalPaise = 0;
  let hasValidLineItemAmounts = false;

  // 1. Line Item Verification
  commercial.lineItems.forEach((item, index) => {
    const hasQty = typeof item.quantity === "number" && !isNaN(item.quantity) && item.quantity > 0;
    const hasPrice = typeof item.unitPrice === "number" && !isNaN(item.unitPrice) && item.unitPrice >= 0;
    const hasStated = typeof item.statedAmount === "number" && !isNaN(item.statedAmount) && item.statedAmount >= 0;

    if (hasQty && hasPrice) {
      // Line item math check
      const expectedAmountPaise = Math.round(item.quantity! * item.unitPrice! * 100);
      const statedAmountPaise = hasStated ? Math.round(item.statedAmount! * 100) : expectedAmountPaise;

      const diffPaise = Math.abs(statedAmountPaise - expectedAmountPaise);
      const isMismatch = diffPaise > 10; // More than 10 paise difference

      lineItemAudits.push({
        itemIndex: index,
        description: item.description,
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        expectedAmount: fromPaise(expectedAmountPaise),
        statedAmount: hasStated ? item.statedAmount! : fromPaise(expectedAmountPaise),
        discrepancy: fromPaise(statedAmountPaise - expectedAmountPaise),
        isMismatch,
      });

      if (isMismatch) {
        discrepancyFlags.push({
          type: "LINE_ITEM_MATH",
          severity: "critical",
          message: `Line item #${index + 1} "${item.description}": Stated amount ${
            item.statedAmount
          } does not match Quantity (${item.quantity}) × Unit Price (${item.unitPrice}) = ${fromPaise(
            expectedAmountPaise
          )}.`,
        });
      }

      calculatedSubtotalPaise += statedAmountPaise;
      hasValidLineItemAmounts = true;
    } else if (hasStated) {
      // Quantity/Price absent, but line amount stated
      calculatedSubtotalPaise += Math.round(item.statedAmount! * 100);
      hasValidLineItemAmounts = true;
    } else {
      missingInformationFlags.push(
        `Line item #${index + 1} "${item.description}" has no unit price or total stated amount.`
      );
    }
  });

  const calculatedSubtotal = hasValidLineItemAmounts ? fromPaise(calculatedSubtotalPaise) : null;
  const statedSubtotal = commercial.statedSubtotal;

  // 2. Subtotal Check
  let subtotalMatches = true;
  let subtotalDiscrepancy: number | null = null;

  if (statedSubtotal !== null && calculatedSubtotal !== null) {
    const diffPaise = Math.abs(Math.round(statedSubtotal * 100) - calculatedSubtotalPaise);
    subtotalDiscrepancy = fromPaise(Math.round(statedSubtotal * 100) - calculatedSubtotalPaise);
    if (diffPaise > 100) {
      // Discrepancy > 1 unit of currency
      subtotalMatches = false;
      discrepancyFlags.push({
        type: "SUBTOTAL_MISMATCH",
        severity: "critical",
        message: `Stated subtotal (${statedSubtotal}) differs from sum of line items (${calculatedSubtotal}) by ${Math.abs(
          subtotalDiscrepancy
        )}.`,
      });
    }
  } else if (statedSubtotal === null) {
    missingInformationFlags.push("Quotation does not state an explicit subtotal.");
  }

  // 3. Grand Total Verification
  // Base for grand total = statedSubtotal (if available) else calculatedSubtotal
  const baseSubtotalPaise = statedSubtotal !== null ? toPaise(statedSubtotal) : calculatedSubtotalPaise;

  // Discounts
  let discountsPaise = 0;
  if (commercial.discounts && commercial.discounts.length > 0) {
    discountsPaise = commercial.discounts.reduce(
      (sum, d) => sum + toPaise(d.statedAmount),
      0
    );
  } else if (commercial.totalDiscount) {
    discountsPaise = toPaise(commercial.totalDiscount);
  }

  // Taxes
  let taxesPaise = 0;
  if (commercial.taxes && commercial.taxes.length > 0) {
    taxesPaise = commercial.taxes.reduce(
      (sum, t) => sum + toPaise(t.statedAmount),
      0
    );
  } else if (commercial.totalTax) {
    taxesPaise = toPaise(commercial.totalTax);
  }

  // Additional charges (shipping, overtime, transport, setup)
  let chargesPaise = 0;
  if (commercial.additionalCharges && commercial.additionalCharges.length > 0) {
    chargesPaise = commercial.additionalCharges.reduce(
      (sum, c) => sum + toPaise(c.statedAmount),
      0
    );
  }

  // Expected Grand Total = Base Subtotal - Discounts + Taxes + Charges
  const calculatedGrandTotalPaise =
    baseSubtotalPaise - discountsPaise + taxesPaise + chargesPaise;
  const calculatedGrandTotal = fromPaise(calculatedGrandTotalPaise);
  const statedGrandTotal = commercial.statedGrandTotal;

  let grandTotalMatches = true;
  let grandTotalDiscrepancy: number | null = null;

  if (statedGrandTotal !== null) {
    const diffPaise = Math.abs(toPaise(statedGrandTotal) - calculatedGrandTotalPaise);
    grandTotalDiscrepancy = fromPaise(toPaise(statedGrandTotal) - calculatedGrandTotalPaise);

    if (diffPaise > 100) {
      // Discrepancy > 1 unit of currency
      grandTotalMatches = false;
      discrepancyFlags.push({
        type: "GRAND_TOTAL_MISMATCH",
        severity: "critical",
        message: `Stated grand total (${statedGrandTotal}) differs from calculated formula (Subtotal ${fromPaise(
          baseSubtotalPaise
        )} - Discounts ${fromPaise(discountsPaise)} + Taxes ${fromPaise(
          taxesPaise
        )} + Charges ${fromPaise(chargesPaise)} = ${calculatedGrandTotal}) by ${Math.abs(
          grandTotalDiscrepancy
        )}.`,
      });
    }
  } else {
    discrepancyFlags.push({
      type: "MISSING_STATED_TOTAL",
      severity: "warning",
      message: "Quotation is missing an explicitly stated grand total amount.",
    });
  }

  const hasLineItemDiscrepancies = lineItemAudits.some((l) => l.isMismatch);
  const isValid =
    subtotalMatches &&
    grandTotalMatches &&
    !hasLineItemDiscrepancies &&
    statedGrandTotal !== null;

  return {
    isValid,
    statedSubtotal,
    calculatedSubtotal,
    subtotalDiscrepancy,
    subtotalMatches,
    statedGrandTotal,
    calculatedGrandTotal,
    grandTotalDiscrepancy,
    grandTotalMatches,
    lineItemAudits,
    hasLineItemDiscrepancies,
    discrepancyFlags,
    missingInformationFlags,
  };
}
