CREATE TYPE "public"."check_in_status" AS ENUM('EXPECTED', 'ARRIVED', 'SETUP_COMPLETE', 'WORKING', 'COMPLETED', 'LATE', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('MEHENDI', 'SANGEET', 'CEREMONY', 'RECEPTION', 'AFTER_PARTY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'SENT', 'APPROVED', 'DISPUTED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONVERTED', 'LOST', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."package_type" AS ENUM('FULL_SERVICE', 'PARTIAL', 'DAY_OF');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('TO_PLAN', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('FOUNDER_ADMIN', 'PLANNER', 'FINANCE', 'ONSITE_COORDINATOR', 'VENDOR', 'CLIENT');--> statement-breakpoint
CREATE TYPE "public"."vendor_category" AS ENUM('VENUE', 'CATERING', 'DECORATION', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'DJ_MUSIC', 'MAKEUP', 'MEHENDI_ARTIST', 'LIGHTING', 'ENTERTAINMENT', 'TRANSPORT', 'ACCOMMODATION', 'INVITATION', 'GIFTING', 'PANDIT', 'SECURITY', 'COORDINATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."wedding_lifecycle" AS ENUM('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"reason" text,
	"request_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_name" text NOT NULL,
	"partner_one_name" text NOT NULL,
	"partner_one_email" text,
	"partner_one_phone" text,
	"partner_two_name" text,
	"partner_two_email" text,
	"portal_user_id" uuid,
	"address" text,
	"notes" text,
	"converted_from_lead_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_converted_from_lead_id_unique" UNIQUE("converted_from_lead_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_name" text NOT NULL,
	"partner_one_name" text NOT NULL,
	"partner_one_email" text,
	"partner_one_phone" text,
	"partner_two_name" text,
	"source" text,
	"event_date" timestamp with time zone,
	"estimated_guest_count" integer,
	"estimated_budget_paise" bigint,
	"city" text,
	"venue" text,
	"theme_notes" text,
	"package_type" "package_type",
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"assigned_planner_id" uuid,
	"notes" text,
	"next_follow_up_at" timestamp with time zone,
	"converted_to_client_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_provider_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" "user_role" NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_provider_id_unique" UNIQUE("auth_provider_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "vendor_category" NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"city" text,
	"service_area" text[],
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"average_rating" numeric(3, 2),
	"total_weddings" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wedding_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"name" text NOT NULL,
	"event_type" "event_type" NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"venue" text,
	"expected_guest_count" integer,
	"status" "event_status" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"event_id" uuid,
	"contract_amount_paise" bigint,
	"currency" text DEFAULT 'INR' NOT NULL,
	"scope" text,
	"status" text DEFAULT 'assigned' NOT NULL,
	"terms" text,
	"expected_arrival_at" timestamp with time zone,
	"grace_minutes" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"city" text,
	"venue" text,
	"start_date" date,
	"end_date" date,
	"estimated_guest_count" integer,
	"budget_paise" bigint,
	"package_type" "package_type",
	"lifecycle_status" "wedding_lifecycle" DEFAULT 'PLANNING' NOT NULL,
	"assigned_planner_id" uuid,
	"currency" text DEFAULT 'INR' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_portal_user_id_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_converted_from_lead_id_leads_id_fk" FOREIGN KEY ("converted_from_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_planner_id_users_id_fk" FOREIGN KEY ("assigned_planner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_events" ADD CONSTRAINT "wedding_events_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_vendors" ADD CONSTRAINT "wedding_vendors_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_vendors" ADD CONSTRAINT "wedding_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_vendors" ADD CONSTRAINT "wedding_vendors_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_assigned_planner_id_users_id_fk" FOREIGN KEY ("assigned_planner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_converted_from_lead_id_idx" ON "clients" USING btree ("converted_from_lead_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_assigned_planner_id_idx" ON "leads" USING btree ("assigned_planner_id");--> statement-breakpoint
CREATE INDEX "leads_event_date_idx" ON "leads" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "leads_deleted_at_idx" ON "leads" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_provider_id_idx" ON "users" USING btree ("auth_provider_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vendors_category_idx" ON "vendors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "vendors_city_idx" ON "vendors" USING btree ("city");--> statement-breakpoint
CREATE INDEX "vendors_is_active_idx" ON "vendors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vendors_deleted_at_idx" ON "vendors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "wedding_events_wedding_id_idx" ON "wedding_events" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "wedding_events_event_type_idx" ON "wedding_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "wedding_events_status_idx" ON "wedding_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wedding_vendors_wedding_id_idx" ON "wedding_vendors" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "wedding_vendors_vendor_id_idx" ON "wedding_vendors" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "wedding_vendors_event_id_idx" ON "wedding_vendors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "weddings_client_id_idx" ON "weddings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "weddings_lifecycle_status_idx" ON "weddings" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE INDEX "weddings_assigned_planner_id_idx" ON "weddings" USING btree ("assigned_planner_id");--> statement-breakpoint
CREATE INDEX "weddings_deleted_at_idx" ON "weddings" USING btree ("deleted_at");