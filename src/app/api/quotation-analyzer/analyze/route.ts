/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { analyzeQuotationDocument } from "@/lib/ai/quotation-analyzer-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/quotation-analyzer/analyze
 * Extracts structured quotation data using Groq AI and runs deterministic financial validation.
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

    const result = await analyzeQuotationDocument(uploadId, options);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMsg = error.message || "Quotation AI analysis failed.";
    const isNotFound = errorMsg.includes("not found");
    const isApiKeyMissing = errorMsg.includes("GROQ_API_KEY");
    const isRateLimit = errorMsg.includes("rate limit");

    let statusCode = 500;
    if (isNotFound) statusCode = 404;
    else if (isApiKeyMissing) statusCode = 503;
    else if (isRateLimit) statusCode = 429;

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/quotation-analyzer/analyze?uploadId=...
 * Retrieves analysis results for an uploaded quotation.
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

    const result = await analyzeQuotationDocument(uploadId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve analysis." },
      { status: 500 }
    );
  }
}
