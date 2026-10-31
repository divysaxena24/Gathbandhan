import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "FOUNDER_ADMIN",
  "PLANNER",
  "FINANCE",
  "ONSITE_COORDINATOR",
  "VENDOR",
  "CLIENT",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "CONSULTATION_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
  "ARCHIVED",
]);

export const weddingLifecycleEnum = pgEnum("wedding_lifecycle", [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const packageTypeEnum = pgEnum("package_type", [
  "FULL_SERVICE",
  "PARTIAL",
  "DAY_OF",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "MEHENDI",
  "SANGEET",
  "CEREMONY",
  "RECEPTION",
  "AFTER_PARTY",
  "OTHER",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "DRAFT",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "VENUE",
  "CATERING",
  "DECORATION",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "DJ_MUSIC",
  "MAKEUP",
  "MEHENDI_ARTIST",
  "LIGHTING",
  "ENTERTAINMENT",
  "TRANSPORT",
  "ACCOMMODATION",
  "INVITATION",
  "GIFTING",
  "PANDIT",
  "SECURITY",
  "COORDINATION",
  "OTHER",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "TO_PLAN",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "APPROVED",
  "DISPUTED",
  "PAID",
  "CANCELLED",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const checkInStatusEnum = pgEnum("check_in_status", [
  "EXPECTED",
  "ARRIVED",
  "SETUP_COMPLETE",
  "WORKING",
  "COMPLETED",
  "LATE",
  "NO_SHOW",
]);

export const quoteRequestStatusEnum = pgEnum("quote_request_status", [
  "OPEN",
  "CLOSED",
  "CANCELLED",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "REQUESTED",
  "RECEIVED",
  "EXTRACTION_PENDING",
  "NEEDS_REVIEW",
  "VERIFIED",
  "SELECTED",
  "REJECTED",
  "CLOSED",
]);

export const inclusionStatusEnum = pgEnum("inclusion_status", [
  "INCLUDED",
  "EXCLUDED",
  "OPTIONAL",
  "UNSPECIFIED",
]);

export const guestSideEnum = pgEnum("guest_side", [
  "BRIDE",
  "GROOM",
  "MUTUAL",
  "VIP",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "INVITED",
  "ATTENDING",
  "DECLINED",
  "TENTATIVE",
]);

export const mealPreferenceEnum = pgEnum("meal_preference", [
  "VEG",
  "JAIN",
  "NON_VEG",
  "VEGAN",
]);

export const transportStatusEnum = pgEnum("transport_status", [
  "SCHEDULED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
]);

export const agreementStatusEnum = pgEnum("agreement_status", [
  "DRAFT",
  "SENT",
  "SIGNED",
  "EXPIRED",
  "CANCELLED",
]);

