CREATE TABLE "approved_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"wedding_vendor_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"unit_rate_paise" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"vendor_cost_paise" bigint NOT NULL,
	"client_amount_paise" bigint NOT NULL,
	"billable_to_client" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_payment_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"percentage" numeric(5, 2),
	"amount_paise" bigint NOT NULL,
	"paid_paise" bigint DEFAULT 0 NOT NULL,
	"due_at" date NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"payment_method" text NOT NULL,
	"reference" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"recorded_by" uuid,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_payment_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "vendor_category" NOT NULL,
	"amount_paise" bigint NOT NULL,
	"incurred_at" timestamp with time zone NOT NULL,
	"vendor_id" uuid,
	"billable_to_client" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_vendor_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal_paise" bigint NOT NULL,
	"tax_paise" bigint DEFAULT 0 NOT NULL,
	"total_paise" bigint NOT NULL,
	"paid_paise" bigint DEFAULT 0 NOT NULL,
	"status" "invoice_status" DEFAULT 'SENT' NOT NULL,
	"document_url" text,
	"notes" text,
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" uuid,
	"reconciliation_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"wedding_vendor_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"payment_method" text NOT NULL,
	"reference" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"recorded_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_payment_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "approved_extras" ADD CONSTRAINT "approved_extras_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_extras" ADD CONSTRAINT "approved_extras_wedding_vendor_id_wedding_vendors_id_fk" FOREIGN KEY ("wedding_vendor_id") REFERENCES "public"."wedding_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_extras" ADD CONSTRAINT "approved_extras_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_milestones" ADD CONSTRAINT "client_payment_milestones_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_transactions" ADD CONSTRAINT "client_payment_transactions_milestone_id_client_payment_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."client_payment_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_transactions" ADD CONSTRAINT "client_payment_transactions_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_transactions" ADD CONSTRAINT "client_payment_transactions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_wedding_vendor_id_wedding_vendors_id_fk" FOREIGN KEY ("wedding_vendor_id") REFERENCES "public"."wedding_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_transactions" ADD CONSTRAINT "vendor_payment_transactions_invoice_id_vendor_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."vendor_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_transactions" ADD CONSTRAINT "vendor_payment_transactions_wedding_vendor_id_wedding_vendors_id_fk" FOREIGN KEY ("wedding_vendor_id") REFERENCES "public"."wedding_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_transactions" ADD CONSTRAINT "vendor_payment_transactions_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_transactions" ADD CONSTRAINT "vendor_payment_transactions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approved_extras_wedding_id_idx" ON "approved_extras" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "approved_extras_vendor_idx" ON "approved_extras" USING btree ("wedding_vendor_id");--> statement-breakpoint
CREATE INDEX "approved_extras_status_idx" ON "approved_extras" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_milestones_wedding_id_idx" ON "client_payment_milestones" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "client_milestones_status_idx" ON "client_payment_milestones" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_milestones_due_at_idx" ON "client_payment_milestones" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "client_tx_milestone_id_idx" ON "client_payment_transactions" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "client_tx_wedding_id_idx" ON "client_payment_transactions" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "client_tx_idempotency_idx" ON "client_payment_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "expenses_wedding_id_idx" ON "expenses" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_is_approved_idx" ON "expenses" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "vendor_invoices_wedding_id_idx" ON "vendor_invoices" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_vendor_assignment_idx" ON "vendor_invoices" USING btree ("wedding_vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_status_idx" ON "vendor_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_invoices_number_idx" ON "vendor_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "vendor_tx_invoice_id_idx" ON "vendor_payment_transactions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "vendor_tx_wedding_id_idx" ON "vendor_payment_transactions" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "vendor_tx_idempotency_idx" ON "vendor_payment_transactions" USING btree ("idempotency_key");