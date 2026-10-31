// ============================================================
// Gathbandhan — Muslim Wedding Knowledge Base
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const muslimCeremonies: CeremonyInfo[] = [
  {
    key: 'muslim_engagement',
    name: 'Engagement (Mangni)',
    weddingTypes: ['muslim'],
    description:
      'A formal ceremony where both families agree to the marriage and exchange rings and gifts. Prayers are offered seeking blessings for the couple.',
    culturalSignificance:
      'The engagement marks the families\' formal consent and commitment to the union, strengthening the bond between both families.',
    typicalArrangements: [
      'Family gathering venue',
      'Ring exchange setup',
      'Gifts and sweets',
      'Light refreshments',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Decoration', 'Catering', 'Photography'],
    isCommon: true,
  },
  {
    key: 'muslim_mehendi',
    name: 'Mehendi',
    weddingTypes: ['muslim'],
    description:
      'A vibrant pre-wedding ceremony where the bride and her female relatives and friends have beautiful henna designs applied to their hands and feet.',
    culturalSignificance:
      'Mehendi is a celebration of beauty and joy. It brings the women of both families together in a colourful and festive atmosphere.',
    typicalArrangements: [
      'Professional mehendi artists',
      'Comfortable and colourful seating',
      'Music (Qawwali or contemporary)',
      'Snacks and refreshments',
    ],
    typicalDuration: '4–6 hours',
    relatedServices: ['Mehendi Artists', 'Decoration', 'Music', 'Catering'],
    isCommon: true,
  },
  {
    key: 'nikah',
    name: 'Nikah',
    weddingTypes: ['muslim'],
    description:
      'The Nikah is the sacred Islamic marriage ceremony. It involves the recitation of Quranic verses, the proposal and acceptance (Ijab-e-Qubool), signing of the Nikahnama (marriage contract), and the determination of Mehr (a gift from the groom to the bride).',
    culturalSignificance:
      'The Nikah is the most sacred aspect of an Islamic wedding. It is a solemn contract before God, witnessed by family and community, establishing the rights and responsibilities of both partners.',
    typicalArrangements: [
      'Mosque or designated ceremony venue',
      'Qazi or Maulvi (religious officiant)',
      'Nikahnama (marriage contract) documents',
      'Witnesses from both families',
      'Seating for family and guests',
      'Floral and elegant decoration',
    ],
    typicalDuration: '1–2 hours',
    decorConsiderations: 'Elegant, respectful setting with floral arrangements',
    cateringConsiderations: 'Dates, sherbet, and light refreshments',
    relatedServices: ['Qazi', 'Venue', 'Decoration', 'Photography'],
    isCommon: true,
  },
  {
    key: 'walima',
    name: 'Walima',
    weddingTypes: ['muslim'],
    description:
      'The Walima is the wedding reception hosted by the groom\'s family after the Nikah. It is a grand feast celebrating the marriage and introducing the couple to the community.',
    culturalSignificance:
      'The Walima is a Sunnah (tradition of the Prophet) and is considered a public announcement of the marriage. It is an act of gratitude and sharing of joy with the community.',
    typicalArrangements: [
      'Grand venue with elegant setup',
      'Elaborate dinner arrangements',
      'Stage for the couple',
      'Photography and videography',
      'Sound system and entertainment',
    ],
    typicalDuration: '4–6 hours',
    decorConsiderations: 'Opulent setup with stage, floral arrangements, and elegant lighting',
    cateringConsiderations: 'Grand multi-course meal, often featuring Mughlai cuisine, biryanis, and desserts',
    relatedServices: ['Venue', 'Decoration', 'Catering', 'Photography', 'Lighting'],
    isCommon: true,
  },
  {
    key: 'wedding_procession_muslim',
    name: 'Wedding Procession (Baraat)',
    weddingTypes: ['muslim'],
    description:
      'In some traditions, the groom arrives in a procession with family and friends, accompanied by music and celebrations.',
    culturalSignificance:
      'The procession celebrates the groom\'s journey to his bride, with family and friends sharing in the joy of the occasion.',
    typicalArrangements: [
      'Decorated vehicle',
      'Band or musicians',
      'Welcome arrangements at the venue',
    ],
    typicalDuration: '1–2 hours',
    relatedServices: ['Band', 'Vehicle Decoration', 'Photography'],
    isCommon: false,
  },
];

export default muslimCeremonies;
