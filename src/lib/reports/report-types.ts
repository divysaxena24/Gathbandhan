import { MultiVendorComparisonResult, ComparisonWeights, ComparisonScenarioType } from "@/lib/ai/comparison-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";

export interface ReportMetadata {
  eventName?: string;
  eventDate?: string;
  clientNames?: string;
  preparedBy?: string;
  generatedAt?: string;
}

export interface ReportGenerationInput {
  comparisonResult: MultiVendorComparisonResult;
  analyzedQuotations?: QuotationAnalysisResult[];
  activeScenario?: ComparisonScenarioType | string;
  customWeights?: ComparisonWeights;
  metadata?: ReportMetadata;
}

export interface ExportApiRequest {
  uploadIds?: string[];
  comparisonResult?: MultiVendorComparisonResult;
  analyzedQuotations?: QuotationAnalysisResult[];
  activeScenario?: ComparisonScenarioType | string;
  customWeights?: ComparisonWeights;
  metadata?: ReportMetadata;
}
