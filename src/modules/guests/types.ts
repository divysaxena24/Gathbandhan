export type GuestSide = "BRIDE" | "GROOM" | "MUTUAL" | "VIP";
export type RsvpStatus = "INVITED" | "ATTENDING" | "DECLINED" | "TENTATIVE";
export type MealPreference = "VEG" | "JAIN" | "NON_VEG" | "VEGAN";
export type TransportStatus = "SCHEDULED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type AgreementStatus = "DRAFT" | "SENT" | "SIGNED" | "EXPIRED" | "CANCELLED";

export interface GuestRecord {
  id: string;
  weddingId: string;
  householdName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  side: GuestSide;
  isPrimaryContact: boolean;
  dietaryPreference: MealPreference;
  allergies: string | null;
  accessibilityNeeds: string | null;
  notes: string | null;
  rsvpToken: string;
  invitationSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rsvps?: GuestEventRsvpRecord[];
}

export interface GuestEventRsvpRecord {
  id: string;
  weddingId: string;
  guestId: string;
  eventId: string;
  eventName?: string;
  status: RsvpStatus;
  plusOnes: number;
  mealPreference: MealPreference;
  dietaryNotes: string | null;
  respondedAt: Date | null;
  notes: string | null;
}

export interface AccommodationBookingRecord {
  id: string;
  weddingId: string;
  guestId: string | null;
  guestName?: string | null;
  householdName: string | null;
  hotelName: string;
  roomNumber: string | null;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  confirmationCode: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export interface TransportAssignmentRecord {
  id: string;
  weddingId: string;
  guestId: string | null;
  guestName: string | null;
  transferType: string;
  pickupTime: Date;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  vehicleNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  passengerCount: number;
  status: TransportStatus;
  flightTrainNumber: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface AllergyBreakdown {
  allergy: string;
  count: number;
}

export interface EventDietarySummary {
  eventId: string;
  eventName: string;
  eventType: string;
  startsAt: Date | null;
  venue: string | null;
  confirmedGuests: number;
  plusOnesCount: number;
  totalAttendingHeadcount: number;
  cateringBufferPercentage: number;
  bufferHeadcount: number;
  totalCateringPlatesCommitted: number;
  vegCount: number;
  jainCount: number;
  nonVegCount: number;
  veganCount: number;
  declinedCount: number;
  pendingCount: number;
  allergies: AllergyBreakdown[];
  specialRequests: string[];
}

export interface WeddingLogisticsOverview {
  weddingId: string;
  totalInvitedGuests: number;
  totalConfirmedGuests: number;
  totalDeclinedGuests: number;
  totalPendingGuests: number;
  totalHouseholds: number;
  totalRoomsBooked: number;
  totalTransfersScheduled: number;
  eventSummaries: EventDietarySummary[];
}

export interface AgreementRecord {
  id: string;
  weddingId: string;
  weddingTitle?: string;
  clientId: string;
  coupleName?: string;
  title: string;
  version: string;
  status: AgreementStatus;
  totalAmountPaise: bigint;
  documentUrl: string | null;
  documentHash: string | null;
  termsSummary: string | null;
  sentAt: Date | null;
  signedAt: Date | null;
  signerName: string | null;
  signerEmail: string | null;
  signerIp: string | null;
  signatureEvidence: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface PublicRsvpEventOption {
  id: string;
  name: string;
  eventType: string;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  currentStatus: RsvpStatus;
  currentPlusOnes: number;
  currentMealPreference: MealPreference;
  currentDietaryNotes: string | null;
}

export interface PublicRsvpDetails {
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    householdName: string | null;
    dietaryPreference: MealPreference;
    allergies: string | null;
    accessibilityNeeds: string | null;
  };
  wedding: {
    id: string;
    title: string;
    city: string | null;
    venue: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  events: PublicRsvpEventOption[];
}
