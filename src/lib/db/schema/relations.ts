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
import {
  clientPaymentMilestones,
  clientPaymentTransactions,
  vendorInvoices,
  vendorPaymentTransactions,
  expenses,
  approvedExtras,
  clientBills,
  clientBillItems,
  clientBillInstallments,
  virtualPaymentSessions,
  virtualPaymentTransactions,
  virtualPaymentAllocations,
} from "./finance";
import {
  guests,
  guestEventRsvps,
  accommodationBookings,
  transportAssignments,
} from "./guests";
import { agreements } from "./agreements";
import { notifications } from "./notifications";
import { auditLogs } from "./audit-logs";

// ── User Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
  assignedWeddings: many(weddings),
  auditLogs: many(auditLogs),
  leadActivities: many(leadActivities),
  assignedTasks: many(tasks),
  notifications: many(notifications),
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
  clientPaymentMilestones: many(clientPaymentMilestones),
  clientPaymentTransactions: many(clientPaymentTransactions),
  vendorInvoices: many(vendorInvoices),
  vendorPaymentTransactions: many(vendorPaymentTransactions),
  expenses: many(expenses),
  approvedExtras: many(approvedExtras),
  guests: many(guests),
  guestEventRsvps: many(guestEventRsvps),
  accommodationBookings: many(accommodationBookings),
  transportAssignments: many(transportAssignments),
  agreements: many(agreements),
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
    guestEventRsvps: many(guestEventRsvps),
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
    invoices: many(vendorInvoices),
    payments: many(vendorPaymentTransactions),
    approvedExtras: many(approvedExtras),
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

// ── Finance: Client Milestone & Transaction Relations ───────────
export const clientPaymentMilestonesRelations = relations(
  clientPaymentMilestones,
  ({ one, many }) => ({
    wedding: one(weddings, {
      fields: [clientPaymentMilestones.weddingId],
      references: [weddings.id],
    }),
    transactions: many(clientPaymentTransactions),
  })
);

export const clientPaymentTransactionsRelations = relations(
  clientPaymentTransactions,
  ({ one }) => ({
    milestone: one(clientPaymentMilestones, {
      fields: [clientPaymentTransactions.milestoneId],
      references: [clientPaymentMilestones.id],
    }),
    wedding: one(weddings, {
      fields: [clientPaymentTransactions.weddingId],
      references: [weddings.id],
    }),
    recordedByUser: one(users, {
      fields: [clientPaymentTransactions.recordedBy],
      references: [users.id],
    }),
  })
);

// ── Finance: Vendor Invoice & Payment Relations ─────────────────
export const vendorInvoicesRelations = relations(
  vendorInvoices,
  ({ one, many }) => ({
    weddingVendor: one(weddingVendors, {
      fields: [vendorInvoices.weddingVendorId],
      references: [weddingVendors.id],
    }),
    wedding: one(weddings, {
      fields: [vendorInvoices.weddingId],
      references: [weddings.id],
    }),
    vendor: one(vendors, {
      fields: [vendorInvoices.vendorId],
      references: [vendors.id],
    }),
    payments: many(vendorPaymentTransactions),
    reconciledByUser: one(users, {
      fields: [vendorInvoices.reconciledBy],
      references: [users.id],
    }),
  })
);

export const vendorPaymentTransactionsRelations = relations(
  vendorPaymentTransactions,
  ({ one }) => ({
    invoice: one(vendorInvoices, {
      fields: [vendorPaymentTransactions.invoiceId],
      references: [vendorInvoices.id],
    }),
    weddingVendor: one(weddingVendors, {
      fields: [vendorPaymentTransactions.weddingVendorId],
      references: [weddingVendors.id],
    }),
    wedding: one(weddings, {
      fields: [vendorPaymentTransactions.weddingId],
      references: [weddings.id],
    }),
    recordedByUser: one(users, {
      fields: [vendorPaymentTransactions.recordedBy],
      references: [users.id],
    }),
  })
);

// ── Finance: Miscellaneous Expenses & Extras Relations ──────────
export const expensesRelations = relations(expenses, ({ one }) => ({
  wedding: one(weddings, {
    fields: [expenses.weddingId],
    references: [weddings.id],
  }),
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
  approvedByUser: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}));

export const approvedExtrasRelations = relations(
  approvedExtras,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [approvedExtras.weddingId],
      references: [weddings.id],
    }),
    weddingVendor: one(weddingVendors, {
      fields: [approvedExtras.weddingVendorId],
      references: [weddingVendors.id],
    }),
    approvedByUser: one(users, {
      fields: [approvedExtras.approvedBy],
      references: [users.id],
    }),
  })
);

// ── Guests, RSVPs, Accommodation & Transport Relations ───────────
export const guestsRelations = relations(guests, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [guests.weddingId],
    references: [weddings.id],
  }),
  rsvps: many(guestEventRsvps),
  accommodationBookings: many(accommodationBookings),
  transportAssignments: many(transportAssignments),
}));

export const guestEventRsvpsRelations = relations(
  guestEventRsvps,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [guestEventRsvps.weddingId],
      references: [weddings.id],
    }),
    guest: one(guests, {
      fields: [guestEventRsvps.guestId],
      references: [guests.id],
    }),
    event: one(weddingEvents, {
      fields: [guestEventRsvps.eventId],
      references: [weddingEvents.id],
    }),
  })
);

export const accommodationBookingsRelations = relations(
  accommodationBookings,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [accommodationBookings.weddingId],
      references: [weddings.id],
    }),
    guest: one(guests, {
      fields: [accommodationBookings.guestId],
      references: [guests.id],
    }),
  })
);

export const transportAssignmentsRelations = relations(
  transportAssignments,
  ({ one }) => ({
    wedding: one(weddings, {
      fields: [transportAssignments.weddingId],
      references: [weddings.id],
    }),
    guest: one(guests, {
      fields: [transportAssignments.guestId],
      references: [guests.id],
    }),
  })
);

export const agreementsRelations = relations(agreements, ({ one }) => ({
  wedding: one(weddings, {
    fields: [agreements.weddingId],
    references: [weddings.id],
  }),
  client: one(clients, {
    fields: [agreements.clientId],
    references: [clients.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  wedding: one(weddings, {
    fields: [notifications.weddingId],
    references: [weddings.id],
  }),
}));

export const clientBillsRelations = relations(clientBills, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [clientBills.weddingId],
    references: [weddings.id],
  }),
  client: one(clients, {
    fields: [clientBills.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [clientBills.createdBy],
    references: [users.id],
  }),
  items: many(clientBillItems),
  installments: many(clientBillInstallments),
  sessions: many(virtualPaymentSessions),
  transactions: many(virtualPaymentTransactions),
}));

export const clientBillItemsRelations = relations(clientBillItems, ({ one }) => ({
  bill: one(clientBills, {
    fields: [clientBillItems.billId],
    references: [clientBills.id],
  }),
}));

export const clientBillInstallmentsRelations = relations(
  clientBillInstallments,
  ({ one, many }) => ({
    bill: one(clientBills, {
      fields: [clientBillInstallments.billId],
      references: [clientBills.id],
    }),
    linkedMilestone: one(clientPaymentMilestones, {
      fields: [clientBillInstallments.linkedMilestoneId],
      references: [clientPaymentMilestones.id],
    }),
    allocations: many(virtualPaymentAllocations),
  })
);

export const virtualPaymentSessionsRelations = relations(
  virtualPaymentSessions,
  ({ one }) => ({
    bill: one(clientBills, {
      fields: [virtualPaymentSessions.billId],
      references: [clientBills.id],
    }),
    installment: one(clientBillInstallments, {
      fields: [virtualPaymentSessions.installmentId],
      references: [clientBillInstallments.id],
    }),
  })
);

export const virtualPaymentTransactionsRelations = relations(
  virtualPaymentTransactions,
  ({ one, many }) => ({
    bill: one(clientBills, {
      fields: [virtualPaymentTransactions.billId],
      references: [clientBills.id],
    }),
    session: one(virtualPaymentSessions, {
      fields: [virtualPaymentTransactions.sessionId],
      references: [virtualPaymentSessions.id],
    }),
    allocations: many(virtualPaymentAllocations),
  })
);

export const virtualPaymentAllocationsRelations = relations(
  virtualPaymentAllocations,
  ({ one }) => ({
    transaction: one(virtualPaymentTransactions, {
      fields: [virtualPaymentAllocations.transactionId],
      references: [virtualPaymentTransactions.id],
    }),
    installment: one(clientBillInstallments, {
      fields: [virtualPaymentAllocations.installmentId],
      references: [clientBillInstallments.id],
    }),
  })
);



