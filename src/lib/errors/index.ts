export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTH_REQUIRED");
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to perform this action",
  ) {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with id '${id}' not found` : `${entity} not found`,
      404,
      "NOT_FOUND",
    );
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.fieldErrors = fieldErrors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class DuplicatePaymentError extends AppError {
  public readonly existingTransactionId?: string;

  constructor(message: string, existingTransactionId?: string) {
    super(message, 409, "DUPLICATE_PAYMENT");
    this.existingTransactionId = existingTransactionId;
  }
}
