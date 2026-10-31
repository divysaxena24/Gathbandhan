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

export const notificationChannelEnum = pgEnum("notification_channel", [
  "IN_APP",
  "EMAIL",
  "WHATSAPP",
  "SMS",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "READ",
]);

export const notificationTemplateEnum = pgEnum("notification_template", [
  "LEAD_FOLLOW_UP",
  "TASK_DEADLINE",
  "CLIENT_PAYMENT_DUE",
  "VENDOR_PAYMENT_DUE",
  "VENDOR_LATE",
  "INCIDENT_ALERT",
  "AGREEMENT_SIGNED",
]);

export const billStatusEnum = pgEnum("bill_status", [
  "DRAFT",
  "AWAITING_ACCEPTANCE",
  "ACCEPTED",
  "DECLINED",
  "DUE",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
]);

export const virtualPaymentSessionStatusEnum = pgEnum("virtual_payment_session_status", [
  "PENDING",
  "COMPLETED",
  "EXPIRED",
  "FAILED",
]);

export const virtualPaymentTypeEnum = pgEnum("virtual_payment_type", [
  "INSTALLMENT",
  "FULL_BALANCE",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type WeddingLifecycle = (typeof weddingLifecycleEnum.enumValues)[number];
export type PackageType = (typeof packageTypeEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type VendorCategory = (typeof vendorCategoryEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];
export type IncidentSeverity = (typeof incidentSeverityEnum.enumValues)[number];
export type CheckInStatus = (typeof checkInStatusEnum.enumValues)[number];
export type QuoteRequestStatus = (typeof quoteRequestStatusEnum.enumValues)[number];
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type InclusionStatus = (typeof inclusionStatusEnum.enumValues)[number];
export type GuestSide = (typeof guestSideEnum.enumValues)[number];
export type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];
export type MealPreference = (typeof mealPreferenceEnum.enumValues)[number];
export type TransportStatus = (typeof transportStatusEnum.enumValues)[number];
export type AgreementStatus = (typeof agreementStatusEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
export type NotificationStatus = (typeof notificationStatusEnum.enumValues)[number];
export type NotificationTemplate = (typeof notificationTemplateEnum.enumValues)[number];
export type BillStatus = (typeof billStatusEnum.enumValues)[number];
export type VirtualPaymentSessionStatus = (typeof virtualPaymentSessionStatusEnum.enumValues)[number];
export type VirtualPaymentType = (typeof virtualPaymentTypeEnum.enumValues)[number];



