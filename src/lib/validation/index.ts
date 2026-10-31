import { z } from "zod";

/** Validates a UUID v4 string */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/** Pagination params — page starts at 1, pageSize max 100 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationParams = z.infer<typeof paginationSchema>;

/** Validates an ISO 8601 date string */
export const dateSchema = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format. Expected ISO 8601 string." },
  );

/** Validates an Indian phone number (E.164: +91 followed by 10 digits) */
export const phoneSchema = z
  .string()
  .regex(
    /^\+91[6-9]\d{9}$/,
    "Invalid Indian phone number. Expected format: +91XXXXXXXXXX",
  );

/** Validates a well-formed email address */
export const emailSchema = z.string().email("Invalid email address");

/** Validates a positive bigint value representing money in paise */
export const paiseSchema = z.coerce
  .bigint()
  .refine((val) => val >= 0n, { message: "Amount in paise must be non-negative" });

/**
 * Parse a human-readable INR string (e.g. "1,50,000" or "150000") to paise.
 * Strips ₹ symbol, commas, and optional decimal places (max 2).
 */
export const inrDisplaySchema = z
  .string()
  .transform((val) => val.replace(/[₹,\s]/g, ""))
  .pipe(
    z.string().regex(
      /^\d+(\.\d{1,2})?$/,
      "Invalid INR amount. Use digits with optional 2 decimal places.",
    ),
  )
  .transform((cleaned) => {
    const rupees = parseFloat(cleaned);
    return BigInt(Math.round(rupees * 100));
  });
