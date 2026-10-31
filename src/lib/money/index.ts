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

/** Format paise as INR currency string */
export function formatPaise(paise: bigint | number): string {
  return formatINR(paise);
}

/** Format paise as a short INR string (e.g. ₹5L, ₹1.5Cr) */
export function formatPaiseShort(paise: bigint | number): string {
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
  return formatINR(paise);
}

/** Safe integer multiplication for paise values */
export function multiplyPaise(paise: number, quantity: number): number {
  return Math.round(paise * quantity);
}

/** Sum an array of paise values */
export function sumPaise(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

/** Calculate percentage of a paise value */
export function calculatePercentage(paise: number, percentage: number): number {
  return Math.round((paise * percentage) / 100);
}

