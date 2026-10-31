// ============================================================
// Gathbandhan — Sikh Wedding Knowledge Base
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const sikhCeremonies: CeremonyInfo[] = [
  {
    key: 'sikh_roka',
    name: 'Roka / Engagement',
    weddingTypes: ['sikh'],
    description:
      'The Roka ceremony in a Sikh wedding formally announces the match. Elders from both families meet, exchange gifts, and bless the couple.',
    culturalSignificance:
      'Marks the beginning of the wedding journey with families committing to the union. Ardas (prayer) is often performed seeking divine blessings.',
    typicalArrangements: [
      'Family gathering at home or Gurudwara',
      'Sweets and gifts exchange',
      'Ardas (prayer)',
      'Light refreshments',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Decoration', 'Catering', 'Photography'],
    isCommon: true,
  },
  {
    key: 'mehendi_sikh',
    name: 'Mehendi',
    weddingTypes: ['sikh'],
    description:
      'The bride and female family members gather for a joyful henna application ceremony with music and dance.',
    culturalSignificance:
      'A celebration of joy and beauty, bringing the women of both families together before the wedding.',
    typicalArrangements: [
      'Mehendi artists',
      'Colourful décor and seating',
      'Music and entertainment',
      'Snacks and refreshments',
    ],
    typicalDuration: '4–5 hours',
    relatedServices: ['Mehendi Artists', 'Decoration', 'Music', 'Catering'],
    isCommon: true,
  },
  {
    key: 'chooda',
    name: 'Chooda Ceremony',
    weddingTypes: ['sikh'],
    description:
      'The maternal uncle (mama) presents the bride with a set of red and white bangles (chooda) which she wears for a set period after the wedding.',
    culturalSignificance:
      'The Chooda symbolises the bride\'s new marital status and the blessings of her maternal family. It is an emotional and intimate ceremony.',
    typicalArrangements: [
      'Chooda set (red and white bangles)',
      'Kalire (hanging ornaments)',
      'Milk bath for the bangles',
      'Intimate family setting',
    ],
    typicalDuration: '1–2 hours',
    relatedServices: ['Photography', 'Decoration'],
    isCommon: true,
  },
  {
    key: 'maiyan',
    name: 'Maiyan',
    weddingTypes: ['sikh'],
    regionalVariants: ['punjabi_sikh'],
    description:
      'Similar to Haldi, the Maiyan involves applying a mixture of turmeric and mustard oil to the bride and groom. A red thread (mauli) is tied around their wrists.',
    culturalSignificance:
      'The Maiyan purifies the couple before the wedding and is a joyful family gathering filled with singing, teasing, and blessings.',
    typicalArrangements: [
      'Turmeric and oil preparation',
      'Red cloth and decorations',
      'Music and traditional songs',
      'Casual seating area',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Decoration', 'Music', 'Catering'],
    isCommon: true,
  },
  {
    key: 'milni',
    name: 'Milni',
    weddingTypes: ['sikh'],
    description:
      'A ceremony where male members of both families are formally introduced and exchange garlands, symbolising the merging of two families.',
    culturalSignificance:
      'Milni represents the coming together of two families with respect and warmth. It is often accompanied by friendly competitions and laughter.',
    typicalArrangements: [
      'Garlands for family members',
      'Designated ceremony area',
      'Photography',
    ],
    typicalDuration: '30–45 minutes',
    relatedServices: ['Photography', 'Decoration'],
    isCommon: true,
  },
  {
    key: 'baraat_sikh',
    name: 'Baraat',
    weddingTypes: ['sikh'],
    description:
      'The groom\'s wedding procession arrives at the ceremony venue with music, dancing, and celebration.',
    culturalSignificance:
      'The Baraat is a grand, joyful procession announcing the groom\'s arrival. It is one of the most energetic parts of the wedding celebrations.',
    typicalArrangements: [
      'Band or DJ for the procession',
      'Decorated vehicle or horse for the groom',
      'Welcome arrangements at the venue',
      'Dhol players',
    ],
    typicalDuration: '1–2 hours',
    relatedServices: ['Band/DJ', 'Vehicle Decoration', 'Photography'],
    isCommon: true,
  },
  {
    key: 'anand_karaj',
    name: 'Anand Karaj',
    weddingTypes: ['sikh'],
    description:
      'The sacred Sikh wedding ceremony performed in the presence of the Guru Granth Sahib. The couple walks around the holy book four times (Laavan), each round accompanied by a hymn.',
    culturalSignificance:
      'Anand Karaj means "Blissful Union." The four Laavan represent the four stages of love and spiritual growth. It is a deeply spiritual ceremony connecting the couple to each other and to God.',
    typicalArrangements: [
      'Gurudwara or venue with Guru Granth Sahib setup',
      'Ragis (hymn singers)',
      'Rumala and ceremonial items',
      'Seating for congregation',
      'Karah Prasad preparation',
    ],
    typicalDuration: '2–3 hours',
    decorConsiderations: 'Respectful, elegant setting honouring the sanctity of the Guru Granth Sahib',
    cateringConsiderations: 'Langar (community meal) arrangements',
    relatedServices: ['Gurudwara', 'Ragis', 'Photography', 'Decoration'],
    isCommon: true,
  },
  {
    key: 'reception_sikh',
    name: 'Reception',
    weddingTypes: ['sikh'],
    description:
      'A grand evening celebration where the newlywed couple is introduced to extended family and friends with dinner, music, and entertainment.',
    culturalSignificance:
      'The reception allows the wider community to bless and celebrate with the couple. It is typically a grand affair with Punjabi hospitality at its best.',
    typicalArrangements: [
      'Grand stage setup',
      'DJ and dance floor',
      'Elaborate dinner buffet',
      'Photo and video coverage',
      'Lighting and sound system',
    ],
    typicalDuration: '4–6 hours',
    relatedServices: ['Venue', 'Decoration', 'Catering', 'DJ', 'Photography', 'Lighting'],
    isCommon: true,
  },
];

export default sikhCeremonies;
