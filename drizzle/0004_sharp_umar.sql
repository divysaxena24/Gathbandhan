CREATE TABLE "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_template_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"depends_on_template_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_type" "package_type",
	"category" text DEFAULT 'General' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"default_priority" text DEFAULT 'MEDIUM' NOT NULL,
	"offset_days" integer NOT NULL,
	"reference_event" text DEFAULT 'WEDDING_START' NOT NULL,
	"estimated_minutes" integer DEFAULT 120 NOT NULL,
	"suggested_role" text DEFAULT 'PLANNER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"event_id" uuid,
	"source_template_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'General' NOT NULL,
	"owner_id" uuid,
	"status" "task_status" DEFAULT 'TO_PLAN' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"estimated_minutes" integer DEFAULT 60 NOT NULL,
	"actual_minutes" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"is_critical_path" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_template_dependencies" ADD CONSTRAINT "task_template_dependencies_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_template_dependencies" ADD CONSTRAINT "task_template_dependencies_depends_on_template_id_task_templates_id_fk" FOREIGN KEY ("depends_on_template_id") REFERENCES "public"."task_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_wedding_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."wedding_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_template_id_task_templates_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."task_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_deps_task_id_idx" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_deps_depends_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "task_template_deps_template_id_idx" ON "task_template_dependencies" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "task_template_deps_depends_idx" ON "task_template_dependencies" USING btree ("depends_on_template_id");--> statement-breakpoint
CREATE INDEX "task_templates_package_type_idx" ON "task_templates" USING btree ("package_type");--> statement-breakpoint
CREATE INDEX "task_templates_category_idx" ON "task_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tasks_wedding_id_idx" ON "tasks" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "tasks_owner_id_idx" ON "tasks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_at_idx" ON "tasks" USING btree ("due_at");