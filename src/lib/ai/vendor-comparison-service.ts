/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { QuotationAnalysisResult } from "./types";
import {
  ComparisonWeights,
  DEFAULT_COMPARISON_WEIGHTS,
  MultiVendorComparisonResult,
  VendorScoringBreakdown,
  ComparedVendorSummary,
  ComparisonMatrixRow,
  VendorRecommendation,
  CriterionScore,
} from "./comparison-types";
import { executeGroqJsonChat, GroqCompletionOptions } from "./groq-client";
import { analyzeQuotationDocument, getCachedAnalysis } from "./quotation-analyzer-service";

/**
 * Checks service category compatibility across quotations.
 */
export function checkCategoryCompatibility(quotations: QuotationAnalysisResult[]): {
  isCompatible: boolean;
  primaryCategory: string;
  detectedCategories: string[];
  warningMessage?: string;
} {
  const categories = quotations.map((q) => (q.vendorDetails.category || "Unspecified").trim());
  const uniqueCategories = Array.from(new Set(categories));
  const primaryCategory = uniqueCategories[0] || "General Services";

  if (uniqueCategories.length <= 1) {
    return {
      isCompatible: true,
      primaryCategory,
      detectedCategories: uniqueCategories,
    };
  }

  // Check if categories are roughly synonyms or completely different
  const normCategories = uniqueCategories.map((c) => c.toLowerCase());
  const allCatering = normCategories.every((c) => c.includes("cater") || c.includes("food") || c.includes("cuisine"));
  const allDecor = normCategories.every((c) => c.includes("decor") || c.includes("design") || c.includes("production"));
  const allPhoto = normCategories.every((c) => c.includes("photo") || c.includes("video") || c.includes("cinema"));

  if (allCatering || allDecor || allPhoto) {
    return {
      isCompatible: true,
      primaryCategory,
      detectedCategories: uniqueCategories,
    };
  }

  return {
    isCompatible: false,
    primaryCategory,
    detectedCategories: uniqueCategories,
    warningMessage: `Caution: The selected quotations represent divergent vendor categories (${uniqueCategories.join(
      ", "
    )}). Scope of deliverables and cost benchmarks may not be directly comparable.`,
  };
}

/**
 * Checks currency compatibility across quotations.
 */
export function checkCurrencyCompatibility(quotations: QuotationAnalysisResult[]): {
  isCompatible: boolean;
  primaryCurrency: string;
  detectedCurrencies: string[];
  warningMessage?: string;
} {
  const currencies = quotations.map((q) => (q.commercialDetails.currency || "INR").toUpperCase());
  const uniqueCurrencies = Array.from(new Set(currencies));
  const primaryCurrency = uniqueCurrencies[0] || "INR";

  if (uniqueCurrencies.length <= 1) {
    return {
      isCompatible: true,
      primaryCurrency,
      detectedCurrencies: uniqueCurrencies,
    };
  }

  return {
    isCompatible: false,
    primaryCurrency,
    detectedCurrencies: uniqueCurrencies,
    warningMessage: `Caution: Multiple currencies detected (${uniqueCurrencies.join(
      ", "
    )}). Numerical comparisons are indicative only without live foreign exchange normalization.`,
  };
}

/**
 * Deterministically calculates transparent, weighted vendor scores.
 * Re-normalizes weights when evidence is unavailable without penalizing the vendor.
 */
export function calculateVendorScores(
  quotations: QuotationAnalysisResult[],
  weightsInput: Partial<ComparisonWeights> = {}
): {
  weights: ComparisonWeights;
  methodologyDescription: string;
  vendorScores: Record<string, VendorScoringBreakdown>;
  rankings: Array<{ uploadId: string; vendorName: string; totalScore: number; rank: number }>;
} {
  const weights: ComparisonWeights = {
    ...DEFAULT_COMPARISON_WEIGHTS,
    ...weightsInput,
  };

  // 1. Gather all prices to determine minimum positive price
  const validPrices: number[] = quotations
    .map((q) => q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal)
    .filter((p): p is number => typeof p === "number" && p > 0);

  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

  // 2. Gather maximum inclusions count
  const maxInclusions = Math.max(
    ...quotations.map((q) => q.serviceDetails.servicesIncluded.length),
    1
  );

  const vendorScores: Record<string, VendorScoringBreakdown> = {};

  for (const q of quotations) {
    const uploadId = q.uploadId;
    const vendorName = q.vendorDetails.vendorName || q.originalName;
    const price = q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal;

    // --- A. Cost Competitiveness (Weight: default 30%) ---
    let costCriterion: CriterionScore;
    if (price && price > 0 && minPrice && minPrice > 0) {
      // Linear ratio benchmarked to lowest price
      const ratio = minPrice / price;
      const normalizedScore = Math.max(10, Math.min(100, Math.round(ratio * 100)));
      costCriterion = {
        name: "Cost Competitiveness",
        key: "costCompetitiveness",
        rawScore: normalizedScore,
        normalizedScore,
        weight: weights.costCompetitiveness,
        adjustedWeight: weights.costCompetitiveness,
        weightedScore: 0, // calculated during re-normalization
        isAvailable: true,
        evidenceNotes: `Quoted Total: ${q.commercialDetails.currency || "INR"} ${price.toLocaleString()}. Lowest in group: ${
          q.commercialDetails.currency || "INR"
        } ${minPrice.toLocaleString()} (${Math.round(ratio * 100)}% competitiveness ratio).`,
        dataPoints: { quotedPrice: price, minPrice, ratio: Math.round(ratio * 100) },
      };
    } else {
      costCriterion = {
        name: "Cost Competitiveness",
        key: "costCompetitiveness",
        rawScore: null,
        normalizedScore: 0,
        weight: weights.costCompetitiveness,
        adjustedWeight: 0,
        weightedScore: 0,
        isAvailable: false,
        evidenceNotes: "No verifiable grand total quoted in document.",
        dataPoints: { quotedPrice: null },
      };
    }

    // --- B. Service Coverage & Inclusions (Weight: default 25%) ---
    const inclusionsCount = q.serviceDetails.servicesIncluded.length;
    const deliverablesCount = q.serviceDetails.deliverables.length;
    const exclusionsCount = q.serviceDetails.servicesExcluded.length;
    const hasSetup = Boolean(q.serviceDetails.setupDetails);
    const hasDismantle = Boolean(q.serviceDetails.dismantlingDetails);
    const hasHours = q.serviceDetails.coverageHours !== null;

    let coverageRaw = Math.round((inclusionsCount / maxInclusions) * 65);
    if (deliverablesCount > 0) coverageRaw += 15;
    if (hasSetup || hasDismantle) coverageRaw += 10;
    if (hasHours) coverageRaw += 10;
    // Deduct slightly for excessive exclusions (> 5)
    if (exclusionsCount > 5) coverageRaw -= 10;
    const coverageScore = Math.max(20, Math.min(100, coverageRaw));

    const coverageCriterion: CriterionScore = {
      name: "Service Coverage",
      key: "serviceCoverage",
      rawScore: coverageScore,
      normalizedScore: coverageScore,
      weight: weights.serviceCoverage,
      adjustedWeight: weights.serviceCoverage,
      weightedScore: 0,
      isAvailable: true,
      evidenceNotes: `${inclusionsCount} included services, ${deliverablesCount} stated deliverables, ${exclusionsCount} exclusions. Setup defined: ${
        hasSetup ? "Yes" : "No"
      }.`,
      dataPoints: {
        inclusionsCount,
        deliverablesCount,
        exclusionsCount,
        hasSetup,
        hasHours,
      },
    };

    // --- C. Quality & Portfolio Evidence (Weight: default 15%) ---
    // Check if document mentions portfolio, sample menu, tasting, photo links, website
    const website = q.vendorDetails.website;
    const textHasPortfolio =
      Boolean(website) ||
      q.serviceDetails.servicesIncluded.some((s) => {
        const lower = s.text.toLowerCase();
        return (
          lower.includes("tasting") ||
          lower.includes("portfolio") ||
          lower.includes("sample") ||
          lower.includes("gallery") ||
          lower.includes("demo")
        );
      }) ||
      q.serviceDetails.deliverables.some((d) => {
        const lower = d.text.toLowerCase();
        return lower.includes("album") || lower.includes("lookbook") || lower.includes("presentation");
      });

    let qualityCriterion: CriterionScore;
    if (textHasPortfolio) {
      let qScore = 75;
      if (website) qScore += 15;
      if (q.serviceDetails.servicesIncluded.some((s) => s.text.toLowerCase().includes("tasting"))) {
        qScore += 10;
      }
      const normalizedQuality = Math.min(100, qScore);
      qualityCriterion = {
        name: "Quality & Portfolio Evidence",
        key: "qualityAndPortfolio",
        rawScore: normalizedQuality,
        normalizedScore: normalizedQuality,
        weight: weights.qualityAndPortfolio,
        adjustedWeight: weights.qualityAndPortfolio,
        weightedScore: 0,
        isAvailable: true,
        evidenceNotes: `Document includes verified portfolio indicators: ${
          website ? `Website (${website})` : "Sample/tasting sessions specified"
        }.`,
        dataPoints: { website, textHasPortfolio },
      };
    } else {
      qualityCriterion = {
        name: "Quality & Portfolio Evidence",
        key: "qualityAndPortfolio",
        rawScore: null,
        normalizedScore: 0,
        weight: weights.qualityAndPortfolio,
        adjustedWeight: 0,
        weightedScore: 0,
        isAvailable: false,
        evidenceNotes: "Quotation document does not provide portfolio samples, gallery URLs, or tasting sessions. Criterion re-normalized.",
        dataPoints: { available: false },
      };
    }

    // --- D. Past Performance (Weight: default 15%) ---
    // Check if quotation document includes reviews, ratings, years of operation, client testimonials
    const allText = [
      q.vendorDetails.vendorName || "",
      ...q.serviceDetails.servicesIncluded.map((s) => s.text),
      ...q.conflictsAndWarnings,
      ...(q.commercialDetails.specialConditions || []),
    ].join(" ").toLowerCase();

    const hasExperienceYears = allText.includes("years of experience") || allText.includes("since 19") || allText.includes("since 20");
    const hasAwards = allText.includes("award") || allText.includes("certified") || allText.includes("recommended");
    const hasTestimonials = allText.includes("testimonial") || allText.includes("review") || allText.includes("clients served");

    let pastPerfCriterion: CriterionScore;
    if (hasExperienceYears || hasAwards || hasTestimonials) {
      let pScore = 70;
      if (hasExperienceYears) pScore += 15;
      if (hasAwards) pScore += 15;
      const normalizedPast = Math.min(100, pScore);
      pastPerfCriterion = {
        name: "Past Performance",
        key: "pastPerformance",
        rawScore: normalizedPast,
        normalizedScore: normalizedPast,
        weight: weights.pastPerformance,
        adjustedWeight: weights.pastPerformance,
        weightedScore: 0,
        isAvailable: true,
        evidenceNotes: `Document provides verified background: ${
          hasExperienceYears ? "Established track record" : ""
        } ${hasAwards ? "Industry recognition/awards" : ""}.`,
        dataPoints: { hasExperienceYears, hasAwards, hasTestimonials },
      };
    } else {
      pastPerfCriterion = {
        name: "Past Performance",
        key: "pastPerformance",
        rawScore: null,
        normalizedScore: 0,
        weight: weights.pastPerformance,
        adjustedWeight: 0,
        weightedScore: 0,
        isAvailable: false,
        evidenceNotes: "Document contains no client testimonials, operational years, or awards. Weight re-normalized across available criteria without penalty.",
        dataPoints: { available: false },
      };
    }

    // --- E. Commercial Terms & Payment Flexibility (Weight: default 10%) ---
    const advPercent = q.commercialDetails.advancePayment?.percentage;
    const hasMilestones = q.commercialDetails.paymentSchedule.length > 1;
    const cancellation = q.commercialDetails.cancellationTerms;
    const refund = q.commercialDetails.refundTerms;

    let termsScore = 60; // baseline
    if (advPercent !== null && advPercent !== undefined) {
      if (advPercent <= 25) termsScore += 25; // low advance risk
      else if (advPercent <= 40) termsScore += 15;
      else if (advPercent <= 50) termsScore += 5;
      else termsScore -= 15; // high upfront advance required
    }
    if (hasMilestones) termsScore += 10;
    if (cancellation || refund) {
      const cancelText = (cancellation || "") + " " + (refund || "");
      if (cancelText.toLowerCase().includes("non-refundable") && !cancelText.toLowerCase().includes("partial")) {
        termsScore -= 10; // strict non-refundable
      } else {
        termsScore += 10; // fair cancellation policy
      }
    } else {
      termsScore -= 10; // no cancellation policy specified
    }
    const normalizedTerms = Math.max(20, Math.min(100, termsScore));

    const termsCriterion: CriterionScore = {
      name: "Commercial Terms",
      key: "commercialTerms",
      rawScore: normalizedTerms,
      normalizedScore: normalizedTerms,
      weight: weights.commercialTerms,
      adjustedWeight: weights.commercialTerms,
      weightedScore: 0,
      isAvailable: true,
      evidenceNotes: `Advance required: ${advPercent !== null && advPercent !== undefined ? `${advPercent}%` : "Not explicitly stated"}. ${
        hasMilestones ? `${q.commercialDetails.paymentSchedule.length} payment milestones.` : "Single payment."
      } Cancellation policy: ${cancellation ? "Explicitly defined" : "Missing / Unspecified"}.`,
      dataPoints: { advPercent, milestones: q.commercialDetails.paymentSchedule.length, cancellation, refund },
    };

    // --- F. Transparency & Financial Audit (Weight: default 5%) ---
    let transparencyScore = 100;
    const discrepancyCount = q.financialAudit.discrepancyFlags.length;
    if (discrepancyCount > 0) {
      transparencyScore -= discrepancyCount * 25;
    }
    if (!q.financialAudit.isValid) {
      transparencyScore -= 20;
    }
    if (q.missingFields.length > 3) {
      transparencyScore -= 15;
    }
    const normalizedTransparency = Math.max(10, Math.min(100, transparencyScore));

    const transparencyCriterion: CriterionScore = {
      name: "Transparency & Financial Audit",
      key: "transparency",
      rawScore: normalizedTransparency,
      normalizedScore: normalizedTransparency,
      weight: weights.transparency,
      adjustedWeight: weights.transparency,
      weightedScore: 0,
      isAvailable: true,
      evidenceNotes: q.financialAudit.isValid
        ? "100% deterministic math match across line items, subtotals, and taxes. Zero discrepancies."
        : `Deterministic financial audit flagged ${discrepancyCount} discrepancy issue(s).`,
      dataPoints: {
        isValid: q.financialAudit.isValid,
        discrepancyCount,
        missingFieldsCount: q.missingFields.length,
      },
    };

    const criteriaRecord: Record<keyof ComparisonWeights, CriterionScore> = {
      costCompetitiveness: costCriterion,
      serviceCoverage: coverageCriterion,
      qualityAndPortfolio: qualityCriterion,
      pastPerformance: pastPerfCriterion,
      commercialTerms: termsCriterion,
      transparency: transparencyCriterion,
    };

    // --- Dynamic Re-Normalization ---
    // Sum weights of available criteria
    const availableCriteria = Object.values(criteriaRecord).filter((c) => c.isAvailable);
    const availableWeightSum = availableCriteria.reduce((sum, c) => sum + c.weight, 0);

    let totalScore = 0;
    const effectiveWeightsSummary: Record<keyof ComparisonWeights, number> = {} as any;

    for (const key of Object.keys(criteriaRecord) as Array<keyof ComparisonWeights>) {
      const criterion = criteriaRecord[key];
      if (criterion.isAvailable && availableWeightSum > 0) {
        // Re-scale weight to sum to 100%
        criterion.adjustedWeight = parseFloat(((criterion.weight / availableWeightSum) * 100).toFixed(2));
        criterion.weightedScore = parseFloat(((criterion.normalizedScore * criterion.adjustedWeight) / 100).toFixed(2));
        totalScore += criterion.weightedScore;
      } else {
        criterion.adjustedWeight = 0;
        criterion.weightedScore = 0;
      }
      effectiveWeightsSummary[key] = criterion.adjustedWeight;
    }

    vendorScores[uploadId] = {
      uploadId,
      vendorName,
      criteria: criteriaRecord,
      totalScore: parseFloat(totalScore.toFixed(2)),
      rank: 0, // determined after sorting
      availableCriteriaCount: availableCriteria.length,
      effectiveWeightsSummary,
    };
  }

  // 3. Assign Rankings
  const rankings = Object.values(vendorScores)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((v, index) => ({
      uploadId: v.uploadId,
      vendorName: v.vendorName,
      totalScore: v.totalScore,
      rank: index + 1,
    }));

  rankings.forEach((r) => {
    if (vendorScores[r.uploadId]) {
      vendorScores[r.uploadId].rank = r.rank;
    }
  });

  const methodologyDescription =
    "Transparent weighted multi-dimensional score (Cost 30%, Scope 25%, Quality 15%, Past Performance 15%, Terms 10%, Audit 5%). When specific evidence is unavailable in the quotation, the criterion is marked unavailable and remaining weights are re-normalized dynamically to 100% so no vendor is penalized for unstated external data.";

  return {
    weights,
    methodologyDescription,
    vendorScores,
    rankings,
  };
}

/**
 * Builds deterministic pros and cons directly from analyzed evidence.
 */
export function buildDeterministicProsAndCons(
  q: QuotationAnalysisResult,
  minPrice: number | null
): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  const price = q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal;
  const currency = q.commercialDetails.currency || "INR";

  // Price pros/cons
  if (price && minPrice && price === minPrice) {
    pros.push(`Lowest overall quoted pricing at ${currency} ${price.toLocaleString()}`);
  } else if (price && minPrice && price > minPrice * 1.35) {
    cons.push(`Premium price point: ${Math.round(((price - minPrice) / minPrice) * 100)}% higher than the lowest quote`);
  }

  // Service coverage pros/cons
  const incCount = q.serviceDetails.servicesIncluded.length;
  if (incCount >= 8) {
    pros.push(`Comprehensive package with ${incCount} distinct service inclusions`);
  } else if (incCount <= 3) {
    cons.push(`Limited inclusions stated (${incCount} item(s)); may require costly add-ons`);
  }

  if (q.serviceDetails.deliverables.length > 0) {
    pros.push(`Explicitly defines ${q.serviceDetails.deliverables.length} tangible deliverables`);
  }

  // Exclusions
  if (q.serviceDetails.servicesExcluded.length > 3) {
    cons.push(`Explicitly excludes ${q.serviceDetails.servicesExcluded.length} service components (e.g. ${q.serviceDetails.servicesExcluded.slice(0, 2).map((e) => e.text).join(", ")})`);
  }

  // Financial Audit
  if (q.financialAudit.isValid) {
    pros.push("100% mathematically verified: line items, subtotals, and taxes strictly match");
  } else {
    cons.push(`Financial audit flagged ${q.financialAudit.discrepancyFlags.length} discrepancy warning(s) in totals`);
  }

  // Commercial Terms
  const adv = q.commercialDetails.advancePayment;
  if (adv?.percentage !== null && adv?.percentage !== undefined) {
    if (adv.percentage <= 25) {
      pros.push(`Favorable booking term: low ${adv.percentage}% advance deposit required`);
    } else if (adv.percentage >= 50) {
      cons.push(`Demands substantial upfront advance deposit (${adv.percentage}%)`);
    }
  }

  if (q.commercialDetails.cancellationTerms) {
    if (q.commercialDetails.cancellationTerms.toLowerCase().includes("non-refundable")) {
      cons.push("Strict cancellation policy: advance payments explicitly non-refundable");
    } else {
      pros.push("Provides structured cancellation and refund conditions");
    }
  } else {
    cons.push("No cancellation or refund terms specified in quotation document");
  }

  if (q.serviceDetails.overtimeCharges) {
    pros.push(`Overtime charges clearly documented: ${q.serviceDetails.overtimeCharges}`);
  }

  return {
    pros: Array.from(new Set(pros)).slice(0, 5),
    cons: Array.from(new Set(cons)).slice(0, 5),
  };
}

/**
 * Generates evidence-based pros and cons using Groq AI, with deterministic fallback.
 */
export async function generateVendorProsAndCons(
  quotations: QuotationAnalysisResult[],
  options: GroqCompletionOptions = {}
): Promise<Record<string, { pros: string[]; cons: string[] }>> {
  const result: Record<string, { pros: string[]; cons: string[] }> = {};

  const validPrices = quotations
    .map((q) => q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

  // First populate deterministic fallback
  for (const q of quotations) {
    result[q.uploadId] = buildDeterministicProsAndCons(q, minPrice);
  }

  // If in mock response or explicitly skipping AI call
  if (options.mockResponse) {
    try {
      const parsed = JSON.parse(options.mockResponse);
      if (parsed.prosAndCons) {
        return parsed.prosAndCons;
      }
    } catch {
      // Use fallback
    }
  }

  // Try calling Groq for enhanced phrasing if API key is present
  try {
    const summaryData = quotations.map((q) => ({
      uploadId: q.uploadId,
      vendorName: q.vendorDetails.vendorName || q.originalName,
      grandTotal: q.commercialDetails.statedGrandTotal,
      currency: q.commercialDetails.currency,
      inclusions: q.serviceDetails.servicesIncluded.map((s) => s.text),
      exclusions: q.serviceDetails.servicesExcluded.map((s) => s.text),
      deliverables: q.serviceDetails.deliverables.map((d) => d.text),
      advancePercent: q.commercialDetails.advancePayment?.percentage,
      cancellation: q.commercialDetails.cancellationTerms,
      overtime: q.serviceDetails.overtimeCharges,
      mathAuditValid: q.financialAudit.isValid,
      discrepancies: q.financialAudit.discrepancyFlags.map((d) => d.message),
    }));

    const systemPrompt = `You are the Lead Wedding Commercial Auditor for Gathbandhan.
You compare wedding vendor quotations and generate strictly evidence-based PROS and CONS.
RULES:
1. Every pro and con MUST be grounded exclusively in the provided extracted quotation data.
2. NEVER invent past performance, awards, online ratings, or reputation not provided in the input.
3. If cancellation, portfolio, or overtime terms are missing, explicitly note that as a con/warning.
4. Return ONLY valid JSON matching this structure:
{
  "prosAndCons": {
    "<uploadId>": {
      "pros": ["bullet 1", "bullet 2", "bullet 3"],
      "cons": ["bullet 1", "bullet 2"]
    }
  }
}`;

    const userPrompt = `Compare the following ${quotations.length} wedding vendor quotations and provide evidence-backed pros and cons for each:
${JSON.stringify(summaryData, null, 2)}`;

    const response = await executeGroqJsonChat(systemPrompt, userPrompt, {
      ...options,
      temperature: 0.1,
    });

    const parsed = JSON.parse(response.rawJson);
    if (parsed.prosAndCons && typeof parsed.prosAndCons === "object") {
      for (const [id, pc] of Object.entries<any>(parsed.prosAndCons)) {
        if (result[id] && Array.isArray(pc.pros) && Array.isArray(pc.cons)) {
          result[id] = {
            pros: pc.pros.slice(0, 5),
            cons: pc.cons.slice(0, 5),
          };
        }
      }
    }
  } catch (err) {
    // Graceful fallback to deterministic pros and cons
    // (Logs omitted to prevent cluttering)
  }

  return result;
}

/**
 * Builds side-by-side comparison matrix rows across commercial, scope, terms, and audit dimensions.
 */
export function buildComparisonMatrix(
  quotations: QuotationAnalysisResult[],
  minPrice: number | null
): ComparisonMatrixRow[] {
  const rows: ComparisonMatrixRow[] = [];

  // Helper to extract values
  const getValues = (fn: (q: QuotationAnalysisResult) => any) => {
    const res: Record<string, any> = {};
    for (const q of quotations) {
      res[q.uploadId] = fn(q);
    }
    return res;
  };

  // 1. Quoted Grand Total
  const totalRow: ComparisonMatrixRow = {
    criterion: "Total Quoted Cost",
    category: "commercial",
    values: getValues((q) => {
      const p = q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal;
      return p ? `${q.commercialDetails.currency || "INR"} ${p.toLocaleString()}` : "Not Stated";
    }),
    notes: "Total proposal amount including taxes and fees",
  };
  if (minPrice) {
    const bestVendor = quotations.find(
      (q) => (q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal) === minPrice
    );
    if (bestVendor) totalRow.highlightBest = bestVendor.uploadId;
  }
  rows.push(totalRow);

  // 2. Line Items Count
  rows.push({
    criterion: "Line Items Itemized",
    category: "commercial",
    values: getValues((q) => `${q.commercialDetails.lineItems.length} items`),
    notes: "Granularity and transparency of itemized billing",
  });

  // 3. Inclusions Count
  const maxInc = Math.max(...quotations.map((q) => q.serviceDetails.servicesIncluded.length));
  const incRow: ComparisonMatrixRow = {
    criterion: "Service Inclusions",
    category: "scope",
    values: getValues((q) => `${q.serviceDetails.servicesIncluded.length} services included`),
    notes: "Volume of bundled services and capabilities",
  };
  const bestIncVendor = quotations.find((q) => q.serviceDetails.servicesIncluded.length === maxInc);
  if (bestIncVendor && maxInc > 0) incRow.highlightBest = bestIncVendor.uploadId;
  rows.push(incRow);

  // 4. Stated Deliverables
  rows.push({
    criterion: "Tangible Deliverables",
    category: "scope",
    values: getValues((q) =>
      q.serviceDetails.deliverables.length > 0
        ? `${q.serviceDetails.deliverables.length} deliverables specified`
        : "None explicitly itemized"
    ),
    notes: "Tangible handover items, reports, or materials",
  });

  // 5. Exclusions
  rows.push({
    criterion: "Service Exclusions",
    category: "scope",
    values: getValues((q) =>
      q.serviceDetails.servicesExcluded.length > 0
        ? `${q.serviceDetails.servicesExcluded.length} exclusions stated`
        : "No explicit exclusions"
    ),
    notes: "Scope boundaries and items requiring client arrangement",
  });

  // 6. Advance Deposit Required
  rows.push({
    criterion: "Advance Deposit Terms",
    category: "terms",
    values: getValues((q) => {
      const adv = q.commercialDetails.advancePayment;
      if (!adv) return "Not specified";
      return adv.percentage !== null ? `${adv.percentage}% required` : adv.amount ? `₹${adv.amount.toLocaleString()}` : "Terms unstated";
    }),
    notes: "Upfront capital requirement prior to event execution",
  });

  // 7. Payment Milestones
  rows.push({
    criterion: "Payment Schedule",
    category: "terms",
    values: getValues((q) => {
      const count = q.commercialDetails.paymentSchedule.length;
      return count > 1 ? `${count} milestone stages` : "Single installment / unstated";
    }),
    notes: "Cash flow flexibility during wedding timeline",
  });

  // 8. Cancellation Policy
  rows.push({
    criterion: "Cancellation & Refund Policy",
    category: "terms",
    values: getValues((q) => {
      const c = q.commercialDetails.cancellationTerms || q.commercialDetails.refundTerms;
      if (!c) return "Not specified in contract";
      return c.length > 45 ? `${c.slice(0, 42)}...` : c;
    }),
    notes: "Protection against force majeure, schedule shifts, or cancellation",
  });

  // 9. Overtime Charges
  rows.push({
    criterion: "Overtime Rate Structure",
    category: "terms",
    values: getValues((q) => q.serviceDetails.overtimeCharges || "Unstated / negotiable"),
    notes: "Financial exposure if wedding programs exceed schedule",
  });

  // 10. Financial Audit Integrity
  const auditRow: ComparisonMatrixRow = {
    criterion: "Deterministic Math Audit",
    category: "financial_audit",
    values: getValues((q) =>
      q.financialAudit.isValid
        ? "100% Math Verified"
        : `Flagged (${q.financialAudit.discrepancyFlags.length} issues)`
    ),
    notes: "Deterministic verification of line items, subtotals, and taxes",
  };
  rows.push(auditRow);

  return rows;
}

/**
 * Produces EXACTLY ONE Final Recommendation based on the top-ranking vendor.
 */
export function generateFinalRecommendation(
  rankings: Array<{ uploadId: string; vendorName: string; totalScore: number; rank: number }>,
  vendorScores: Record<string, VendorScoringBreakdown>,
  quotations: QuotationAnalysisResult[],
  prosAndCons: Record<string, { pros: string[]; cons: string[] }>
): VendorRecommendation {
  if (rankings.length === 0) {
    throw new Error("Cannot generate recommendation without ranked vendors.");
  }

  const top = rankings[0];
  const second = rankings[1];
  const topQuotation = quotations.find((q) => q.uploadId === top.uploadId)!;
  const topScores = vendorScores[top.uploadId];
  const topPC = prosAndCons[top.uploadId] || { pros: [], cons: [] };

  // Check if provisional: score diff < 2.5 points or fewer than 4 available criteria
  const scoreDiff = second ? top.totalScore - second.totalScore : 100;
  const isCloseMatch = scoreDiff < 2.5;
  const isLowEvidence = topScores.availableCriteriaCount < 4;
  const isProvisional = isCloseMatch || isLowEvidence;

  let confidenceLevel: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  if (isCloseMatch && isLowEvidence) confidenceLevel = "LOW";
  else if (isProvisional) confidenceLevel = "MEDIUM";

  const currency = topQuotation.commercialDetails.currency || "INR";
  const price = topQuotation.commercialDetails.statedGrandTotal ?? topQuotation.financialAudit.calculatedGrandTotal;
  const formattedPrice = price ? `${currency} ${price.toLocaleString()}` : "Price TBD";

  const headline = `${top.vendorName} — Ranked #1 Overall (${top.totalScore}/100)`;

  let executiveSummary = `${top.vendorName} achieves the highest composite score (${top.totalScore}/100) across evaluated commercial and operational dimensions.`;
  if (isCloseMatch && second) {
    executiveSummary += ` Note: This recommendation is provisional due to a very close margin (${scoreDiff.toFixed(
      1
    )} pts) against runner-up ${second.vendorName} (${second.totalScore}/100).`;
  }
  if (isLowEvidence) {
    executiveSummary += ` Evidence for portfolio quality and past performance was absent from the quotation PDF, so weights were dynamically re-normalized across cost, coverage, and commercial terms.`;
  }

  // Major advantages (up to 4)
  const majorAdvantages = topPC.pros.length > 0 ? topPC.pros : [
    `Strong balance of cost and deliverables (${formattedPrice})`,
    `${topQuotation.serviceDetails.servicesIncluded.length} explicit service inclusions`,
    topQuotation.financialAudit.isValid ? "Zero mathematical discrepancies in commercial audit" : "Itemized proposal structure",
  ];

  // Commercial disadvantages & trade-offs (up to 3)
  const commercialDisadvantages = topPC.cons.length > 0 ? topPC.cons : [
    topQuotation.commercialDetails.cancellationTerms ? "Cancellation terms are restrictive" : "Cancellation policy not explicitly specified",
    "Overtime charges require written clarification",
  ];

  // Financial audit assessment
  const financialAuditAssessment = {
    status: (topQuotation.financialAudit.isValid ? "VERIFIED" : "WARNING") as "VERIFIED" | "WARNING" | "UNCHECKED",
    details: topQuotation.financialAudit.isValid
      ? `Deterministic math audit fully verified. Calculated grand total (${formattedPrice}) strictly matches stated quotation.`
      : `Audit flagged ${topQuotation.financialAudit.discrepancyFlags.length} discrepancy warning(s). Line items should be reconciled prior to execution.`,
  };

  // Critical uncertainties
  const criticalUncertainties: string[] = [];
  if (!topQuotation.commercialDetails.cancellationTerms) {
    criticalUncertainties.push("No contractual cancellation or refund schedule provided.");
  }
  if (!topQuotation.serviceDetails.overtimeCharges) {
    criticalUncertainties.push("Overtime hourly billing structure is unstated.");
  }
  if (topQuotation.serviceDetails.servicesExcluded.length === 0) {
    criticalUncertainties.push("No explicit exclusions listed; boundaries of client responsibilities are ambiguous.");
  }
  if (criticalUncertainties.length === 0) {
    criticalUncertainties.push("Specific setup timings and load-in permits must be confirmed with venue.");
  }

  // Actionable questions to clarify before signing
  const questionsToClarifyBeforeSigning: string[] = [
    `Can you provide written confirmation of the cancellation and refund schedule in case of date modifications?`,
    `What are the specific overtime charges per hour if the reception extends past scheduled hours?`,
    `Are setup/dismantling hours and crew meal provisions fully included in the ${formattedPrice} total?`,
  ];

  if (!topQuotation.financialAudit.isValid) {
    questionsToClarifyBeforeSigning.unshift(
      `Please reconcile the mathematical discrepancy in line item totals before signing final contract.`
    );
  }

  const advisoryNotice =
    "This AI recommendation is advisory. Gathbandhan provides automated commercial and mathematical auditing, but the wedding planner and couple retain final decision-making authority.";

  return {
    recommendedVendorId: top.uploadId,
    recommendedVendorName: top.vendorName,
    isProvisional,
    confidenceLevel,
    headline,
    executiveSummary,
    majorAdvantages,
    commercialDisadvantages,
    financialAuditAssessment,
    criticalUncertainties,
    questionsToClarifyBeforeSigning,
    advisoryNotice,
  };
}

/**
 * Orchestrates multi-vendor comparison, transparent scoring, and final recommendation.
 */
export async function compareAnalyzedQuotations(
  quotations: QuotationAnalysisResult[],
  customWeights: Partial<ComparisonWeights> = {},
  options: GroqCompletionOptions = {}
): Promise<MultiVendorComparisonResult> {
  if (!quotations || quotations.length < 2) {
    throw new Error("Comparison requires at least two analyzed vendor quotations.");
  }

  // 1. Compatibility Checks
  const categoryCompatibility = checkCategoryCompatibility(quotations);
  const currencyCompatibility = checkCurrencyCompatibility(quotations);

  // 2. Deterministic Scoring
  const scoring = calculateVendorScores(quotations, customWeights);

  // 3. Lowest price reference
  const validPrices = quotations
    .map((q) => q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

  // 4. AI-Assisted / Deterministic Pros & Cons
  const prosAndCons = await generateVendorProsAndCons(quotations, options);

  // 5. Side-by-Side Comparison Matrix
  const matrix = buildComparisonMatrix(quotations, minPrice);

  // 6. Vendor Summaries
  const vendors: ComparedVendorSummary[] = quotations.map((q) => {
    const pc = prosAndCons[q.uploadId] || { pros: [], cons: [] };
    const price = q.commercialDetails.statedGrandTotal ?? q.financialAudit.calculatedGrandTotal;
    const missingInfo: string[] = [];
    if (!q.commercialDetails.cancellationTerms) missingInfo.push("Cancellation terms");
    if (!q.serviceDetails.overtimeCharges) missingInfo.push("Overtime rates");
    if (!q.commercialDetails.advancePayment?.percentage) missingInfo.push("Advance deposit percentage");

    const hiddenCharges: string[] = [];
    if (q.commercialDetails.additionalCharges.length > 0) {
      hiddenCharges.push(
        ...q.commercialDetails.additionalCharges.map((c) => `${c.description} (₹${c.statedAmount || "Unspecified"})`)
      );
    }

    return {
      uploadId: q.uploadId,
      originalName: q.originalName,
      vendorName: q.vendorDetails.vendorName || q.originalName,
      category: q.vendorDetails.category || "General Services",
      statedGrandTotal: q.commercialDetails.statedGrandTotal,
      calculatedGrandTotal: q.financialAudit.calculatedGrandTotal,
      currency: q.commercialDetails.currency || "INR",
      lineItemCount: q.commercialDetails.lineItems.length,
      inclusionsCount: q.serviceDetails.servicesIncluded.length,
      exclusionsCount: q.serviceDetails.servicesExcluded.length,
      financialAuditStatus: q.financialAudit.isValid ? "MATCHED" : "DISCREPANCY",
      discrepancyCount: q.financialAudit.discrepancyFlags.length,
      advancePaymentPercent: q.commercialDetails.advancePayment?.percentage ?? null,
      advancePaymentAmount: q.commercialDetails.advancePayment?.amount ?? null,
      cancellationSummary: q.commercialDetails.cancellationTerms || null,
      refundSummary: q.commercialDetails.refundTerms || null,
      overtimeCharges: q.serviceDetails.overtimeCharges || null,
      paymentScheduleMilestones: q.commercialDetails.paymentSchedule.length,
      pros: pc.pros,
      cons: pc.cons,
      missingInfoAlerts: missingInfo,
      hiddenChargeAlerts: hiddenCharges,
      qualityEvidence: q.vendorDetails.website || null,
      pastPerformanceEvidence: null,
    };
  });

  // 7. Consolidate Alerts
  const financialDiscrepancies: Array<{ vendorName: string; message: string; severity: "critical" | "warning" }> = [];
  const hiddenChargesAlerts: Array<{ vendorName: string; description: string; amount: number | null }> = [];
  const missingCriticalInfo: Array<{ vendorName: string; missingItems: string[] }> = [];

  for (const q of quotations) {
    const vName = q.vendorDetails.vendorName || q.originalName;
    if (!q.financialAudit.isValid) {
      for (const flag of q.financialAudit.discrepancyFlags) {
        financialDiscrepancies.push({
          vendorName: vName,
          message: flag.message,
          severity: flag.severity === "critical" ? "critical" : "warning",
        });
      }
    }

    for (const c of q.commercialDetails.additionalCharges) {
      hiddenChargesAlerts.push({
        vendorName: vName,
        description: c.description,
        amount: c.statedAmount,
      });
    }

    const missingList: string[] = [];
    if (!q.commercialDetails.cancellationTerms) missingList.push("Cancellation terms");
    if (!q.serviceDetails.overtimeCharges) missingList.push("Overtime fee schedule");
    if (!q.commercialDetails.advancePayment?.percentage) missingList.push("Advance deposit percentage");
    if (missingList.length > 0) {
      missingCriticalInfo.push({ vendorName: vName, missingItems: missingList });
    }
  }

  // 8. EXACTLY ONE Final Recommendation
  const recommendation = generateFinalRecommendation(
    scoring.rankings,
    scoring.vendorScores,
    quotations,
    prosAndCons
  );

  return {
    success: true,
    comparisonId: `cmp_${crypto.randomUUID()}`,
    comparedAt: new Date().toISOString(),
    vendors,
    scoring,
    matrix,
    categoryCompatibility,
    currencyCompatibility,
    alerts: {
      financialDiscrepancies,
      hiddenCharges: hiddenChargesAlerts,
      missingCriticalInfo,
    },
    recommendation,
    error: null,
  };
}

/**
 * Retrieves analyzed documents by upload IDs and runs multi-vendor comparison.
 */
export async function compareQuotationsByIds(
  uploadIds: string[],
  customWeights: Partial<ComparisonWeights> = {},
  options: GroqCompletionOptions = {}
): Promise<MultiVendorComparisonResult> {
  if (!uploadIds || uploadIds.length < 2) {
    throw new Error("Please select at least two quotation documents to compare.");
  }

  const analyzedList: QuotationAnalysisResult[] = [];

  for (const id of uploadIds) {
    let analysis = getCachedAnalysis(id);
    if (!analysis) {
      // Analyze quotation on demand if not cached
      analysis = await analyzeQuotationDocument(id, options);
    }

    if (!analysis || !analysis.success) {
      throw new Error(`Quotation with uploadId '${id}' failed analysis and cannot be compared.`);
    }

    analyzedList.push(analysis);
  }

  return compareAnalyzedQuotations(analyzedList, customWeights, options);
}
