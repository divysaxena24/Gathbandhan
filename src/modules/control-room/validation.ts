import { z } from "zod";

export const timelineItemStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
  "CANCELLED",
]);

export const checkInStatusZodEnum = z.enum([
  "EXPECTED",
  "ARRIVED",
  "SETUP_COMPLETE",
  "WORKING",
  "COMPLETED",
  "LATE",
  "NO_SHOW",
]);

export const incidentSeverityZodEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const incidentStatusZodEnum = z.enum([
  "OPEN",
  "INVESTIGATING",
  "RESOLVED",
]);

export const createTimelineItemSchema = z
  .object({
    weddingId: z.string().uuid("Invalid wedding ID"),
    eventId: z.string().uuid("Invalid event ID"),
    title: z.string().min(2, "Title must be at least 2 characters").max(150),
    description: z.string().optional().nullable(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    ownerId: z.string().uuid().optional().nullable(),
    vendorId: z.string().uuid().optional().nullable(),
    weddingVendorId: z.string().uuid().optional().nullable(),
    status: timelineItemStatusEnum.default("PENDING"),
    isKeyMoment: z.boolean().default(false),
    location: z.string().optional().nullable(),
    orderIndex: z.number().int().default(0),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(),
    {
      message: "End time must be after start time",
      path: ["endsAt"],
    }
  );

export const updateTimelineItemSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).optional(),
  ownerId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  weddingVendorId: z.string().uuid().optional().nullable(),
  status: timelineItemStatusEnum.optional(),
  isKeyMoment: z.boolean().optional(),
  location: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
  actualStartsAt: z.string().datetime({ offset: true }).optional().nullable(),
  actualEndsAt: z.string().datetime({ offset: true }).optional().nullable(),
  delayMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const addTimelineDependencySchema = z
  .object({
    timelineItemId: z.string().uuid(),
    dependsOnItemId: z.string().uuid(),
    bufferMinutes: z.number().int().min(0).default(0),
  })
  .refine((data) => data.timelineItemId !== data.dependsOnItemId, {
    message: "A timeline item cannot depend on itself",
    path: ["dependsOnItemId"],
  });

export const cascadeImpactSchema = z.object({
  weddingId: z.string().uuid(),
  eventId: z.string().uuid(),
  delayedItemId: z.string().uuid(),
  delayMinutes: z.number().int().min(1, "Delay must be at least 1 minute").max(720),
});

export const updateCheckInStatusSchema = z.object({
  status: checkInStatusZodEnum,
  source: z.string().optional(),
  checkedInBy: z.string().optional(),
  notes: z.string().optional(),
});

export const publicCheckInSubmitSchema = z.object({
  status: checkInStatusZodEnum,
  notes: z.string().max(500).optional(),
  checkedInBy: z.string().max(100).optional(),
});

export const createIncidentSchema = z.object({
  weddingId: z.string().uuid(),
  eventId: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(5, "Description must be at least 5 characters"),
  severity: incidentSeverityZodEnum.default("MEDIUM"),
  ownerId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  reportedBy: z.string().min(2, "Reporter name is required"),
  costImpactPaise: z.union([z.bigint(), z.number(), z.string()]).default(0).transform((val) => {
    if (typeof val === "bigint") return val;
    if (typeof val === "number") return BigInt(Math.round(val));
    return BigInt(val || 0);
  }),
});

export const resolveIncidentSchema = z.object({
  resolutionNotes: z.string().min(5, "Resolution notes must be at least 5 characters"),
  costImpactPaise: z
    .union([z.bigint(), z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return 0n;
      if (typeof val === "bigint") return val;
      if (typeof val === "number") return BigInt(Math.round(val));
      return BigInt(val || 0);
    }),
});

export const verifyLateSchema = z.object({
  weddingId: z.string().uuid(),
  asOfTime: z.string().datetime({ offset: true }).optional(),
});
