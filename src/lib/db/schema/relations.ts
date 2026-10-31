import { relations } from "drizzle-orm";
import { users } from "./users";
import { leads } from "./leads";
import { leadActivities } from "./lead-activities";
import { clients } from "./clients";
import { weddings, weddingEvents } from "./weddings";
import { vendors, weddingVendors } from "./vendors";
import { quoteRequests, quotes, quoteItems } from "./quotes";
import {
  taskTemplates,
  taskTemplateDependencies,
  tasks,
  taskDependencies,
} from "./tasks";
import {
  timelineItems,
  timelineDependencies,
  vendorCheckIns,
  incidents,
  controlRoomAlerts,
} from "./control-room";
import { auditLogs } from "./audit-logs";

// ── User Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
  assignedWeddings: many(weddings),
  auditLogs: many(auditLogs),
  leadActivities: many(leadActivities),
  assignedTasks: many(tasks),
}));

// ── Lead Relations ──────────────────────────────────────────────
export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedPlanner: one(users, {
    fields: [leads.assignedPlannerId],
    references: [users.id],
  }),
  convertedToClient: one(clients, {
    fields: [leads.convertedToClientId],
    references: [clients.id],
  }),
  convertedToWedding: one(weddings, {
    fields: [leads.convertedToWeddingId],
    references: [weddings.id],
  }),
  activities: many(leadActivities),
}));

// ── Lead Activity Relations ─────────────────────────────────────
export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  actor: one(users, {
    fields: [leadActivities.actorId],
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
  quoteRequests: many(quoteRequests),
  tasks: many(tasks),
  timelineItems: many(timelineItems),
  vendorCheckIns: many(vendorCheckIns),
  incidents: many(incidents),
  controlRoomAlerts: many(controlRoomAlerts),
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
    timelineItems: many(timelineItems),
    vendorCheckIns: many(vendorCheckIns),
    incidents: many(incidents),
  })
);

// ── Vendor Relations ────────────────────────────────────────────
export const vendorsRelations = relations(vendors, ({ many }) => ({
  weddingVendors: many(weddingVendors),
  quotes: many(quotes),
}));

// ── Wedding Vendor (join) Relations ─────────────────────────────
export const weddingVendorsRelations = relations(
  weddingVendors,
  ({ one, many }) => ({
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
    vendorCheckIns: many(vendorCheckIns),
  })
);

// ── Quote Request Relations ─────────────────────────────────────
export const quoteRequestsRelations = relations(
  quoteRequests,
  ({ one, many }) => ({
    wedding: one(weddings, {
      fields: [quoteRequests.weddingId],
      references: [weddings.id],
    }),
    quotes: many(quotes),
    selectedQuote: one(quotes, {
      fields: [quoteRequests.selectedQuoteId],
      references: [quotes.id],
    }),
  })
);

// ── Quote Relations ─────────────────────────────────────────────
export const quotesRelations = relations(quotes, ({ one, many }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quotes.quoteRequestId],
    references: [quoteRequests.id],
  }),
  vendor: one(vendors, {
    fields: [quotes.vendorId],
    references: [vendors.id],
  }),
  reviewedBy: one(users, {
    fields: [quotes.reviewedById],
    references: [users.id],
  }),
  items: many(quoteItems),
}));

// ── Quote Item Relations ────────────────────────────────────────
export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

// ── Task Template Relations ─────────────────────────────────────
export const taskTemplatesRelations = relations(
  taskTemplates,
  ({ many }) => ({
    dependencies: many(taskTemplateDependencies, {
      relationName: "templateDeps",
    }),
    dependentOnThis: many(taskTemplateDependencies, {
      relationName: "dependsOnTemplateDeps",
    }),
  })
);

export const taskTemplateDependenciesRelations = relations(
  taskTemplateDependencies,
  ({ one }) => ({
    template: one(taskTemplates, {
      fields: [taskTemplateDependencies.templateId],
      references: [taskTemplates.id],
      relationName: "templateDeps",
    }),
    dependsOnTemplate: one(taskTemplates, {
      fields: [taskTemplateDependencies.dependsOnTemplateId],
      references: [taskTemplates.id],
      relationName: "dependsOnTemplateDeps",
    }),
  })
);

// ── Task Relations ──────────────────────────────────────────────
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [tasks.weddingId],
    references: [weddings.id],
  }),
  event: one(weddingEvents, {
    fields: [tasks.eventId],
    references: [weddingEvents.id],
  }),
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
  sourceTemplate: one(taskTemplates, {
    fields: [tasks.sourceTemplateId],
    references: [taskTemplates.id],
  }),
  dependencies: many(taskDependencies, {
    relationName: "taskDeps",
  }),
  dependentTasks: many(taskDependencies, {
    relationName: "dependsOnTaskDeps",
  }),
}));

export const taskDependenciesRelations = relations(
  taskDependencies,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskDependencies.taskId],
      references: [tasks.id],
      relationName: "taskDeps",
    }),
    dependsOnTask: one(tasks, {
      fields: [taskDependencies.dependsOnTaskId],
      references: [tasks.id],
      relationName: "dependsOnTaskDeps",
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

// ── Control Room: Timeline Relations ───────────────────────────
export const timelineItemsRelations = relations(
  timelineItems,
  ({ one, many }) => ({
    wedding: one(weddings, {
      fields: [timelineItems.weddingId],
      references: [weddings.id],
    }),
    event: one(weddingEvents, {
      fields: [timelineItems.eventId],
      references: [weddingEvents.id],
    }),
    owner: one(users, {
      fields: [timelineItems.ownerId],
      references: [users.id],
    }),
    vendor: one(vendors, {
      fields: [timelineItems.vendorId],
      references: [vendors.id],
    }),
    weddingVendor: one(weddingVendors, {
      fields: [timelineItems.weddingVendorId],
      references: [weddingVendors.id],
    }),
    dependencies: many(timelineDependencies, {
      relationName: "timelineDeps",
    }),
    dependentItems: many(timelineDependencies, {
      relationName: "dependsOnTimelineDeps",
    }),
  })
);

export const timelineDependenciesRelations = relations(
  timelineDependencies,
  ({ one }) => ({
    timelineItem: one(timelineItems, {
      fields: [timelineDependencies.timelineItemId],
      references: [timelineItems.id],
      relationName: "timelineDeps",
    }),
    dependsOnItem: one(timelineItems, {
      fields: [timelineDependencies.dependsOnItemId],
      references: [timelineItems.id],
      relationName: "dependsOnTimelineDeps",
    }),
  })
);

// ── Control Room: Vendor Check-in Relations ────────────────────
export const vendorCheckInsRelations = relations(
  vendorCheckIns,
  ({ one }) => ({
    weddingVendor: one(weddingVendors, {
      fields: [vendorCheckIns.weddingVendorId],
      references: [weddingVendors.id],
    }),
    wedding: one(weddings, {
      fields: [vendorCheckIns.weddingId],
      references: [weddings.id],
    }),
    event: one(weddingEvents, {
      fields: [vendorCheckIns.eventId],
      references: [weddingEvents.id],
    }),
  })
);

// ── Control Room: Incident Relations ───────────────────────────
export const incidentsRelations = relations(incidents, ({ one }) => ({
  wedding: one(weddings, {
    fields: [incidents.weddingId],
    references: [weddings.id],
  }),
  event: one(weddingEvents, {
    fields: [incidents.eventId],
    references: [weddingEvents.id],
  }),
  owner: one(users, {
    fields: [incidents.ownerId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [incidents.vendorId],
    references: [vendors.id],
  }),
}));

// ── Control Room: Alert Relations ──────────────────────────────
export const controlRoomAlertsRelations = relations(
  controlRoomAlerts,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [controlRoomAlerts.weddingId],
      references: [weddings.id],
    }),
  })
);
