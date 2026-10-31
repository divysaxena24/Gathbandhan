import { leads, users, leadActivities } from "@/lib/db/schema";
import { type InferSelectModel } from "drizzle-orm";

export type Lead = InferSelectModel<typeof leads>;
export type LeadActivity = InferSelectModel<typeof leadActivities>;
export type User = InferSelectModel<typeof users>;

export type PipelineStage =
  | "NEW"
  | "CONTACTED"
  | "CONSULTATION_SCHEDULED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST"
  | "ARCHIVED";

export const PIPELINE_STAGES: {
  key: PipelineStage;
  label: string;
  description: string;
  color: string;
  isTerminal?: boolean;
}[] = [
  {
    key: "NEW",
    label: "New Enquiry",
    description: "Incoming uncontacted enquiry from WhatsApp, web, or referral",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    key: "CONTACTED",
    label: "Contacted",
    description: "Initial discovery call or chat conducted",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  {
    key: "CONSULTATION_SCHEDULED",
    label: "Consultation Scheduled",
    description: "In-person or virtual consultation with couple/family booked",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  {
    key: "PROPOSAL_SENT",
    label: "Proposal Sent",
    description: "Customized package presentation & budget sent",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  {
    key: "NEGOTIATION",
    label: "Negotiation",
    description: "Reviewing scope, dates, and contract terms",
    color: "bg-gold/20 text-gold-700 border-gold/30",
  },
  {
    key: "CONVERTED",
    label: "Converted / Won",
    description: "Agreement confirmed & converted to active wedding project",
    color: "bg-status-success-light text-status-success border-status-success/30",
    isTerminal: true,
  },
  {
    key: "LOST",
    label: "Lost",
    description: "Enquiry lost to competitor, budget mismatch, or date unavailable",
    color: "bg-status-critical-light text-status-critical border-status-critical/30",
    isTerminal: true,
  },
  {
    key: "ARCHIVED",
    label: "Archived",
    description: "Archived enquiry for historical reference",
    color: "bg-muted text-muted-foreground border-border",
    isTerminal: true,
  },
];

export type QualificationStatus = "PENDING" | "QUALIFIED" | "UNQUALIFIED";

export type DateFlexibility = "EXACT" | "ONE_WEEK" | "ONE_MONTH" | "FLEXIBLE";

export interface LeadFilters {
  status?: PipelineStage;
  assignedPlannerId?: string;
  qualificationStatus?: QualificationStatus;
  search?: string; // coupleName, email, phone
  city?: string;
  source?: string;
  minBudgetPaise?: bigint;
  maxBudgetPaise?: bigint;
}

export interface CRMStats {
  totalLeads: number;
  newEnquiries: number;
  qualifiedLeads: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  convertedCount: number;
  pipelineBudgetPaise: bigint;
  stageCounts: Record<PipelineStage, number>;
}

