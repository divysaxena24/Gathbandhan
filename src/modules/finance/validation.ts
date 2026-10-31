import { z } from "zod";

const paiseTransform = z
  .union([z.bigint(), z.number(), z.string()])
  .transform((val) => {
    if (typeof val === "bigint") return val;
    if (typeof val === "number") return BigInt(Math.round(val));
    return BigInt(val || 0);
  });

export const createMilestoneSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  title: z.string().min(2, "Title is required").max(150),
  percentage: z.string().optional().nullable(),
  amountPaise: paiseTransform,
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD"),
  notes: z.string().optional().nullable(),
});

export const recordClientPaymentSchema = z.object({
  milestoneId: z.string().uuid("Invalid milestone ID"),
  amountPaise: paiseTransform,
  paidAt: z.string().datetime({ offset: true }),
  paymentMethod: z.string().min(2, "Payment method is required"),
  reference: z.string().min(3, "Payment reference/UTR is required"),
  idempotencyKey: z.string().min(8, "Idempotency key must be at least 8 characters"),
  allowBusinessDuplicate: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const createVendorInvoiceSchema = z
  .object({
    weddingVendorId: z.string().uuid("Invalid wedding vendor assignment ID"),
    invoiceNumber: z.string().min(2, "Invoice number is required"),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD"),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD"),
    subtotalPaise: paiseTransform,
    taxPaise: paiseTransform.default(0n),
    totalPaise: paiseTransform,
    documentUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.totalPaise >= data.subtotalPaise, {
    message: "Total amount must be greater than or equal to subtotal",
    path: ["totalPaise"],
  });

export const recordVendorPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  amountPaise: paiseTransform,
  paidAt: z.string().datetime({ offset: true }),
  paymentMethod: z.string().min(2, "Payment method is required"),
  reference: z.string().min(3, "Bank UTR / Transaction reference is required"),
  idempotencyKey: z.string().min(8, "Idempotency key must be at least 8 characters"),
  allowBusinessDuplicate: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const reconcileInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  approvedExtrasAllowed: z.boolean().default(true),
  reconciliationNotes: z.string().optional().nullable(),
});

export const createExpenseSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  title: z.string().min(2, "Title is required"),
  category: z.string().min(2, "Category is required"),
  amountPaise: paiseTransform,
  incurredAt: z.string().datetime({ offset: true }),
  vendorId: z.string().uuid().optional().nullable(),
  billableToClient: z.boolean().default(false),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createApprovedExtraSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  weddingVendorId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  category: z.string().min(2, "Category is required"),
  unitRatePaise: paiseTransform,
  quantity: z.number().int().min(1).default(1),
  vendorCostPaise: paiseTransform,
  clientAmountPaise: paiseTransform,
  billableToClient: z.boolean().default(true),
});
