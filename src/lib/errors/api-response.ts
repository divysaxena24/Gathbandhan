import { NextResponse } from "next/server";
import {
  AppError,
  ValidationError,
  DuplicatePaymentError,
} from "@/lib/errors";

interface SuccessBody<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface MutationBody<T> {
  data: T;
  message: string;
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    existingTransactionId?: string;
    correlationId?: string;
  };
}

/** Return a JSON success response (200) */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): NextResponse<SuccessBody<T>> {
  return NextResponse.json({ data, meta } satisfies SuccessBody<T>);
}

/** Return a JSON mutation response (200) */
export function mutationResponse<T>(
  data: T,
  message = "Operation completed successfully",
): NextResponse<MutationBody<T>> {
  return NextResponse.json({ data, message } satisfies MutationBody<T>);
}

/** Map any thrown error to a well-formed JSON error response */
export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
        },
      } satisfies ErrorBody,
      { status: error.statusCode },
    );
  }

  if (error instanceof DuplicatePaymentError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          existingTransactionId: error.existingTransactionId,
        },
      } satisfies ErrorBody,
      { status: error.statusCode },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      } satisfies ErrorBody,
      { status: error.statusCode },
    );
  }

  // Unknown / unexpected error — never leak stack traces
  const correlationId = crypto.randomUUID();
  console.error(`[${correlationId}] Unhandled error:`, error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        correlationId,
      },
    } satisfies ErrorBody,
    { status: 500 },
  );
}
