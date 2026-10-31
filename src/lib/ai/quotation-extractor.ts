import { z } from "zod";
import { executeGroqJsonChat, GroqCompletionOptions } from "./groq-client";
import {
  ExtractedVendorDetails,
  ExtractedCommercialDetails,
  ExtractedServiceDetails,
} from "./types";
import { ExtractedPage } from "@/lib/pdf/types";

// Zod Schema for strict runtime validation of Groq AI output
export const LineItemSchema = z.object({
  description: z.string().default("Unnamed Item"),
  quantity: z.number().nullable().default(null),
  unit: z.string().nullable().default(null),
  unitPrice: z.number().nullable().default(null),
  statedAmount: z.number().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
  isExplicit: z.boolean().default(true),
});

export const TaxItemSchema = z.object({
  description: z.string().default("Tax"),
  ratePercent: z.number().nullable().default(null),
  statedAmount: z.number().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
});

export const DiscountItemSchema = z.object({
  description: z.string().default("Discount"),
  statedAmount: z.number().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
});

export const ChargeItemSchema = z.object({
  description: z.string().default("Additional Charge"),
  statedAmount: z.number().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
});

export const PaymentScheduleItemSchema = z.object({
  milestone: z.string().default("Payment"),
  percentage: z.number().nullable().default(null),
  statedAmount: z.number().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
});

export const VendorDetailsSchema = z.object({
  vendorName: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  contactPhone: z.string().nullable().default(null),
  contactEmail: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  quotationNumber: z.string().nullable().default(null),
  quotationDate: z.string().nullable().default(null),
  validityDate: z.string().nullable().default(null),
  sourcePage: z.number().nullable().default(null),
  evidenceSnippet: z.string().nullable().default(null),
});

export const CommercialDetailsSchema = z.object({
  currency: z.string().nullable().default("INR"),
  lineItems: z.array(LineItemSchema).default([]),
  statedSubtotal: z.number().nullable().default(null),
  discounts: z.array(DiscountItemSchema).default([]),
  totalDiscount: z.number().nullable().default(null),
  taxes: z.array(TaxItemSchema).default([]),
  totalTax: z.number().nullable().default(null),
  additionalCharges: z.array(ChargeItemSchema).default([]),
  statedGrandTotal: z.number().nullable().default(null),
  paymentSchedule: z.array(PaymentScheduleItemSchema).default([]),
  advancePayment: z
    .object({
      percentage: z.number().nullable().default(null),
      amount: z.number().nullable().default(null),
      terms: z.string().nullable().default(null),
      sourcePage: z.number().nullable().default(null),
    })
    .nullable()
    .default(null),
  cancellationTerms: z.string().nullable().default(null),
  refundTerms: z.string().nullable().default(null),
  specialConditions: z.array(z.string()).default([]),
});

export const ServiceDetailsSchema = z.object({
  servicesIncluded: z
    .array(
      z.object({
        text: z.string(),
        sourcePage: z.number().nullable().default(null),
        evidence: z.string().nullable().default(null),
      })
    )
    .default([]),
  servicesExcluded: z
    .array(
      z.object({
        text: z.string(),
        sourcePage: z.number().nullable().default(null),
        evidence: z.string().nullable().default(null),
      })
    )
    .default([]),
  deliverables: z
    .array(
      z.object({
        text: z.string(),
        sourcePage: z.number().nullable().default(null),
        evidence: z.string().nullable().default(null),
      })
    )
    .default([]),
  guestLimit: z.number().nullable().default(null),
  eventDates: z.array(z.string()).nullable().default(null),
  coverageHours: z.number().nullable().default(null),
  setupDetails: z.string().nullable().default(null),
  dismantlingDetails: z.string().nullable().default(null),
  overtimeCharges: z.string().nullable().default(null),
  optionalAddons: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().nullable().default(null),
        description: z.string().nullable().default(null),
        sourcePage: z.number().nullable().default(null),
      })
    )
    .default([]),
});

export const GroqExtractionOutputSchema = z.object({
  vendorDetails: VendorDetailsSchema,
  commercialDetails: CommercialDetailsSchema,
  serviceDetails: ServiceDetailsSchema,
  conflictsAndWarnings: z.array(z.string()).default([]),
  missingFields: z.array(z.string()).default([]),
});

export type ValidatedGroqOutput = z.infer<typeof GroqExtractionOutputSchema>;

const EXTRACTION_SYSTEM_PROMPT = `
You are the elite Gathbandhan Financial AI Quotation Analyzer.
Your task is to extract exact, high-precision structured data from vendor quotations, RFPs, and estimates for luxury weddings and events.

STRICT ACCURACY RULES:
1. NEVER invent, hallucinate, or calculate missing financial numbers. If an amount is not explicitly stated, return null.
2. DO NOT perform arithmetic or alter stated totals. Output exactly what the vendor wrote in the document.
3. PRESERVE original vendor descriptions verbatim. Do not truncate, translate, or normalize line items.
4. ATTACH sourcePage (1-based integer) and evidenceSnippet (exact short quote from text) to every line item, total, and term.
5. Set "isExplicit": true when a field is verbatim from the document; false if inferred or ambiguous.
6. Identify currency (INR, USD, EUR, etc.). Default to INR if ₹ or Rs or Lakhs/Crores are referenced.
7. Return PURE JSON conforming strictly to the requested schema. Do not include markdown codeblocks or conversational text.
`;

/**
 * Builds the page-labeled prompt payload for Groq.
 */
function buildDocumentPrompt(pages: ExtractedPage[]): string {
  const formattedPages = pages
    .map((p) => {
      const header = `=== START OF PAGE ${p.pageNumber} (${p.method.toUpperCase()} EXTRACTION) ===`;
      const footer = `=== END OF PAGE ${p.pageNumber} ===`;
      return `${header}\n${p.text || "[Empty Page]"}\n${footer}`;
    })
    .join("\n\n");

  return `
Analyze the following multi-page vendor quotation document. Extract all vendor details, commercial line items, financial totals, service inclusions/exclusions, and payment terms into JSON.

DOCUMENT CONTENT:
${formattedPages}

JSON OUTPUT TEMPLATE:
{
  "vendorDetails": {
    "vendorName": string or null,
    "category": string or null,
    "contactPhone": string or null,
    "contactEmail": string or null,
    "address": string or null,
    "website": string or null,
    "quotationNumber": string or null,
    "quotationDate": string or null,
    "validityDate": string or null,
    "sourcePage": number or null,
    "evidenceSnippet": string or null
  },
  "commercialDetails": {
    "currency": "INR",
    "lineItems": [
      {
        "description": string,
        "quantity": number or null,
        "unit": string or null,
        "unitPrice": number or null,
        "statedAmount": number or null,
        "sourcePage": number or null,
        "evidenceSnippet": string or null,
        "isExplicit": boolean
      }
    ],
    "statedSubtotal": number or null,
    "discounts": [{"description": string, "statedAmount": number, "sourcePage": number, "evidenceSnippet": string}],
    "totalDiscount": number or null,
    "taxes": [{"description": string, "ratePercent": number or null, "statedAmount": number or null, "sourcePage": number, "evidenceSnippet": string}],
    "totalTax": number or null,
    "additionalCharges": [{"description": string, "statedAmount": number, "sourcePage": number, "evidenceSnippet": string}],
    "statedGrandTotal": number or null,
    "paymentSchedule": [{"milestone": string, "percentage": number or null, "statedAmount": number or null, "dueDate": string or null, "sourcePage": number, "evidenceSnippet": string}],
    "advancePayment": {"percentage": number or null, "amount": number or null, "terms": string or null, "sourcePage": number or null},
    "cancellationTerms": string or null,
    "refundTerms": string or null,
    "specialConditions": [string]
  },
  "serviceDetails": {
    "servicesIncluded": [{"text": string, "sourcePage": number, "evidence": string}],
    "servicesExcluded": [{"text": string, "sourcePage": number, "evidence": string}],
    "deliverables": [{"text": string, "sourcePage": number, "evidence": string}],
    "guestLimit": number or null,
    "eventDates": [string] or null,
    "coverageHours": number or null,
    "setupDetails": string or null,
    "dismantlingDetails": string or null,
    "overtimeCharges": string or null,
    "optionalAddons": [{"name": string, "price": number or null, "description": string or null, "sourcePage": number or null}]
  },
  "conflictsAndWarnings": [string],
  "missingFields": [string]
}
`;
}

/**
 * Executes Groq AI extraction on the extracted document pages.
 */
export async function extractStructuredQuotationWithGroq(
  pages: ExtractedPage[],
  options: GroqCompletionOptions = {}
): Promise<{ data: ValidatedGroqOutput; model: string }> {
  if (!pages || pages.length === 0) {
    throw new Error("No extracted pages provided for AI quotation analysis.");
  }

  const userPrompt = buildDocumentPrompt(pages);

  const { rawJson, model } = await executeGroqJsonChat(
    EXTRACTION_SYSTEM_PROMPT,
    userPrompt,
    options
  );

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch (err: any) {
    throw new Error(`Groq returned invalid JSON: ${err.message}. Raw: ${rawJson.slice(0, 150)}`);
  }

  // Runtime schema validation via Zod
  const validation = GroqExtractionOutputSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .slice(0, 5)
      .join("; ");
    throw new Error(`Groq AI JSON output failed schema validation: ${errorDetails}`);
  }

  return {
    data: validation.data,
    model,
  };
}
