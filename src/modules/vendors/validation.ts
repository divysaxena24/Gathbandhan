import { z } from "zod";

export const vendorCategoryEnumSchema = z.enum([
  "VENUE",
  "CATERING",
  "DECORATION",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "DJ_MUSIC",
  "MAKEUP",
  "MEHENDI_ARTIST",
  "LIGHTING",
  "ENTERTAINMENT",
  "TRANSPORT",
  "ACCOMMODATION",
  "INVITATION",
  "GIFTING",
  "PANDIT",
  "SECURITY",
  "COORDINATION",
  "OTHER",
]);

export const quoteRequestStatusEnumSchema = z.enum([
  "OPEN",
  "CLOSED",
  "CANCELLED",
]);

export const quoteStatusEnumSchema = z.enum([
  "REQUESTED",
  "RECEIVED",
  "EXTRACTION_PENDING",
  "NEEDS_REVIEW",
  "VERIFIED",
  "SELECTED",
  "REJECTED",
  "CLOSED",
]);

export const inclusionStatusEnumSchema = z.enum([
  "INCLUDED",
  "EXCLUDED",
  "OPTIONAL",
  "UNSPECIFIED",
]);

// ── Vendor Validation ───────────────────────────────────────────
export const createVendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  category: vendorCategoryEnumSchema,
  contactName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().nullable(),
  city: z.string().optional().nullable(),
  serviceArea: z.array(z.string()).optional().default([]),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  averageRating: z.string().optional().nullable(),
});

export const updateVendorSchema = createVendorSchema.partial();

// ── Quote Request Validation ────────────────────────────────────
export const createQuoteRequestSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  category: vendorCategoryEnumSchema,
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  targetBudgetPaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      return BigInt(val);
    }),
  deadline: z.string().optional().nullable(),
});

export const updateQuoteRequestSchema = createQuoteRequestSchema.partial();

// ── Quote Item Validation ───────────────────────────────────────
export const quoteItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.string().optional().default("General"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unit: z.string().default("plate"),
  unitPricePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((val) => BigInt(val || 0)),
  fixedChargePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .default(0)
    .transform((val) => BigInt(val || 0)),
  isPerGuest: z.boolean().default(false),
  taxPercent: z.string().default("18.00"),
  serviceChargePercent: z.string().default("0.00"),
  inclusionStatus: inclusionStatusEnumSchema.default("INCLUDED"),
  notes: z.string().optional().nullable(),
});

// ── Quote Validation ────────────────────────────────────────────
export const createQuoteSchema = z.object({
  quoteRequestId: z.string().uuid("Invalid quote request ID"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  submittedAt: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  currency: z.string().default("INR"),
  rawDocumentUrl: z.string().optional().nullable(),
  rawDocumentName: z.string().optional().nullable(),
  rawDocumentText: z.string().optional().nullable(),
  extractionStatus: z.string().default("MANUAL"),
  confidenceScore: z.string().optional().nullable(),
  extractionNotes: z.string().optional().nullable(),
  basePricePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .default(0)
    .transform((val) => BigInt(val || 0)),
  travelFeePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .default(0)
    .transform((val) => BigInt(val || 0)),
  overtimeHourlyRatePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .default(0)
    .transform((val) => BigInt(val || 0)),
  taxRule: z.string().default("GST_18"),
  serviceChargeRule: z.string().default("NONE"),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).optional().default([]),
});

export const updateQuoteSchema = createQuoteSchema.partial();

// ── Human Review Verification ───────────────────────────────────
export const reviewQuoteSchema = z.object({
  status: z.enum(["VERIFIED", "NEEDS_REVIEW", "REJECTED"]),
  items: z.array(quoteItemSchema.extend({ id: z.string().optional() })).optional(),
  basePricePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .transform((val) => (val !== undefined ? BigInt(val) : undefined)),
  travelFeePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .transform((val) => (val !== undefined ? BigInt(val) : undefined)),
  overtimeHourlyRatePaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .transform((val) => (val !== undefined ? BigInt(val) : undefined)),
  notes: z.string().optional().nullable(),
});

// ── Quote Selection Schema ──────────────────────────────────────
export const selectQuoteSchema = z.object({
  eventId: z.string().uuid("Invalid event ID").optional().nullable(),
  contractAmountPaise: z
    .union([z.string(), z.number(), z.bigint()])
    .optional()
    .transform((val) => (val !== undefined && val !== null ? BigInt(val) : undefined)),
  scope: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

// ── Comparison Scenario & Weights Schema ────────────────────────
export const compareQuotesSchema = z.object({
  quoteIds: z.array(z.string().uuid()).min(2, "At least 2 quotes are required for comparison"),
  scenario: z.object({
    guestCount: z.number().int().min(1, "Guest count must be at least 1").default(400),
    overtimeHours: z.number().min(0).default(0),
  }),
  weights: z
    .object({
      cost: z.number().min(0).max(1).default(0.4),
      reliability: z.number().min(0).max(1).default(0.25),
      quality: z.number().min(0).max(1).default(0.2),
      inclusions: z.number().min(0).max(1).default(0.15),
    })
    .refine(
      (w) => Math.abs(w.cost + w.reliability + w.quality + w.inclusions - 1.0) < 0.01,
      { message: "Weights must sum to 1.0 (100%)" }
    ),
});
