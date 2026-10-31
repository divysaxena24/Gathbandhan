// ============================================================
// Gathbandhan — Paise-based Money Utilities
// All financial calculations use integer paise (1 INR = 100 paise)
// No floating-point arithmetic for money.
// ============================================================

/**
 * Convert INR (rupees) to paise.
 * Rounds to nearest integer to avoid floating point issues.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to INR (rupees).
 * Returns a number with up to 2 decimal places.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise as INR currency string.
 * E.g., 2500000 paise → "₹25,000"
 */
export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  return formatINR(rupees);
}

/**
 * Format a rupee amount as INR currency string using Indian numbering.
 * E.g., 2500000 → "₹25,00,000"
 */
export function formatINR(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

/**
 * Format paise as a short INR string.
 * E.g., 50000000 (5 lakh) → "₹5L"
 * E.g., 100000000 (1 crore) → "₹1Cr"
 */
export function formatPaiseShort(paise: number): string {
  const rupees = paiseToRupees(paise);
  if (rupees >= 10000000) {
    const crores = rupees / 10000000;
    return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1)}Cr`;
  }
  if (rupees >= 100000) {
    const lakhs = rupees / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (rupees >= 1000) {
    const thousands = rupees / 1000;
    return `₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return formatINR(rupees);
}

/**
 * Safe multiplication for paise values.
 * Ensures result is an integer.
 */
export function multiplyPaise(paise: number, quantity: number): number {
  return Math.round(paise * quantity);
}

/**
 * Sum an array of paise values.
 */
export function sumPaise(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate percentage of a paise value.
 * E.g., calculatePercentage(10000, 18) returns 1800 (18% of ₹100)
 */
export function calculatePercentage(paise: number, percentage: number): number {
  return Math.round((paise * percentage) / 100);
}
