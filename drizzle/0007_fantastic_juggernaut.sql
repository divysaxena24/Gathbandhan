CREATE TYPE "public"."agreement_status" AS ENUM('DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."guest_side" AS ENUM('BRIDE', 'GROOM', 'MUTUAL', 'VIP');--> statement-breakpoint
CREATE TYPE "public"."meal_preference" AS ENUM('VEG', 'JAIN', 'NON_VEG', 'VEGAN');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('INVITED', 'ATTENDING', 'DECLINED', 'TENTATIVE');--> statement-breakpoint
CREATE TYPE "public"."transport_status" AS ENUM('SCHEDULED', 'DISPATCHED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"status" "agreement_status" DEFAULT 'DRAFT' NOT NULL,
	"total_amount_paise" bigint NOT NULL,
	"document_url" text,
	"document_hash" text,
	"terms_summary" text,
	"sent_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"signer_name" text,
	"signer_email" text,
	"signer_ip" text,
	"signature_evidence" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accommodation_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"guest_id" uuid,
	"household_name" text,
	"hotel_name" text NOT NULL,
	"room_number" text,
	"room_type" text NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"confirmation_code" text,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_event_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"status" "rsvp_status" DEFAULT 'INVITED' NOT NULL,
	"plus_ones" integer DEFAULT 0 NOT NULL,
	"meal_preference" "meal_preference" DEFAULT 'VEG' NOT NULL,
	"dietary_notes" text,
	"responded_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"household_name" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"side" "guest_side" DEFAULT 'MUTUAL' NOT NULL,
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"dietary_preference" "meal_preference" DEFAULT 'VEG' NOT NULL,
	"allergies" text,
	"accessibility_needs" text,
	"notes" text,
	"rsvp_token" text NOT NULL,
	"invitation_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "guests_rsvp_token_unique" UNIQUE("rsvp_token")
);
--> statement-breakpoint
CREATE TABLE "transport_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"guest_id" uuid,
	"guest_name" text,
	"transfer_type" text NOT NULL,
	"pickup_time" timestamp with time zone NOT NULL,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"vehicle_number" text,
	"driver_name" text,
	"driver_phone" text,
	"passenger_count" integer DEFAULT 1 NOT NULL,
	"status" "transport_status" DEFAULT 'SCHEDULED' NOT NULL,
	"flight_train_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_bookings" ADD CONSTRAINT "accommodation_bookings_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_bookings" ADD CONSTRAINT "accommodation_bookings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_event_rsvps" ADD CONSTRAINT "guest_event_rsvps_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_event_rsvps" ADD CONSTRAINT "guest_event_rsvps_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_event_rsvps" ADD CONSTRAINT "guest_event_rsvps_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agreements_wedding_id_idx" ON "agreements" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "agreements_client_id_idx" ON "agreements" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "agreements_status_idx" ON "agreements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "accommodation_wedding_id_idx" ON "accommodation_bookings" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "accommodation_guest_id_idx" ON "accommodation_bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "accommodation_hotel_idx" ON "accommodation_bookings" USING btree ("hotel_name");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_event_unique_idx" ON "guest_event_rsvps" USING btree ("guest_id","event_id");--> statement-breakpoint
CREATE INDEX "guest_rsvps_wedding_id_idx" ON "guest_event_rsvps" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "guest_rsvps_event_id_idx" ON "guest_event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "guest_rsvps_status_idx" ON "guest_event_rsvps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guests_wedding_id_idx" ON "guests" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "guests_household_idx" ON "guests" USING btree ("household_name");--> statement-breakpoint
CREATE INDEX "guests_side_idx" ON "guests" USING btree ("side");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_rsvp_token_idx" ON "guests" USING btree ("rsvp_token");--> statement-breakpoint
CREATE INDEX "guests_deleted_at_idx" ON "guests" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "transport_wedding_id_idx" ON "transport_assignments" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "transport_pickup_time_idx" ON "transport_assignments" USING btree ("pickup_time");--> statement-breakpoint
CREATE INDEX "transport_status_idx" ON "transport_assignments" USING btree ("status");