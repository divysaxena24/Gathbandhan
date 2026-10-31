import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { weddings } from "./weddings";
import {
  notificationChannelEnum,
  notificationStatusEnum,
  notificationTemplateEnum,
} from "./enums";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weddingId: uuid("wedding_id").references(() => weddings.id, {
      onDelete: "set null",
    }),
    channel: notificationChannelEnum("channel").notNull().default("IN_APP"),
    template: notificationTemplateEnum("template").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    payload: jsonb("payload"),
    dedupeKey: text("dedupe_key"),
    status: notificationStatusEnum("status").notNull().default("PENDING"),
    providerReference: text("provider_reference"),
    isSimulator: boolean("is_simulator").notNull().default(true),
    errorMessage: text("error_message"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_wedding_id_idx").on(table.weddingId),
    index("notifications_dedupe_key_idx").on(table.dedupeKey),
    index("notifications_status_idx").on(table.status),
    index("notifications_created_at_idx").on(table.createdAt),
  ]
);
