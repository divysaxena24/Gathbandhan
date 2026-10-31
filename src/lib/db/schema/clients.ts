import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { leads } from "./leads";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleName: text("couple_name").notNull(),
    partnerOneName: text("partner_one_name").notNull(),
    partnerOneEmail: text("partner_one_email"),
    partnerOnePhone: text("partner_one_phone"),
    partnerTwoName: text("partner_two_name"),
    partnerTwoEmail: text("partner_two_email"),
    portalUserId: uuid("portal_user_id").references(() => users.id),
    address: text("address"),
    notes: text("notes"),
    convertedFromLeadId: uuid("converted_from_lead_id")
      .references(() => leads.id)
      .unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("clients_converted_from_lead_id_idx").on(
      table.convertedFromLeadId
    ),
  ]
);
