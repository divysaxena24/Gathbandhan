CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"actor_id" uuid,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "partner_two_phone" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "partner_two_email" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "date_flexibility" text DEFAULT 'EXACT';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "qualification_status" text DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lost_reason" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "converted_to_wedding_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "converted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "leads_qualification_status_idx" ON "leads" USING btree ("qualification_status");--> statement-breakpoint
CREATE INDEX "leads_converted_client_idx" ON "leads" USING btree ("converted_to_client_id");