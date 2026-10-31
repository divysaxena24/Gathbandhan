// Money is always stored as integer paise (1 INR = 100 paise)

/** Convert paise to rupees (number) */
export function paiseToRupees(paise: bigint | number): number {
  return Number(paise) / 100;
}

/** Convert rupees (number) to paise (bigint) */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

/** Format paise as a full INR currency string — e.g. ₹1,50,000 */
export function formatINR(paise: bigint | number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Format paise as compact INR — e.g. ₹1.50 Cr, ₹4.50 L, ₹12.5K */
export function formatINRCompact(paise: bigint | number): string {
  const rupees = paiseToRupees(paise);
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(2)} Cr`;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(2)} L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return formatINR(paise);
}

/** Alias for formatINR */
export const formatRupees = formatINR;

