import path from "path";
import fs from "fs/promises";
import { getQuotationFile } from "@/lib/storage/temp-quotations";
import { runPdfExtractionScript } from "./text-extractor";
import { ExtractionOptions, ExtractionResult } from "./types";

// In-memory cache of extraction results per upload ID
const extractionCache = new Map<string, ExtractionResult>();

/**
 * Executes or retrieves the hybrid text/OCR extraction for a staged quotation.
 * Guarantees that no internal server paths are exposed to the client.
 */
export async function extractQuotationPdf(
  uploadId: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  if (!uploadId || typeof uploadId !== "string") {
    throw new Error("Missing or invalid uploadId parameter.");
  }

  // 1. Retrieve file from temporary storage
  const fileRecord = await getQuotationFile(uploadId);
  if (!fileRecord) {
    throw new Error(`Quotation with ID "${uploadId}" not found in staging storage.`);
  }

  const { metadata } = fileRecord;

  // 2. Check cache if identical options
  const cacheKey = `${uploadId}_${options.mockOcr ? "mock" : "real"}_${options.minTextLength || 50}`;
  if (extractionCache.has(cacheKey)) {
    return extractionCache.get(cacheKey)!;
  }

  // 3. Execute extraction pipeline
  try {
    const rawResult = await runPdfExtractionScript(
      metadata.filePath,
      metadata.id,
      metadata.originalName,
      options
    );

    // Sanitize any potential filesystem paths in warnings or errors
    const sanitizedWarnings = (rawResult.warnings || []).map(sanitizePath);
    const sanitizedError = rawResult.error ? sanitizePath(rawResult.error) : null;

    const sanitizedPages = rawResult.pages.map((p) => ({
      ...p,
      warnings: (p.warnings || []).map(sanitizePath),
      error: p.error ? sanitizePath(p.error) : null,
    }));

    const result: ExtractionResult = {
      ...rawResult,
      warnings: sanitizedWarnings,
      error: sanitizedError,
      pages: sanitizedPages,
    };

    extractionCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    const safeErrorMsg = sanitizePath(err.message || "Extraction pipeline failure");
    return {
      success: false,
      uploadId: metadata.id,
      originalName: metadata.originalName,
      totalPages: 0,
      status: "failed",
      pages: [],
      summary: {
        textPages: 0,
        ocrPages: 0,
        failedPages: 0,
        totalCharacters: 0,
        totalWords: 0,
      },
      tesseractAvailable: false,
      warnings: [],
      error: safeErrorMsg,
    };
  }
}

/**
 * Removes server paths from strings to protect server internals.
 */
function sanitizePath(str: string): string {
  if (!str) return str;
  // Replace Windows drive paths e.g. C:\... or D:\...
  return str
    .replace(/[A-Za-z]:\\[^"'\s\n\r<>]+/g, "[internal file]")
    .replace(/\/[^"'\s\n\r<>]+(?:\/[^"'\s\n\r<>]+)+/g, "[internal file]");
}

/**
 * Clears cached extraction results.
 */
export function clearExtractionCache(): void {
  extractionCache.clear();
}
