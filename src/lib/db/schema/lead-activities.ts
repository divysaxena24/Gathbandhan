import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { users } from "./users";

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    activityType: text("activity_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("lead_activities_lead_id_idx").on(table.leadId),
    index("lead_activities_created_at_idx").on(table.createdAt),
    index("lead_activities_type_idx").on(table.activityType),
  ]
);

