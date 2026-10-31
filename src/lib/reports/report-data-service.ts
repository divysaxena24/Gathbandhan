import { ReportGenerationInput, ExportApiRequest } from "./report-types";
import { compareQuotationsByIds } from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/ai/quotation-analyzer-service";

/**
 * Resolves full structured data required for PDF and Excel export.
 */
export async function resolveReportData(input: ExportApiRequest): Promise<ReportGenerationInput> {
  // If full comparisonResult is supplied directly
  if (input.comparisonResult && input.comparisonResult.success) {
    const analyzedList: QuotationAnalysisResult[] = [];

    // First use any directly supplied analyzed quotations from client state
    if (Array.isArray(input.analyzedQuotations) && input.analyzedQuotations.length > 0) {
      for (const q of input.analyzedQuotations) {
        if (q && q.uploadId) {
          analyzedList.push(q);
          setCachedAnalysis(q.uploadId, q);
        }
      }
    }

    // Supplement from cache for any vendor missing in analyzedList
    for (const v of input.comparisonResult.vendors) {
      if (!analyzedList.some((q) => q.uploadId === v.uploadId)) {
        const cached = getCachedAnalysis(v.uploadId);
        if (cached) analyzedList.push(cached);
      }
    }

    return {
      comparisonResult: input.comparisonResult,
      analyzedQuotations: analyzedList,
      activeScenario: input.activeScenario,
      customWeights: input.customWeights,
      metadata: input.metadata || {
        eventName: "Wedding Proposal Comparison",
        generatedAt: new Date().toLocaleDateString(),
        preparedBy: "Gathbandhan AI Quotation Analyzer",
      },
    };
  }

  // If uploadIds are supplied
  if (Array.isArray(input.uploadIds) && input.uploadIds.length >= 2) {
    const comparisonResult = await compareQuotationsByIds(input.uploadIds, input.customWeights);
    const analyzedList: QuotationAnalysisResult[] = [];
    for (const id of input.uploadIds) {
      const cached = getCachedAnalysis(id);
      if (cached) analyzedList.push(cached);
    }

    return {
      comparisonResult,
      analyzedQuotations: analyzedList,
      activeScenario: input.activeScenario,
      customWeights: input.customWeights,
      metadata: input.metadata || {
        eventName: "Wedding Proposal Comparison",
        generatedAt: new Date().toLocaleDateString(),
        preparedBy: "Gathbandhan AI Quotation Analyzer",
      },
    };
  }

  throw new Error("Invalid report request: Either 'comparisonResult' or at least two 'uploadIds' must be provided.");
}
