/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { extractQuotationPdf } from "@/lib/pdf/extraction-service";
import { ExtractionOptions } from "@/lib/pdf/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/quotation-analyzer/extract
 * Extracts text and triggers OCR fallback for a staged quotation PDF.
 */
export async function POST(request: NextRequest | Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { uploadId, options = {} } = body;

    if (!uploadId || typeof uploadId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required 'uploadId' string in request body.",
        },
        { status: 400 }
      );
    }

    const extractionOptions: ExtractionOptions = {
      minTextLength: options.minTextLength,
      mockOcr: options.mockOcr,
      tesseractPath: options.tesseractPath,
    };

    const result = await extractQuotationPdf(uploadId, extractionOptions);

    if (!result.success && result.status === "failed") {
      const isNotFound = result.error?.includes("not found");
      const statusCode = isNotFound ? 404 : 422;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during extraction.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quotation-analyzer/extract?uploadId=...
 * Retrieves extraction results for a staged quotation.
 */
export async function GET(request: NextRequest | Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json(
        { success: false, error: "Missing required 'uploadId' parameter." },
        { status: 400 }
      );
    }

    const result = await extractQuotationPdf(uploadId);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve extraction." },
      { status: 500 }
    );
  }
}
