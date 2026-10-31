import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  DuplicatePaymentError,
} from "@/lib/errors";

describe("Domain errors", () => {
  it("creates AppError with correct properties", () => {
    const error = new AppError("test", 500, "TEST");
    expect(error.message).toBe("test");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("TEST");
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("creates AuthError", () => {
    const error = new AuthError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_REQUIRED");
  });

  it("creates ForbiddenError", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("creates NotFoundError with entity details", () => {
    const error = new NotFoundError("Wedding", "abc-123");
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain("Wedding");
    expect(error.message).toContain("abc-123");
  });

  it("creates ValidationError with field errors", () => {
    const error = new ValidationError("Invalid input", {
      email: ["Required"],
      name: ["Too short"],
    });
    expect(error.statusCode).toBe(400);
    expect(error.fieldErrors.email).toEqual(["Required"]);
  });

  it("creates ConflictError", () => {
    const error = new ConflictError("Lead already converted");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("creates DuplicatePaymentError", () => {
    const error = new DuplicatePaymentError("Duplicate payment detected", "txn-123");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("DUPLICATE_PAYMENT");
    expect(error.existingTransactionId).toBe("txn-123");
  });
});

