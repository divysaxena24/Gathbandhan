import crypto from "crypto";

export interface FallbackMessage {
  id: string;
  bookingRequestId: string;
  senderId: string | null;
  senderName: string;
  senderRole: "CLIENT" | "PLANNER";
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface FallbackBookingRequest {
  id: string;
  userId: string | null;
  leadId: string | null;
  weddingId: string | null;
  coupleName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  preferredContactMethod: string | null;
  weddingType: string | null;
  regionalTraditions: string[] | null;
  ceremonies: Array<{
    ceremonyName?: string;
    name?: string;
    eventDay?: number;
    estimatedDuration?: string;
    culturalSignificance?: string;
  }> | null;
  destination: string | null;
  destinationCity: string | null;
  venueType: string | null;
  preferredDate: string | null;
  dateFlexible: boolean;
  durationDays: number;
  guestCount: number;
  guestBreakdown: any;
  theme: string | null;
  decorPreferences: string[] | null;
  colorPalette: string[] | null;
  cateringType: string | null;
  cuisines: string[] | null;
  dietaryRestrictions: string[] | null;
  foodCounters: any;
  photography: string[] | null;
  entertainment: string[] | null;
  accommodation: any;
  transportation: string[] | null;
  additionalServices: string[] | null;
  customRequirements: string | null;
  estimatedBudgetPaise: string;
  clientBudgetPaise?: string | null;
  budgetBreakdown: Record<string, { totalInPaise: number; label?: string }> | null;
  fullSelections: any;
  status: "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED";
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  messages: FallbackMessage[];
}

const globalForBooking = globalThis as unknown as {
  __gathbandhanFallbackBookingRequests?: Map<string, FallbackBookingRequest>;
};

function getStore(): Map<string, FallbackBookingRequest> {
  if (!globalForBooking.__gathbandhanFallbackBookingRequests) {
    const initialMap = new Map<string, FallbackBookingRequest>();

    // Seed default sample booking request for smooth offline dev experience
    const defaultId = "b908759d-f633-47a3-b5f7-66a7b744d2e1";
    const nowIso = new Date().toISOString();

    const sampleRequest: FallbackBookingRequest = {
      id: defaultId,
      userId: "user_offline_client",
      leadId: "lead_sample_001",
      weddingId: null,
      coupleName: "Divya & Knox",
      contactName: "Divya Saxena",
      contactEmail: "divya_saxena@srmap.edu.in",
      contactPhone: "+91 98765 43210",
      preferredContactMethod: "whatsapp",
      weddingType: "Royal Rajasthani",
      regionalTraditions: ["North Indian", "Marwari"],
      ceremonies: [
        {
          ceremonyName: "Ganesh Puja & Mehendi",
          name: "Ganesh Puja & Mehendi",
          eventDay: 1,
          estimatedDuration: "4 hours",
          culturalSignificance: "Auspicious beginning with traditional folk music",
        },
        {
          ceremonyName: "Royal Sangeet Night",
          name: "Royal Sangeet Night",
          eventDay: 1,
          estimatedDuration: "5 hours",
          culturalSignificance: "Musical celebrations under the palace stars",
        },
        {
          ceremonyName: "Pheras & Wedding Vows",
          name: "Pheras & Wedding Vows",
          eventDay: 2,
          estimatedDuration: "3 hours",
          culturalSignificance: "Sacred fire rituals at twilight",
        },
        {
          ceremonyName: "Grand Reception Gala",
          name: "Grand Reception Gala",
          eventDay: 2,
          estimatedDuration: "4 hours",
          culturalSignificance: "Royal banquet with live orchestra",
        },
      ],
      destination: "destination",
      destinationCity: "Udaipur",
      venueType: "Heritage Palace Resort",
      preferredDate: "2026-12-15",
      dateFlexible: true,
      durationDays: 3,
      guestCount: 300,
      guestBreakdown: { vip: 50, family: 150, friends: 100 },
      theme: "Royal Rajputana Grandeur",
      decorPreferences: ["Marigold Floral Arches", "Vintage Silver Chandeliers", "Handwoven Silk Drapes"],
      colorPalette: ["#800020", "#D4AF37", "#F5F5DC"],
      cateringType: "Royal Rajasthani Feast & Continental Fusion",
      cuisines: ["Dal Baati Churma Special", "Mughlai Delicacies", "Italian Live Counter"],
      dietaryRestrictions: ["Pure Vegetarian Sections", "Jain Counters Available"],
      foodCounters: { liveFoodCounters: true, dessertCounter: true, beverageCounter: true },
      photography: ["Cinematic Drone Film", "Candid Master Photographer", "Traditional Family Album"],
      entertainment: ["Manganiyar Folk Troupe", "Celebrity DJ Night", "Sitar Welcome Ensemble"],
      accommodation: {
        needAccommodation: true,
        accommodationRooms: 60,
        accommodationNights: 2,
        accommodationCategory: "Heritage Luxury Suites",
      },
      transportation: ["Vintage Cars for Baraat", "Guest Luxury Coaches"],
      additionalServices: ["Bridal Makeup & Trousseau Styling", "Guest Welcome Hampers"],
      customRequirements: "A traditional elephant and vintage Rolls Royce entrance for the groom.",
      estimatedBudgetPaise: "450000000", // ₹45,00,000
      clientBudgetPaise: "300000000", // ₹30,00,000 (Client preferred budget)
      budgetBreakdown: {
        venue: { totalInPaise: 180000000, label: "Palace Venue & Rooms" },
        catering: { totalInPaise: 120000000, label: "Royal Banquets & Catering" },
        decor: { totalInPaise: 80000000, label: "Palatial Floral & Light Decor" },
        entertainment: { totalInPaise: 40000000, label: "Artists & Sound Production" },
        photography: { totalInPaise: 30000000, label: "Cinematography & Albums" },
      },
      fullSelections: { budgetRange: "below_25_lakh", clientBudgetPaise: "250000000" },
      status: "SUBMITTED",
      reviewNotes: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [
        {
          id: "msg_welcome_sample",
          bookingRequestId: defaultId,
          senderId: "planner_concierge",
          senderName: "The Royal Knot Concierge",
          senderRole: "PLANNER",
          message:
            "Namaste Divya! We have received your 14-step bespoke wedding plan for Udaipur. Our senior wedding architects are reviewing venue availability and crafting your personalized proposal. Feel free to send us any questions here!",
          isInternal: false,
          createdAt: nowIso,
        },
      ],
    };

    initialMap.set(defaultId, sampleRequest);
    globalForBooking.__gathbandhanFallbackBookingRequests = initialMap;
  }

  return globalForBooking.__gathbandhanFallbackBookingRequests;
}

export function saveFallbackBookingRequest(data: {
  userId?: string | null;
  leadId?: string | null;
  coupleName: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  preferredContactMethod?: string | null;
  weddingType?: string | null;
  regionalTraditions?: string[] | null;
  ceremonies?: any[] | null;
  destination?: string | null;
  destinationCity?: string | null;
  venueType?: string | null;
  preferredDate?: string | null;
  dateFlexible?: boolean;
  durationDays?: number;
  guestCount?: number;
  guestBreakdown?: any;
  theme?: string | null;
  decorPreferences?: string[] | null;
  colorPalette?: string[] | null;
  cateringType?: string | null;
  cuisines?: string[] | null;
  dietaryRestrictions?: string[] | null;
  foodCounters?: any;
  photography?: string[] | null;
  entertainment?: string[] | null;
  accommodation?: any;
  transportation?: string[] | null;
  additionalServices?: string[] | null;
  customRequirements?: string | null;
  estimatedBudgetPaise?: string | bigint | number;
  clientBudgetPaise?: string | bigint | number | null;
  budgetBreakdown?: any;
  fullSelections?: any;
}): FallbackBookingRequest {
  const store = getStore();
  const id = crypto.randomUUID();
  const leadId = data.leadId || crypto.randomUUID();
  const now = new Date().toISOString();

  const budgetPaiseStr = data.estimatedBudgetPaise?.toString() || "0";

  const welcomeMessage: FallbackMessage = {
    id: crypto.randomUUID(),
    bookingRequestId: id,
    senderId: "planner_concierge",
    senderName: "The Royal Knot Concierge",
    senderRole: "PLANNER",
    message: `Namaste ${data.contactName}! We have received your 14-step bespoke wedding plan for ${
      data.destinationCity || "Udaipur"
    }. Our senior wedding architects are reviewing venue availability and crafting your personalized proposal. Feel free to send us any questions here!`,
    isInternal: false,
    createdAt: now,
  };

  const record: FallbackBookingRequest = {
    id,
    userId: data.userId || null,
    leadId,
    weddingId: null,
    coupleName: data.coupleName || data.contactName,
    contactName: data.contactName,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    preferredContactMethod: data.preferredContactMethod || "whatsapp",
    weddingType: data.weddingType || "custom",
    regionalTraditions: data.regionalTraditions || [],
    ceremonies: data.ceremonies || [],
    destination: data.destination || "destination",
    destinationCity: data.destinationCity || "Udaipur",
    venueType: data.venueType || "Heritage Palace",
    preferredDate: data.preferredDate || null,
    dateFlexible: data.dateFlexible ?? true,
    durationDays: data.durationDays || 2,
    guestCount: data.guestCount || 250,
    guestBreakdown: data.guestBreakdown || null,
    theme: data.theme || "Royal Rajasthani Heritage",
    decorPreferences: data.decorPreferences || [],
    colorPalette: data.colorPalette || [],
    cateringType: data.cateringType || "Traditional Feast",
    cuisines: data.cuisines || [],
    dietaryRestrictions: data.dietaryRestrictions || [],
    foodCounters: data.foodCounters || {
      liveFoodCounters: true,
      dessertCounter: true,
      beverageCounter: true,
    },
    photography: data.photography || [],
    entertainment: data.entertainment || [],
    accommodation: data.accommodation || {
      needAccommodation: true,
      accommodationRooms: 50,
      accommodationNights: 2,
      accommodationCategory: "Luxury Suites",
    },
    transportation: data.transportation || [],
    additionalServices: data.additionalServices || [],
    customRequirements: data.customRequirements || null,
    estimatedBudgetPaise: budgetPaiseStr,
    clientBudgetPaise:
      data.clientBudgetPaise?.toString() ||
      data.fullSelections?.clientBudgetPaise?.toString() ||
      null,
    budgetBreakdown: data.budgetBreakdown || {},
    fullSelections: data.fullSelections || {},
    status: "SUBMITTED",
    reviewNotes: null,
    createdAt: now,
    updatedAt: now,
    messages: [welcomeMessage],
  };

  store.set(id, record);
  return record;
}

export function getFallbackBookingRequestById(id: string): FallbackBookingRequest | null {
  const store = getStore();
  return store.get(id) || null;
}

export function getFallbackBookingRequests(
  statusFilter?: string | null
): FallbackBookingRequest[] {
  const store = getStore();
  const list = Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (statusFilter && statusFilter !== "ALL") {
    return list.filter((item) => item.status === statusFilter);
  }

  return list;
}

export function addFallbackMessage(
  bookingRequestId: string,
  message: {
    senderId?: string | null;
    senderName?: string;
    senderRole?: "CLIENT" | "PLANNER";
    message: string;
    isInternal?: boolean;
  }
): FallbackMessage {
  const store = getStore();
  let request = store.get(bookingRequestId);

  if (!request) {
    // If request not in store yet, create dummy entry
    request = saveFallbackBookingRequest({
      coupleName: message.senderName || "Valued Client",
      contactName: message.senderName || "Valued Client",
    });
  }

  const newMsg: FallbackMessage = {
    id: crypto.randomUUID(),
    bookingRequestId,
    senderId: message.senderId || null,
    senderName: message.senderName || "Client",
    senderRole: message.senderRole || "CLIENT",
    message: message.message,
    isInternal: !!message.isInternal,
    createdAt: new Date().toISOString(),
  };

  request.messages.push(newMsg);
  request.updatedAt = new Date().toISOString();
  store.set(bookingRequestId, request);

  return newMsg;
}

export function updateFallbackBookingRequestStatus(
  id: string,
  status: "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED",
  reviewNotes?: string | null
): FallbackBookingRequest | null {
  const store = getStore();
  const request = store.get(id);
  if (!request) return null;

  request.status = status;
  if (reviewNotes !== undefined) {
    request.reviewNotes = reviewNotes;
  }
  request.updatedAt = new Date().toISOString();
  store.set(id, request);

  return request;
}
