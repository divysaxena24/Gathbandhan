CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'WHATSAPP', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'READ');--> statement-breakpoint
CREATE TYPE "public"."notification_template" AS ENUM('LEAD_FOLLOW_UP', 'TASK_DEADLINE', 'CLIENT_PAYMENT_DUE', 'VENDOR_PAYMENT_DUE', 'VENDOR_LATE', 'INCIDENT_ALERT', 'AGREEMENT_SIGNED');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wedding_id" uuid,
	"channel" "notification_channel" DEFAULT 'IN_APP' NOT NULL,
	"template" "notification_template" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"payload" jsonb,
	"dedupe_key" text,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"provider_reference" text,
	"is_simulator" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_wedding_id_idx" ON "notifications" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "notifications_dedupe_key_idx" ON "notifications" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");