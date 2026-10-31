// ============================================================
// Gathbandhan — Core Type Definitions
// ============================================================

// === Wedding Types ===
export type WeddingType =
  | 'hindu'
  | 'sikh'
  | 'muslim'
  | 'christian'
  | 'jain'
  | 'interfaith'
  | 'custom';

export type RegionalTradition =
  | 'north_indian'
  | 'south_indian'
  | 'rajasthani'
  | 'gujarati'
  | 'punjabi_hindu'
  | 'bengali'
  | 'marathi'
  | 'punjabi_sikh'
  | 'kerala_christian'
  | 'goan'
  | 'anglo_indian'
  | 'other';

// === Consultation ===
export interface Consultation {
  id: string;
  sessionToken: string;
  status: ConsultationStatus;
  currentStepIndex: number;
  selections: WeddingSelections;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationStatus =
  | 'in_progress'
  | 'review'
  | 'proposal_generated'
  | 'vendor_exploration'
  | 'lead_captured'
  | 'completed';

// === Wizard Steps ===
export type WizardStepId =
  | 'wedding_type'
  | 'regional_traditions'
  | 'ceremony_discovery'
  | 'ceremony_selection'
  | 'destination'
  | 'date_duration'
  | 'guest_count'
  | 'theme_decor'
  | 'catering'
  | 'photo_entertainment'
  | 'accommodation'
  | 'additional_services'
  | 'budget_preferences'
  | 'review_summary'
  | 'proposal_generation'
  | 'vendor_recommendations'
  | 'lead_capture';

export interface WizardStep {
  id: WizardStepId;
  title: string;
  subtitle?: string;
  icon?: string;
  isOptional: boolean;
  isConditional: boolean;
  /** Returns true if this step should be shown */
  condition?: (selections: WeddingSelections) => boolean;
}

// === Wedding Selections (entire wizard state) ===
export interface WeddingSelections {
  weddingType?: WeddingType;
  regionalTraditions: RegionalTradition[];
  customTradition?: string;

  selectedCeremonies: CeremonySelection[];
  customCeremonies: CustomCeremony[];

  destination?: DestinationType;
  destinationCity?: string;
  customCity?: string;
  venueType?: VenueType;
  customVenue?: string;

  preferredDate?: string;
  dateFlexible?: boolean;
  duration?: WeddingDuration;
  totalGuests?: GuestRange | number;
  guestBreakdown?: GuestBreakdown;
  outsideGuests?: number;
  childrenCount?: number;

  theme?: ThemeType;
  customTheme?: string;
  decorPreferences: DecorPreference[];
  colorPalette?: string[];

  cateringType?: CateringType;
  cuisines: string[];
  dietaryRestrictions: string[];
  specialFoodRequirements?: string;
  liveFoodCounters: boolean;
  dessertCounter: boolean;
  beverageCounter: boolean;

  photography: PhotographyOption[];
  entertainment: EntertainmentOption[];

  needAccommodation?: boolean;
  accommodationRooms?: number;
  accommodationNights?: number;
  accommodationCategory?: string;
  transportation: TransportationOption[];

  additionalServices: string[];
  customRequirements?: string;

  budgetRange?: BudgetRange;
  budgetInclusions: string[];
  spendingPriority?: SpendingPriority;

  // Lead capture
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContactMethod?: string;
  consentGiven?: boolean;
}

// === Ceremony Types ===
export interface CeremonyInfo {
  key: string;
  name: string;
  weddingTypes: WeddingType[];
  regionalVariants?: RegionalTradition[];
  description: string;
  culturalSignificance: string;
  typicalArrangements: string[];
  typicalDuration?: string;
  decorConsiderations?: string;
  cateringConsiderations?: string;
  relatedServices?: string[];
  isCommon: boolean;
}

export interface CeremonySelection {
  ceremonyKey: string;
  ceremonyName: string;
  isCustom: false;
  eventDay?: number;
  estimatedDuration?: string;
}

export interface CustomCeremony {
  name: string;
  description: string;
  isCustom: true;
  eventDay?: number;
  estimatedDuration?: string;
}

// === Location Types ===
export type DestinationType = 'destination' | 'local' | 'not_decided';

export type DestinationCity =
  | 'udaipur'
  | 'jaipur'
  | 'jodhpur'
  | 'jaisalmer'
  | 'goa'
  | 'kerala'
  | 'rishikesh'
  | 'other';

export type VenueType =
  | 'palace'
  | 'luxury_resort'
  | 'five_star_hotel'
  | 'heritage_property'
  | 'banquet_hall'
  | 'outdoor_lawn'
  | 'beachside'
  | 'private_property'
  | 'other';

// === Date & Guests ===
export type WeddingDuration =
  | '1_day'
  | '2_days'
  | '3_days'
  | '4_5_days'
  | 'more_than_5'
  | 'not_decided';

export type GuestRange =
  | 'below_100'
  | '100_300'
  | '300_500'
  | '500_800'
  | '800_1000'
  | 'above_1000';

export interface GuestBreakdown {
  [ceremonyKey: string]: number;
}

// === Theme & Decoration ===
export type ThemeType =
  | 'royal_traditional'
  | 'floral_romantic'
  | 'minimalist_luxury'
  | 'modern_contemporary'
  | 'bohemian'
  | 'vintage'
  | 'garden_wedding'
  | 'palace_wedding'
  | 'beach_wedding'
  | 'custom';

export type DecorPreference =
  | 'color_palette'
  | 'floral_arrangements'
  | 'stage_design'
  | 'mandap_design'
  | 'entrance_decoration'
  | 'table_decoration'
  | 'lighting'
  | 'special_installations';

// === Catering ===
export type CateringType = 'vegetarian' | 'non_vegetarian' | 'both';

// === Photography & Entertainment ===
export type PhotographyOption =
  | 'traditional'
  | 'candid'
  | 'cinematic_film'
  | 'drone'
  | 'pre_wedding_shoot'
  | 'wedding_documentary'
  | 'photo_booth';

export type EntertainmentOption =
  | 'dj'
  | 'live_band'
  | 'folk_performances'
  | 'celebrity_artist'
  | 'traditional_music'
  | 'dance_performances'
  | 'fireworks'
  | 'other';

// === Transportation ===
export type TransportationOption =
  | 'airport_transfers'
  | 'local_guest_transport'
  | 'luxury_cars'
  | 'buses_shuttles'
  | 'vip_transport';

// === Budget ===
export type BudgetRange =
  | 'below_25_lakh'
  | '25_50_lakh'
  | '50_lakh_1_crore'
  | '1_2_crore'
  | '2_5_crore'
  | 'above_5_crore'
  | 'not_decided';

export type SpendingPriority =
  | 'best_experience'
  | 'luxury_exclusivity'
  | 'budget_conscious'
  | 'balanced'
  | 'custom';

// === Service Catalogue ===
export type PricingUnit =
  | 'per_guest'
  | 'per_room_per_night'
  | 'per_event'
  | 'per_day'
  | 'per_artist'
  | 'per_vehicle'
  | 'fixed_package';

export type PriceVerificationStatus =
  | 'indicative'
  | 'vendor_estimate'
  | 'confirmed';

export interface ServiceCatalogueItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  location?: string;
  priceInPaise: number | null; // null = "Price on Request"
  pricingUnit: PricingUnit;
  inclusions: string[];
  exclusions: string[];
  addOns: ServiceAddOn[];
  priceSource: string;
  verificationStatus: PriceVerificationStatus;
  lastUpdated: string;
}

export interface ServiceAddOn {
  name: string;
  priceInPaise: number | null;
  pricingUnit: PricingUnit;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// === Budget Calculator ===
export interface BudgetLine {
  serviceId: string;
  serviceName: string;
  category: string;
  quantity: number;
  unitPriceInPaise: number;
  totalPriceInPaise: number;
  priceType: PriceVerificationStatus;
}

export interface BudgetResult {
  lines: BudgetLine[];
  categoryTotals: Record<string, number>;
  subtotalInPaise: number;
  taxesInPaise: number;
  contingencyInPaise: number;
  grandTotalInPaise: number;
  estimateType: 'indicative' | 'mixed' | 'confirmed';
}

// === Proposal ===
export interface ProposalVersion {
  id: string;
  consultationId: string;
  versionNumber: number;
  proposalData: ProposalData;
  pdfUrl?: string;
  generatedAt: string;
}

export interface ProposalData {
  coupleName?: string;
  weddingType: string;
  traditions: string[];
  ceremonies: Array<CeremonySelection | CustomCeremony>;
  destination: string;
  dates: string;
  duration: string;
  guestCount: string;
  theme: string;
  services: Array<{ category: string; items: string[] }>;
  budget: BudgetResult;
  assumptions: string[];
  exclusions: string[];
  nextSteps: string[];
}

// === Vendor ===
export interface VendorProfile {
  id: string;
  businessName: string;
  category: string;
  location: string;
  description: string;
  portfolio: string[];
  verified: boolean;
  rating?: number;
}

export interface VendorQuotation {
  id: string;
  vendorId: string;
  consultationId: string;
  quotedPriceInPaise: number;
  lineItems: Array<{
    description: string;
    priceInPaise: number;
    quantity: number;
  }>;
  inclusions: string[];
  exclusions: string[];
  status: 'requested' | 'received' | 'shortlisted' | 'rejected';
  receivedAt?: string;
}

// === Lead ===
export interface Lead {
  id: string;
  consultationId: string;
  name: string;
  email?: string;
  phone?: string;
  preferredContact: string;
  consentGiven: boolean;
  capturedAt: string;
}

// === AI Types ===
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  consultationId: string;
  currentStep: WizardStepId;
  selections: WeddingSelections;
  userMessage?: string;
  requestType: 'ceremony_explanation' | 'follow_up' | 'recommendation' | 'summary';
}

export interface AIChatResponse {
  message: string;
  suggestions?: string[];
  ceremonyDetails?: CeremonyInfo[];
}

// === UI Helpers ===
export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  image?: string;
}
