CREATE TYPE "public"."inclusion_status" AS ENUM('INCLUDED', 'EXCLUDED', 'OPTIONAL', 'UNSPECIFIED');--> statement-breakpoint
CREATE TYPE "public"."quote_request_status" AS ENUM('OPEN', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('REQUESTED', 'RECEIVED', 'EXTRACTION_PENDING', 'NEEDS_REVIEW', 'VERIFIED', 'SELECTED', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'General',
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'unit' NOT NULL,
	"unit_price_paise" bigint,
	"fixed_charge_paise" bigint,
	"is_per_guest" boolean DEFAULT false NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"service_charge_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"inclusion_status" "inclusion_status" DEFAULT 'INCLUDED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"category" "vendor_category" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_budget_paise" bigint,
	"deadline" timestamp with time zone,
	"status" "quote_request_status" DEFAULT 'OPEN' NOT NULL,
	"selected_quote_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "quote_status" DEFAULT 'REQUESTED' NOT NULL,
	"submitted_at" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"currency" text DEFAULT 'INR' NOT NULL,
	"raw_document_url" text,
	"raw_document_name" text,
	"raw_document_text" text,
	"extraction_status" text DEFAULT 'MANUAL' NOT NULL,
	"confidence_score" numeric(4, 2),
	"extraction_notes" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"base_price_paise" bigint,
	"travel_fee_paise" bigint,
	"overtime_hourly_rate_paise" bigint,
	"tax_rule" text DEFAULT 'GST_18' NOT NULL,
	"service_charge_rule" text DEFAULT 'NONE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_items_quote_id_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quote_requests_wedding_id_idx" ON "quote_requests" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "quote_requests_category_idx" ON "quote_requests" USING btree ("category");--> statement-breakpoint
CREATE INDEX "quote_requests_status_idx" ON "quote_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_quote_request_id_idx" ON "quotes" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "quotes_vendor_id_idx" ON "quotes" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");