import { relations } from "drizzle-orm";
import { users } from "./users";
import { leads } from "./leads";
import { clients } from "./clients";
import { weddings, weddingEvents } from "./weddings";
import { vendors, weddingVendors } from "./vendors";
import { auditLogs } from "./audit-logs";

// ── User Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
  assignedWeddings: many(weddings),
  auditLogs: many(auditLogs),
}));

// ── Lead Relations ──────────────────────────────────────────────
export const leadsRelations = relations(leads, ({ one }) => ({
  assignedPlanner: one(users, {
    fields: [leads.assignedPlannerId],
    references: [users.id],
  }),
}));

// ── Client Relations ────────────────────────────────────────────
export const clientsRelations = relations(clients, ({ one, many }) => ({
  portalUser: one(users, {
    fields: [clients.portalUserId],
    references: [users.id],
  }),
  convertedFromLead: one(leads, {
    fields: [clients.convertedFromLeadId],
    references: [leads.id],
  }),
  weddings: many(weddings),
}));

// ── Wedding Relations ───────────────────────────────────────────
export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  client: one(clients, {
    fields: [weddings.clientId],
    references: [clients.id],
  }),
  assignedPlanner: one(users, {
    fields: [weddings.assignedPlannerId],
    references: [users.id],
  }),
  events: many(weddingEvents),
  weddingVendors: many(weddingVendors),
}));

// ── Wedding Event Relations ─────────────────────────────────────
export const weddingEventsRelations = relations(
  weddingEvents,
  ({ one, many }) => ({
    wedding: one(weddings, {
      fields: [weddingEvents.weddingId],
      references: [weddings.id],
    }),
    weddingVendors: many(weddingVendors),
  })
);

// ── Vendor Relations ────────────────────────────────────────────
export const vendorsRelations = relations(vendors, ({ many }) => ({
  weddingVendors: many(weddingVendors),
}));

// ── Wedding Vendor (join) Relations ─────────────────────────────
export const weddingVendorsRelations = relations(
  weddingVendors,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [weddingVendors.weddingId],
      references: [weddings.id],
    }),
    vendor: one(vendors, {
      fields: [weddingVendors.vendorId],
      references: [vendors.id],
    }),
    event: one(weddingEvents, {
      fields: [weddingVendors.eventId],
      references: [weddingEvents.id],
    }),
  })
);

// ── Audit Log Relations ─────────────────────────────────────────
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
