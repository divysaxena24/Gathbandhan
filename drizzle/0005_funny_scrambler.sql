CREATE TABLE "control_room_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text DEFAULT 'WARNING' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"event_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" "incident_severity" DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"owner_id" uuid,
	"vendor_id" uuid,
	"reported_by" text NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"cost_impact_paise" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeline_item_id" uuid NOT NULL,
	"depends_on_item_id" uuid NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"owner_id" uuid,
	"vendor_id" uuid,
	"wedding_vendor_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"is_key_moment" boolean DEFAULT false NOT NULL,
	"location" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"actual_starts_at" timestamp with time zone,
	"actual_ends_at" timestamp with time zone,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_vendor_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"event_id" uuid,
	"token_hash" text NOT NULL,
	"raw_token" text NOT NULL,
	"expected_arrival_at" timestamp with time zone NOT NULL,
	"grace_minutes" integer DEFAULT 15 NOT NULL,
	"status" "check_in_status" DEFAULT 'EXPECTED' NOT NULL,
	"arrived_at" timestamp with time zone,
	"setup_completed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"check_in_source" text,
	"checked_in_by" text,
	"contact_phone" text,
	"notes" text,
	"late_alert_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_check_ins_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "control_room_alerts" ADD CONSTRAINT "control_room_alerts_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_dependencies" ADD CONSTRAINT "timeline_dependencies_timeline_item_id_timeline_items_id_fk" FOREIGN KEY ("timeline_item_id") REFERENCES "public"."timeline_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_dependencies" ADD CONSTRAINT "timeline_dependencies_depends_on_item_id_timeline_items_id_fk" FOREIGN KEY ("depends_on_item_id") REFERENCES "public"."timeline_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_wedding_vendor_id_wedding_vendors_id_fk" FOREIGN KEY ("wedding_vendor_id") REFERENCES "public"."wedding_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_check_ins" ADD CONSTRAINT "vendor_check_ins_wedding_vendor_id_wedding_vendors_id_fk" FOREIGN KEY ("wedding_vendor_id") REFERENCES "public"."wedding_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_check_ins" ADD CONSTRAINT "vendor_check_ins_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_check_ins" ADD CONSTRAINT "vendor_check_ins_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cr_alerts_wedding_id_idx" ON "control_room_alerts" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "cr_alerts_type_idx" ON "control_room_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "cr_alerts_is_dismissed_idx" ON "control_room_alerts" USING btree ("is_dismissed");--> statement-breakpoint
CREATE INDEX "incidents_wedding_id_idx" ON "incidents" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "incidents_event_id_idx" ON "incidents" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timeline_deps_item_id_idx" ON "timeline_dependencies" USING btree ("timeline_item_id");--> statement-breakpoint
CREATE INDEX "timeline_deps_depends_on_idx" ON "timeline_dependencies" USING btree ("depends_on_item_id");--> statement-breakpoint
CREATE INDEX "timeline_items_wedding_id_idx" ON "timeline_items" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "timeline_items_event_id_idx" ON "timeline_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "timeline_items_starts_at_idx" ON "timeline_items" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "timeline_items_status_idx" ON "timeline_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_check_ins_wedding_id_idx" ON "vendor_check_ins" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "vendor_check_ins_vendor_assignment_idx" ON "vendor_check_ins" USING btree ("wedding_vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_check_ins_status_idx" ON "vendor_check_ins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_check_ins_token_hash_idx" ON "vendor_check_ins" USING btree ("token_hash");