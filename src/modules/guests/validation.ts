import { z } from "zod";

export const createGuestSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  householdName: z.string().max(100).optional().nullable(),
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Invalid phone number format")
    .optional()
    .nullable(),
  side: z.enum(["BRIDE", "GROOM", "MUTUAL", "VIP"]).default("MUTUAL"),
  isPrimaryContact: z.boolean().default(false),
  dietaryPreference: z.enum(["VEG", "JAIN", "NON_VEG", "VEGAN"]).default("VEG"),
  allergies: z.string().max(300).optional().nullable(),
  accessibilityNeeds: z.string().max(300).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateGuestSchema = createGuestSchema.partial().omit({ weddingId: true });

export const rsvpItemSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  status: z.enum(["INVITED", "ATTENDING", "DECLINED", "TENTATIVE"]),
  plusOnes: z.number().int().min(0).max(10).default(0),
  mealPreference: z.enum(["VEG", "JAIN", "NON_VEG", "VEGAN"]).default("VEG"),
  dietaryNotes: z.string().max(250).optional().nullable(),
});

export const submitGuestRsvpSchema = z.object({
  rsvps: z.array(rsvpItemSchema).min(1, "At least one event response is required"),
  allergies: z.string().max(300).optional().nullable(),
  accessibilityNeeds: z.string().max(300).optional().nullable(),
});

export const createAccommodationSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  guestId: z.string().uuid().optional().nullable(),
  householdName: z.string().max(100).optional().nullable(),
  hotelName: z.string().min(2, "Hotel name is required").max(120),
  roomNumber: z.string().max(50).optional().nullable(),
  roomType: z.string().min(2, "Room type is required").max(80),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be YYYY-MM-DD"),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be YYYY-MM-DD"),
  confirmationCode: z.string().max(50).optional().nullable(),
  status: z.string().default("CONFIRMED"),
  notes: z.string().max(400).optional().nullable(),
});

export const createTransportSchema = z.object({
  weddingId: z.string().uuid("Invalid wedding ID"),
  guestId: z.string().uuid().optional().nullable(),
  guestName: z.string().max(100).optional().nullable(),
  transferType: z.string().min(2, "Transfer type is required").max(60),
  pickupTime: z.string().datetime({ offset: true }),
  pickupLocation: z.string().min(2, "Pickup location is required").max(150),
  dropoffLocation: z.string().min(2, "Dropoff location is required").max(150),
  vehicleType: z.string().min(2, "Vehicle type is required").max(80),
  vehicleNumber: z.string().max(30).optional().nullable(),
  driverName: z.string().max(80).optional().nullable(),
  driverPhone: z.string().max(30).optional().nullable(),
  passengerCount: z.number().int().min(1).default(1),
  status: z.enum(["SCHEDULED", "DISPATCHED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  flightTrainNumber: z.string().max(40).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
});

export const signAgreementSchema = z.object({
  agreementId: z.string().uuid("Invalid agreement ID"),
  signerName: z.string().min(2, "Full legal name is required"),
  signerEmail: z.string().email("Valid email address is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of the agreement to proceed",
  }),
});
