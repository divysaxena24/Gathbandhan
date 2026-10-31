import {
  Quote,
  ScoringWeights,
  LandedCostScenario,
  MultiQuoteComparison,
  InclusionGap,
  QuoteScoreBreakdown,
  VendorCategory,
  InclusionStatus,
} from "../types";
import { calculateLandedCost } from "./landed-cost-engine";

export const DEFAULT_WEIGHTS: ScoringWeights = {
  cost: 0.4,
  reliability: 0.25,
  quality: 0.2,
  inclusions: 0.15,
};

/**
 * Analyzes inclusion gaps across competing quotes.
 */
export function detectInclusionGaps(
  quotes: Array<Quote & { vendor?: { name: string } }>
): InclusionGap[] {
  // Collect all unique item names across all quotes
  const itemMap = new Map<
    string,
    { category: string; quotes: Record<string, InclusionStatus> }
  >();

  for (const quote of quotes) {
    const items = quote.items ?? [];
    for (const item of items) {
      const normalizedName = item.name.trim();
      const existing = itemMap.get(normalizedName) ?? {
        category: item.category || "General",
        quotes: {},
      };
      existing.quotes[quote.id] = item.inclusionStatus;
      itemMap.set(normalizedName, existing);
    }
  }

  const gaps: InclusionGap[] = [];

  for (const [itemName, data] of itemMap.entries()) {
    const statusByQuote: Record<string, InclusionStatus | "UNSPECIFIED"> = {};
    let hasExclusion = false;
    let hasOptional = false;
    let missingQuotes = 0;

    for (const quote of quotes) {
      const status = data.quotes[quote.id] ?? "UNSPECIFIED";
      statusByQuote[quote.id] = status;
      if (status === "EXCLUDED") hasExclusion = true;
      if (status === "OPTIONAL") hasOptional = true;
      if (status === "UNSPECIFIED") missingQuotes++;
    }

    if (hasExclusion || hasOptional || missingQuotes > 0) {
      let riskDescription = "Varying inclusion terms across vendors.";
      if (hasExclusion) {
        riskDescription = "Explicitly excluded by at least one vendor; will incur client add-on costs.";
      } else if (hasOptional) {
        riskDescription = "Offered as an optional extra; verify if included in base proposal.";
      } else if (missingQuotes > 0) {
        riskDescription = "Omitted by one or more vendors; clarify deliverables before signing.";
      }

      gaps.push({
        itemName,
        category: data.category,
        statusByQuote,
        riskDescription,
      });
    }
  }

  return gaps;
}

/**
 * Computes weighted multi-criteria scores for competing quotes.
 */
export function scoreQuotes(
  quotes: Array<Quote & { vendor?: { name: string; averageRating: string | null; totalWeddings: number } }>,
  scenario: LandedCostScenario,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): QuoteScoreBreakdown[] {
  if (quotes.length === 0) return [];

  // Calculate landed costs
  const landedResults = quotes.map((q) => calculateLandedCost(q, scenario));

  // Find lowest landed cost for relative normalization
  let minCostPaise = landedResults[0].totalLandedCostPaise;
  for (const res of landedResults) {
    if (res.totalLandedCostPaise < minCostPaise && res.totalLandedCostPaise > BigInt(0)) {
      minCostPaise = res.totalLandedCostPaise;
    }
  }
  if (minCostPaise <= BigInt(0)) minCostPaise = BigInt(1);

  const scores: QuoteScoreBreakdown[] = quotes.map((quote, idx) => {
    const landed = landedResults[idx];
    const vendor = quote.vendor;

    // 1. Cost Score (0 - 100): Lower landed cost gets higher score
    const costRatio =
      landed.totalLandedCostPaise > BigInt(0)
        ? Number(minCostPaise) / Number(landed.totalLandedCostPaise)
        : 1.0;
    const costScore = Math.min(100, Math.max(0, Math.round(costRatio * 100)));

    // 2. Quality Score (0 - 100): Based on averageRating (5-star scale)
    const rating = vendor?.averageRating ? parseFloat(vendor.averageRating) : 4.5;
    const qualityScore = Math.min(100, Math.max(0, Math.round((rating / 5.0) * 100)));

    // 3. Reliability Score (0 - 100): Based on total weddings and review status
    const totalWeddings = vendor?.totalWeddings ?? 5;
    let reliabilityScore = 75;
    if (totalWeddings >= 20) reliabilityScore = 95;
    else if (totalWeddings >= 10) reliabilityScore = 90;
    else if (totalWeddings >= 5) reliabilityScore = 85;

    // Extra penalty if quote extraction has not been human-reviewed
    if (quote.status === "NEEDS_REVIEW" || quote.extractionStatus === "FAILED") {
      reliabilityScore -= 15;
    }

    // 4. Inclusions Score (0 - 100): % of items INCLUDED
    const items = quote.items ?? [];
    let includedCount = 0;
    for (const item of items) {
      if (item.inclusionStatus === "INCLUDED") includedCount++;
    }
    const inclusionsScore =
      items.length > 0 ? Math.round((includedCount / items.length) * 100) : 70;

    // Composite Weighted Score
    const compositeScore = Math.round(
      weights.cost * costScore +
        weights.reliability * reliabilityScore +
        weights.quality * qualityScore +
        weights.inclusions * inclusionsScore
    );

    // Highlights and flags
    const highlights: string[] = [];
    const flags: string[] = [];

    if (costScore >= 95) highlights.push("Most cost-effective landed price");
    if (qualityScore >= 90) highlights.push(`Superior client rating (${rating}/5.0)`);
    if (inclusionsScore >= 90) highlights.push("Comprehensive inclusions with zero exclusions");

    if (quote.status === "NEEDS_REVIEW") {
      flags.push("Extracted quote requires human review before selection");
    }
    if (inclusionsScore < 70) {
      flags.push("Contains exclusions or optional add-ons that may inflate budget");
    }

    return {
      quoteId: quote.id,
      vendorId: quote.vendorId,
      vendorName: vendor?.name ?? "Vendor",
      costScore,
      reliabilityScore,
      qualityScore,
      inclusionsScore,
      compositeScore,
      landedCostPaise: landed.totalLandedCostPaise,
      rank: 1, // Will be set after sorting
      highlights,
      flags,
    };
  });

  // Sort descending by composite score to assign ranks
  scores.sort((a, b) => b.compositeScore - a.compositeScore);
  scores.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return scores;
}

/**
 * Runs a complete side-by-side multi-quote comparison.
 */
export function compareQuotes(
  quotes: Array<Quote & { vendor?: { name: string; averageRating: string | null; totalWeddings: number } }>,
  quoteRequestId: string,
  weddingId: string,
  category: VendorCategory,
  scenario: LandedCostScenario,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): MultiQuoteComparison {
  const landedResults = quotes.map((q) => calculateLandedCost(q, scenario));
  const scores = scoreQuotes(quotes, scenario, weights);
  const inclusionGaps = detectInclusionGaps(quotes);

  return {
    quoteRequestId,
    weddingId,
    category,
    scenario,
    weights,
    quotes: landedResults,
    scores,
    inclusionGaps,
  };
}
