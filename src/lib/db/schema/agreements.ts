import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { agreementStatusEnum } from "./enums";
import { weddings } from "./weddings";
import { clients } from "./clients";

// ── Client Agreements & Contracts ─────────────────────────────────
export const agreements = pgTable(
  "agreements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weddingId: uuid("wedding_id")
      .references(() => weddings.id)
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    title: text("title").notNull(), // e.g. "Master Wedding Planning & Coordination Agreement"
    version: text("version").default("1.0").notNull(),
    status: agreementStatusEnum("status").default("DRAFT").notNull(),
    totalAmountPaise: bigint("total_amount_paise", { mode: "bigint" }).notNull(),
    documentUrl: text("document_url"),
    documentHash: text("document_hash"), // SHA-256 integrity hash of document text/content
    termsSummary: text("terms_summary"), // Summary of scope, packages, payment tranches
    sentAt: timestamp("sent_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signerName: text("signer_name"),
    signerEmail: text("signer_email"),
    signerIp: text("signer_ip"),
    signatureEvidence: text("signature_evidence"), // Electronic acceptance disclaimer & audit payload
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agreements_wedding_id_idx").on(table.weddingId),
    index("agreements_client_id_idx").on(table.clientId),
    index("agreements_status_idx").on(table.status),
  ]
);

