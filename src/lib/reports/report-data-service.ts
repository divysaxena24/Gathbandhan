import { ReportGenerationInput, ExportApiRequest } from "./report-types";
import { compareQuotationsByIds } from "@/lib/ai/vendor-comparison-service";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { getCachedAnalysis } from "@/lib/ai/quotation-analyzer-service";

/**
 * Resolves full structured data required for PDF and Excel export.
 */
export async function resolveReportData(input: ExportApiRequest): Promise<ReportGenerationInput> {
  // If full comparisonResult is supplied directly
  if (input.comparisonResult && input.comparisonResult.success) {
    const analyzedList: QuotationAnalysisResult[] = [];
    for (const v of input.comparisonResult.vendors) {
      const cached = getCachedAnalysis(v.uploadId);
      if (cached) analyzedList.push(cached);
    }

    return {
      comparisonResult: input.comparisonResult,
      analyzedQuotations: analyzedList,
      metadata: input.metadata || {
        eventName: "Wedding Proposal Comparison",
        generatedAt: new Date().toLocaleDateString(),
        preparedBy: "Gathbandhan AI Quotation Analyzer",
      },
    };
  }

  // If uploadIds are supplied
  if (Array.isArray(input.uploadIds) && input.uploadIds.length >= 2) {
    const comparisonResult = await compareQuotationsByIds(input.uploadIds);
    const analyzedList: QuotationAnalysisResult[] = [];
    for (const id of input.uploadIds) {
      const cached = getCachedAnalysis(id);
      if (cached) analyzedList.push(cached);
    }

    return {
      comparisonResult,
      analyzedQuotations: analyzedList,
      metadata: input.metadata || {
        eventName: "Wedding Proposal Comparison",
        generatedAt: new Date().toLocaleDateString(),
        preparedBy: "Gathbandhan AI Quotation Analyzer",
      },
    };
  }

  throw new Error("Invalid report request: Either 'comparisonResult' or at least two 'uploadIds' must be provided.");
}
