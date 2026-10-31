export type ExtractionMethod = "text" | "ocr";
export type PageExtractionStatus = "success" | "warning" | "error";
export type OverallExtractionStatus = "completed" | "partial" | "failed";

export interface ExtractedPage {
  pageNumber: number; // 1-based index
  text: string;
  method: ExtractionMethod;
  status: PageExtractionStatus;
  confidence: number | null; // Real average OCR confidence percentage (0-100) or null
  charCount: number;
  wordCount: number;
  warnings: string[];
  error: string | null;
}

export interface ExtractionSummary {
  textPages: number;
  ocrPages: number;
  failedPages: number;
  totalCharacters: number;
  totalWords: number;
}

export interface ExtractionResult {
  success: boolean;
  uploadId: string;
  originalName: string;
  totalPages: number;
  status: OverallExtractionStatus;
  pages: ExtractedPage[];
  summary: ExtractionSummary;
  tesseractAvailable: boolean;
  warnings: string[];
  error: string | null;
}

export interface ExtractionOptions {
  minTextLength?: number;
  mockOcr?: boolean;
  tesseractPath?: string;
}
