// ============================================================
// Gathbandhan — Jain Wedding Knowledge Base
// Structured ceremony knowledge for Jain weddings
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const jainCeremonies: CeremonyInfo[] = [
  {
    key: 'lagna_lekhan',
    name: 'Lagna Lekhan & Sagai',
    weddingTypes: ['jain'],
    regionalVariants: ['gujarati', 'rajasthani'],
    description:
      'The sacred ceremony where the wedding date and auspicious muhurat are formally inscribed on a ceremonial scroll in the presence of Jain priests, followed by the engagement (Sagai).',
    culturalSignificance:
      'Divine sanctification of the alliance with recitation of sacred Navkar Mantra and invocation of the Tirthankaras for peace and prosperity.',
    typicalArrangements: [
      'Pooja setup with idol or picture of Tirthankaras',
      'Ceremonial quill and engraved scroll',
      'Sweets and auspicious gifts exchange',
      'Strict Jain satvik catering',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Traditional Décor', 'Satvik Catering', 'Photography', 'Pandit / Priest'],
    isCommon: true,
  },
  {
    key: 'manda_ropar_mehendi',
    name: 'Manda Ropan & Mehendi',
    weddingTypes: ['jain'],
    regionalVariants: ['gujarati', 'rajasthani'],
    description:
      'Erection of the holy mandap pavilion with religious rituals and prayers, followed by joyous henna application for the bride and family.',
    culturalSignificance:
      'Consecrating the sacred space where the wedding vows will be taken and showering the bride with joyous love.',
    typicalArrangements: [
      'Floral torans and sacred pavilion installation',
      'Professional mehendi artists',
      'Traditional folk singing / Sangeet',
      'Daytime light refreshments',
    ],
    typicalDuration: '3–4 hours',
    relatedServices: ['Mehendi Artists', 'Floral Décor', 'Photography', 'Music Setup'],
    isCommon: true,
  },
  {
    key: 'jain_phera',
    name: 'Hastamelap & Pheras',
    weddingTypes: ['jain'],
    regionalVariants: ['gujarati', 'rajasthani'],
    description:
      'The central marriage rites: Kanyavaran, Hastamelap (joining of hands), Granthisthapan, and the sacred circumambulations (Pheras) accompanied by the recitation of Mangal Ashtak.',
    culturalSignificance:
      'The four pheras symbolise Dharma, Artha, Kama, and Moksha, emphasizing spiritual harmony and non-violence (Ahimsa).',
    typicalArrangements: [
      'Sacred Jain mandap adorned with fresh flowers and auspicious symbols',
      'Priest chanting authentic Jain shlokas and Navkar Mahamantra',
      'Pure satvik prasadam and feast before sunset (Chauvihar)',
      'Traditional Shehnai and musical ambiance',
    ],
    typicalDuration: '3–4 hours',
    relatedServices: ['Mandap Décor', 'Satvik Feast Catering', 'Pandit', 'Cinematography'],
    isCommon: true,
  },
  {
    key: 'jain_reception',
    name: 'Ashirwad & Reception Dinner',
    weddingTypes: ['jain'],
    regionalVariants: ['gujarati', 'rajasthani'],
    description:
      'A formal evening gathering to bless the newly wedded couple, host extended community members, and celebrate with a gourmet Jain banquet.',
    culturalSignificance:
      'Community welcome and elder blessings for the couple entering the Grihastha ashram.',
    typicalArrangements: [
      'Grand reception stage and royal lighting',
      'Elaborate Jain multi-cuisine gourmet spread (no root vegetables, pure ghee delicacies)',
      'Live instrumental or classical fusion music',
      'Guest welcoming hospitality team',
    ],
    typicalDuration: '4–5 hours',
    relatedServices: ['Stage & Venue Décor', 'Gourmet Jain Catering', 'Photography & Videography', 'Live Music'],
    isCommon: true,
  },
];
