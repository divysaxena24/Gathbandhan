import { extractQuotationPdf } from "@/lib/pdf/extraction-service";
import { extractStructuredQuotationWithGroq } from "./quotation-extractor";
import { auditQuotationFinances } from "./financial-validator";
import { QuotationAnalysisResult } from "./types";
import { GroqCompletionOptions } from "./groq-client";

// In-memory cache for analyzed quotation documents
const analysisCache = new Map<string, QuotationAnalysisResult>();

/**
 * Orchestrates the full AI quotation extraction and deterministic financial validation.
 * 1. Reuses Milestone 2 extracted page text without re-extracting.
 * 2. Feeds page-labeled text to Groq AI.
 * 3. Validates AI JSON via Zod.
 * 4. Executes deterministic financial audit.
 */
export async function analyzeQuotationDocument(
  uploadId: string,
  options: GroqCompletionOptions = {}
): Promise<QuotationAnalysisResult> {
  if (!uploadId || typeof uploadId !== "string") {
    throw new Error("Missing or invalid uploadId parameter.");
  }

  // Check cache (if not mocking with unique response)
  const cacheKey = `${uploadId}_${options.model || "default"}_${Boolean(options.mockResponse)}`;
  if (!options.mockResponse && analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  // 1. Retrieve page-level text extraction from Milestone 2
  const pdfExtraction = await extractQuotationPdf(uploadId);
  if (!pdfExtraction.success || pdfExtraction.pages.length === 0) {
    throw new Error(
      pdfExtraction.error || "Unable to extract text from PDF document for AI analysis."
    );
  }

  // 2. Call Groq AI for structured extraction
  const { data: groqData, model } = await extractStructuredQuotationWithGroq(
    pdfExtraction.pages,
    options
  );

  // 3. Perform deterministic financial audit
  const financialAudit = auditQuotationFinances(groqData.commercialDetails);

  // 4. Consolidate warnings and missing fields
  const allWarnings = [
    ...(groqData.conflictsAndWarnings || []),
    ...financialAudit.discrepancyFlags.map((f) => f.message),
    ...(pdfExtraction.warnings || []),
  ];

  const allMissing = [
    ...(groqData.missingFields || []),
    ...financialAudit.missingInformationFlags,
  ];

  const result: QuotationAnalysisResult = {
    success: true,
    uploadId,
    originalName: pdfExtraction.originalName,
    analyzedAt: new Date().toISOString(),
    modelUsed: model,
    vendorDetails: groqData.vendorDetails,
    commercialDetails: groqData.commercialDetails,
    serviceDetails: groqData.serviceDetails,
    financialAudit,
    sourcePageCount: pdfExtraction.totalPages,
    conflictsAndWarnings: Array.from(new Set(allWarnings)),
    missingFields: Array.from(new Set(allMissing)),
    error: null,
  };

  if (!options.mockResponse) {
    analysisCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Retrieves a cached analysis result by uploadId if present.
 */
export function getCachedAnalysis(uploadId: string): QuotationAnalysisResult | undefined {
  for (const [key, val] of analysisCache.entries()) {
    if (key.startsWith(`${uploadId}_`) || val.uploadId === uploadId) {
      return val;
    }
  }
  return undefined;
}

/**
 * Stores an analysis result into the cache.
 */
export function setCachedAnalysis(uploadId: string, result: QuotationAnalysisResult): void {
  const cacheKey = `${uploadId}_default_false`;
  analysisCache.set(cacheKey, result);
}

/**
 * Clears cached analysis results.
 */
export function clearAnalysisCache(): void {
  analysisCache.clear();
}
