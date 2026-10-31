import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { leadStatusEnum, packageTypeEnum } from "./enums";
import { users } from "./users";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleName: text("couple_name").notNull(),
    partnerOneName: text("partner_one_name").notNull(),
    partnerOneEmail: text("partner_one_email"),
    partnerOnePhone: text("partner_one_phone"),
    partnerTwoName: text("partner_two_name"),
    partnerTwoPhone: text("partner_two_phone"),
    partnerTwoEmail: text("partner_two_email"),
    source: text("source"),
    eventDate: date("event_date"),
    dateFlexibility: text("date_flexibility").default("EXACT"),
    estimatedGuestCount: integer("estimated_guest_count"),
    estimatedBudgetPaise: bigint("estimated_budget_paise", { mode: "bigint" }),
    city: text("city"),
    venue: text("venue"),
    themeNotes: text("theme_notes"),
    packageType: packageTypeEnum("package_type"),
    status: leadStatusEnum("status").default("NEW").notNull(),
    qualificationStatus: text("qualification_status").default("PENDING").notNull(),
    assignedPlannerId: uuid("assigned_planner_id").references(() => users.id),
    notes: text("notes"),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    lostReason: text("lost_reason"),
    convertedToClientId: uuid("converted_to_client_id"),
    convertedToWeddingId: uuid("converted_to_wedding_id"),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("leads_status_idx").on(table.status),
    index("leads_qualification_status_idx").on(table.qualificationStatus),
    index("leads_assigned_planner_id_idx").on(table.assignedPlannerId),
    index("leads_event_date_idx").on(table.eventDate),
    index("leads_deleted_at_idx").on(table.deletedAt),
    index("leads_converted_client_idx").on(table.convertedToClientId),
  ]
);
