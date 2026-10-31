/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { compareQuotationsByIds } from "@/lib/ai/vendor-comparison-service";
import { ComparisonWeights } from "@/lib/ai/comparison-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/quotation-analyzer/compare
 * Compares two or more analyzed vendor quotations, generates transparent weighted scoring,
 * produces evidence-based pros and cons, and returns exactly one final recommendation.
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

    const { uploadIds, weights } = body;

    if (!Array.isArray(uploadIds) || uploadIds.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "At least two analyzed quotation IDs are required for vendor comparison.",
        },
        { status: 400 }
      );
    }

    // Validate ID elements
    const validIds = uploadIds.filter((id) => typeof id === "string" && id.trim().length > 0);
    if (validIds.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid upload IDs provided. Please provide an array of valid quotation IDs.",
        },
        { status: 400 }
      );
    }

    // Execute comparison engine
    const result = await compareQuotationsByIds(validIds, weights as Partial<ComparisonWeights>);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMsg = error.message || "Vendor comparison failed.";
    const isNotFound = errorMsg.includes("not found") || errorMsg.includes("does not exist");
    const isRateLimit = errorMsg.includes("rate limit");
    const isBadRequest =
      errorMsg.includes("select at least two") ||
      errorMsg.includes("failed analysis") ||
      errorMsg.includes("cannot be compared");

    let statusCode = 500;
    if (isBadRequest) statusCode = 400;
    else if (isNotFound) statusCode = 404;
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
