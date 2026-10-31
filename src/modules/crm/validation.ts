import { z } from "zod";
import { uuidSchema, paginationSchema, inrDisplaySchema } from "@/lib/validation";

export const pipelineStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "CONSULTATION_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
  "ARCHIVED",
]);

export const qualificationStatusEnum = z.enum([
  "PENDING",
  "QUALIFIED",
  "UNQUALIFIED",
]);

export const dateFlexibilityEnum = z.enum([
  "EXACT",
  "ONE_WEEK",
  "ONE_MONTH",
  "FLEXIBLE",
]);

export const packageTypeEnum = z.enum(["FULL_SERVICE", "PARTIAL", "DAY_OF"]);

export const eventTypeEnum = z.enum([
  "MEHENDI",
  "SANGEET",
  "CEREMONY",
  "RECEPTION",
  "AFTER_PARTY",
  "OTHER",
]);

/** Schema for creating a new Lead */
export const createLeadSchema = z.object({
  coupleName: z.string().min(2, "Couple name is required (min 2 chars)"),
  partnerOneName: z.string().min(2, "Primary contact name is required"),
  partnerOneEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  partnerOnePhone: z.string().min(8, "Phone number must be at least 8 digits").optional().or(z.literal("")),
  partnerTwoName: z.string().optional().or(z.literal("")),
  partnerTwoPhone: z.string().optional().or(z.literal("")),
  partnerTwoEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date format")
    .optional()
    .or(z.literal("")),
  dateFlexibility: dateFlexibilityEnum.default("EXACT"),
  estimatedGuestCount: z.coerce.number().int().positive().optional().nullable(),
  estimatedBudgetPaise: z.coerce.bigint().nonnegative().optional().nullable(),
  estimatedBudgetInrString: inrDisplaySchema.optional(),
  city: z.string().optional().or(z.literal("")),
  venue: z.string().optional().or(z.literal("")),
  themeNotes: z.string().optional().or(z.literal("")),
  packageType: packageTypeEnum.default("FULL_SERVICE"),
  qualificationStatus: qualificationStatusEnum.default("PENDING"),
  assignedPlannerId: uuidSchema.optional().nullable(),
  notes: z.string().optional().or(z.literal("")),
  nextFollowUpAt: z.string().optional().or(z.literal("")),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/** Schema for updating a Lead */
export const updateLeadSchema = createLeadSchema.partial().extend({
  status: pipelineStageEnum.optional(),
  lostReason: z.string().optional().nullable(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

/** Schema for transitioning stage with lost reason validation */
export const changeStageSchema = z
  .object({
    status: pipelineStageEnum,
    lostReason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === "LOST") {
        return Boolean(data.lostReason && data.lostReason.trim().length > 0);
      }
      return true;
    },
    {
      message: "A lost reason is required when marking a lead as Lost",
      path: ["lostReason"],
    }
  );
export type ChangeStageInput = z.infer<typeof changeStageSchema>;

/** Schema for assigning planner */
export const assignPlannerSchema = z.object({
  assignedPlannerId: uuidSchema.nullable(),
});
export type AssignPlannerInput = z.infer<typeof assignPlannerSchema>;

/** Schema for scheduling/recording a follow-up */
export const scheduleFollowUpSchema = z.object({
  nextFollowUpAt: z.string().min(1, "Follow-up date/time is required"),
  notes: z.string().optional(),
});
export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;

/** Schema for adding an activity note */
export const addNoteSchema = z.object({
  title: z.string().min(1, "Note title is required"),
  description: z.string().min(1, "Note details are required"),
});
export type AddNoteInput = z.infer<typeof addNoteSchema>;

/** Event input for lead conversion */
export const conversionEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  eventType: eventTypeEnum,
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  venue: z.string().optional().or(z.literal("")),
  expectedGuestCount: z.coerce.number().int().positive().optional().nullable(),
});

/** Schema for converting lead to wedding */
export const convertLeadSchema = z.object({
  weddingTitle: z.string().min(3, "Wedding title is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date"),
  city: z.string().min(1, "City is required"),
  venue: z.string().optional().or(z.literal("")),
  packageType: packageTypeEnum.default("FULL_SERVICE"),
  budgetPaise: z.coerce.bigint().nonnegative().optional().nullable(),
  estimatedGuestCount: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().optional().or(z.literal("")),
  events: z.array(conversionEventSchema).optional(),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

/** Query filters schema for listing leads */
export const listLeadsQuerySchema = paginationSchema.extend({
  status: pipelineStageEnum.optional(),
  assignedPlannerId: uuidSchema.optional(),
  qualificationStatus: qualificationStatusEnum.optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

