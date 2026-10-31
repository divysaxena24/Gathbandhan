// ============================================================
// Gathbandhan — Interfaith & Custom Wedding Knowledge Base
// Multi-cultural blends and personalized ceremony structures
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const interfaithCeremonies: CeremonyInfo[] = [
  {
    key: 'dual_ceremonies',
    name: 'Dual Faith Ceremonies',
    weddingTypes: ['interfaith', 'custom'],
    description:
      'Honouring both families traditions through two distinct sacred rituals (e.g., Morning Church Nuptials followed by Evening Mandap Pheras, or Nikah followed by Anand Karaj).',
    culturalSignificance:
      'Creates a harmonious celebration that reveres both partners cultural and spiritual heritage without compromise.',
    typicalArrangements: [
      'Coordinated transition timeline between ritual spaces',
      'Dual officiants / priests in close communication',
      'Attire change provisions for couple and close family',
      'Thoughtful ceremony program guide for multi-faith guests',
    ],
    typicalDuration: 'Full Day / Multi-Day',
    relatedServices: ['Event Production', 'Multi-Theme Décor', 'Hospitality Management', 'Photography & Film'],
    isCommon: true,
  },
  {
    key: 'fusion_sangeet',
    name: 'Fusion Sangeet & Cocktail Night',
    weddingTypes: ['interfaith', 'custom'],
    description:
      'An electric high-energy celebration blending traditional dances, musical performances from diverse cultures, signature cocktails, and live fusion bands.',
    culturalSignificance:
      'Brings both families together on the dance floor in pure celebration, breaking cultural ice and creating lasting memories.',
    typicalArrangements: [
      'Concert-style stage and intelligent light & sound trussing',
      'Professional choreographer coordination for family dances',
      'Celebrity DJ / Live Fusion Band',
      'Interactive culinary stations and mixology bar',
    ],
    typicalDuration: '4–6 hours',
    relatedServices: ['AV & Stage Production', 'Choreographer', 'Live Band / DJ', 'Bar Services', 'Catering'],
    isCommon: true,
  },
  {
    key: 'personalized_vows',
    name: 'Personalised Vows & Ring Exchange',
    weddingTypes: ['interfaith', 'custom'],
    description:
      'A bespoke vow exchange ceremony curated with personal readings, unity rituals (like a sand blending or tree planting ritual), and heartfelt promises.',
    culturalSignificance:
      'Expresses the couples individual love story and shared philosophy beyond conventional dogma.',
    typicalArrangements: [
      'Scenic outdoor amphitheatre or beachfront altar',
      'Acoustic strings quartet or acoustic vocalist',
      'Personalised vow books and printed programs',
      'Champagne or mocktail toast immediately following',
    ],
    typicalDuration: '1–2 hours',
    relatedServices: ['Bespoke Décor', 'Acoustic Musicians', 'Cinematography', 'Sound Setup'],
    isCommon: true,
  },
  {
    key: 'grand_celebration_reception',
    name: 'Grand Celebration Banquet',
    weddingTypes: ['interfaith', 'custom'],
    description:
      'An inclusive, world-class reception dinner honoring all cultures through an extraordinary multi-cuisine feast and warm speeches.',
    culturalSignificance:
      'Unites all communities in a festive toast to love, family, and shared futures.',
    typicalArrangements: [
      'Elaborate banquet seating with bespoke floral centerpieces',
      'Curated international and regional food stations',
      'Speeches and toasts stage setup',
      'Late-night afterparty lounge',
    ],
    typicalDuration: '4–6 hours',
    relatedServices: ['Gourmet Multi-Cuisine Catering', 'Luxury Styling', 'Entertainment', 'Photography'],
    isCommon: true,
  },
];
