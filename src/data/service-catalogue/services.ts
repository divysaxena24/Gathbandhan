// ============================================================
// Gathbandhan — Service Catalogue Items (Paise integer values)
// 1 INR = 100 paise
// Realistic indicative luxury wedding pricing
// ============================================================

import { ServiceCatalogueItem } from '@/types/wedding';

export const SERVICE_ITEMS: ServiceCatalogueItem[] = [
  // --- VENUE ---
  {
    id: 'venue_palace_day',
    categoryId: 'venue',
    name: 'Royal Heritage Palace Rental',
    description: 'Exclusive rental of palace courtyards, banquet halls, and grounds',
    priceInPaise: 80000000, // ₹8,00,000 per day
    pricingUnit: 'per_day',
    inclusions: ['Lawns', 'Inner courtyard', 'Bridal suite access', 'Security & cleaning'],
    exclusions: ['Electricity generator backup fuel', 'Government luxury tax'],
    addOns: [],
    priceSource: 'Udaipur Palace Partner Tariff',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },
  {
    id: 'venue_resort_day',
    categoryId: 'venue',
    name: '5-Star Luxury Resort Lawns & Ballroom',
    description: 'Sprawling poolside lawns and grand indoor ballroom',
    priceInPaise: 50000000, // ₹5,00,000 per day
    pricingUnit: 'per_day',
    inclusions: ['Air conditioned banquet ballroom', 'Poolside lawn', 'Parking valet'],
    exclusions: ['Corkage fee'],
    addOns: [],
    priceSource: 'Goa & Jaipur Resort Network',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },

  // --- CATERING ---
  {
    id: 'catering_gourmet_veg',
    categoryId: 'catering',
    name: 'Royal Gourmet Vegetarian Banquet',
    description: '8-course live banquet with royal Rajasthani, Awadhi, Asian & Chaat counters',
    priceInPaise: 300000, // ₹3,000 per guest
    pricingUnit: 'per_guest',
    inclusions: ['Live counters', 'Gourmet desserts', 'Welcome mocktails', 'Service staff'],
    exclusions: ['Alcoholic beverages'],
    addOns: [],
    priceSource: 'The Royal Knot Catering Council',
    verificationStatus: 'confirmed',
    lastUpdated: '2026-10-01',
  },
  {
    id: 'catering_gourmet_mixed',
    categoryId: 'catering',
    name: 'Grand Multi-Cuisine Veg & Non-Veg Banquet',
    description: 'Segregated live kitchens, regional seafood, mutton biryanis, international counters',
    priceInPaise: 400000, // ₹4,000 per guest
    pricingUnit: 'per_guest',
    inclusions: ['Segregated live counters', 'Gourmet seafood & meat', 'Dessert extravaganza'],
    exclusions: ['Imported liquor licence'],
    addOns: [],
    priceSource: 'The Royal Knot Catering Council',
    verificationStatus: 'confirmed',
    lastUpdated: '2026-10-01',
  },

  // --- DECOR ---
  {
    id: 'decor_royal_package',
    categoryId: 'decor',
    name: 'Royal Heritage Floral & Mandap Architecture',
    description: 'Grand floral mandap, entrance tunnel with 10,000 fresh blooms, chandeliers',
    priceInPaise: 120000000, // ₹12,00,000 per event
    pricingUnit: 'per_event',
    inclusions: ['Fresh Dutch flowers', 'Curated furniture', 'Truss & lighting', 'Bridal walkway'],
    exclusions: ['Imported glass stage extensions'],
    addOns: [],
    priceSource: 'Verified Decor Guild',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },
  {
    id: 'decor_classic_package',
    categoryId: 'decor',
    name: 'Elegant Floral & Ambient Lighting Package',
    description: 'Chic floral arches, fairy lighting, elegant stage and guest tablescapes',
    priceInPaise: 65000000, // ₹6,50,000 per event
    pricingUnit: 'per_event',
    inclusions: ['Floral backdrop', 'Guest table centerpieces', 'Fairy light canopies'],
    exclusions: [],
    addOns: [],
    priceSource: 'Verified Decor Guild',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },

  // --- PHOTOGRAPHY ---
  {
    id: 'photo_cinematic_complete',
    categoryId: 'photography',
    name: 'Candid & Cinematic Film Master Suite',
    description: 'Team of 6 top candid photographers, cinematographers, drone pilot & 4K teaser',
    priceInPaise: 55000000, // ₹5,50,000 fixed package
    pricingUnit: 'fixed_package',
    inclusions: ['2 Candid Photographers', '2 Cinematographers', '1 Drone Pilot', 'Couture Leather Album', '3-5 min 4K trailer'],
    exclusions: ['Travel airfare beyond India'],
    addOns: [],
    priceSource: 'Wedding Cinema Guild',
    verificationStatus: 'confirmed',
    lastUpdated: '2026-10-01',
  },

  // --- ENTERTAINMENT ---
  {
    id: 'ent_dj_sangeet',
    categoryId: 'entertainment',
    name: 'Celebrity DJ & Concert Sound / LED Truss',
    description: 'Top wedding club DJ with concert JBL VTX line array sound, laser & LED visual wall',
    priceInPaise: 35000000, // ₹3,50,000 per event
    pricingUnit: 'per_event',
    inclusions: ['Professional DJ & Visualizer', 'Concert Sound Truss', 'LED Video Wall'],
    exclusions: ['Artist hospitality riders'],
    addOns: [],
    priceSource: 'Entertainment Artiste Directory',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },
  {
    id: 'ent_live_band',
    categoryId: 'entertainment',
    name: 'Live Bollywood / Sufi Acoustic Band',
    description: '5-piece live band for cocktail & dinner atmosphere',
    priceInPaise: 25000000, // ₹2,50,000 per event
    pricingUnit: 'per_event',
    inclusions: ['5 musicians & lead vocalist', 'Band backline instruments'],
    exclusions: [],
    addOns: [],
    priceSource: 'Entertainment Artiste Directory',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },

  // --- ACCOMMODATION ---
  {
    id: 'room_five_star',
    categoryId: 'accommodation',
    name: '5-Star Resort Deluxe Room',
    description: 'Double occupancy deluxe guest room with buffet breakfast included',
    priceInPaise: 1500000, // ₹15,000 per room per night
    pricingUnit: 'per_room_per_night',
    inclusions: ['Buffet breakfast', 'High speed WiFi', 'Pool & gym access'],
    exclusions: ['Mini bar & laundry'],
    addOns: [],
    priceSource: 'Partner Luxury Hotels Group',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },

  // --- TRANSPORT ---
  {
    id: 'transport_coaches_fleet',
    categoryId: 'logistics',
    name: 'Luxury AC Bus & Innova Fleet',
    description: '2 Luxury AC 35-seater buses + 3 Toyota Crystas for transfers',
    priceInPaise: 8000000, // ₹80,000 per day
    pricingUnit: 'per_day',
    inclusions: ['Fuel, driver charges, toll & parking allowances'],
    exclusions: ['Interstate permit tax'],
    addOns: [],
    priceSource: 'Pan-India Transport Network',
    verificationStatus: 'indicative',
    lastUpdated: '2026-10-01',
  },

  // --- SPECIAL SERVICES ---
  {
    id: 'special_bridal_makeup',
    categoryId: 'special',
    name: 'Bridal Couture Makeup & Hair (3 Events)',
    description: 'Senior celebrity makeup artist with airbrush, draping, and hair styling for 3 functions',
    priceInPaise: 12000000, // ₹1,20,000 fixed
    pricingUnit: 'fixed_package',
    inclusions: ['Airbrush technique', 'Lashes & hair extensions', 'Saree & lehenga draping'],
    exclusions: ['Pre-wedding trials at studio'],
    addOns: [],
    priceSource: 'Stylist Registry',
    verificationStatus: 'confirmed',
    lastUpdated: '2026-10-01',
  },
  {
    id: 'special_hospitality_shadow',
    categoryId: 'special',
    name: 'Shadow Planner & Hospitality Helpdesk',
    description: '2 Personal shadows for Bride & Groom + 4 Hospitality team members at hotel desk',
    priceInPaise: 15000000, // ₹1,50,000 fixed package
    pricingUnit: 'fixed_package',
    inclusions: ['24/7 guest coordination', 'Luggage tags and check-in assistance', 'Bridal shadow'],
    exclusions: [],
    addOns: [],
    priceSource: 'The Royal Knot Team Standard',
    verificationStatus: 'confirmed',
    lastUpdated: '2026-10-01',
  },
];
