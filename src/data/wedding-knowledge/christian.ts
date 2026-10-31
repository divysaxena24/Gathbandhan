// ============================================================
// Gathbandhan — Christian Wedding Knowledge Base
// Structured ceremony knowledge for Indian Christian weddings
// (Syrian Christian, Goan Catholic, Anglo-Indian traditions)
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const christianCeremonies: CeremonyInfo[] = [
  {
    key: 'christian_betrothal',
    name: 'Betrothal / Engagement',
    weddingTypes: ['christian'],
    regionalVariants: ['kerala_christian', 'goan', 'anglo_indian'],
    description:
      'The formal church engagement or ring exchange ceremony where the bride and groom formally promise their commitment in front of the priest and congregation.',
    culturalSignificance:
      'Blessing of the rings and reading of the engagement banns in the church, invoking divine grace and family unity.',
    typicalArrangements: [
      'Church service with priest blessings',
      'Ring ceremony exchange',
      'Family banquet / reception lunch',
      'Floral altar and pew arrangements',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Church Décor', 'Catering', 'Photography', 'Choir / Music'],
    isCommon: true,
  },
  {
    key: 'roce_manjal',
    name: 'Roce / Haldaat Ceremony',
    weddingTypes: ['christian'],
    regionalVariants: ['goan', 'kerala_christian'],
    description:
      'The Goan and Mangalorean Roce (coconut milk ceremony) or Kerala Manjal Neeru, where holy coconut milk or herbal paste is applied to the bride and groom at their respective homes.',
    culturalSignificance:
      'Purification and blessing marking the transition from single life to married life, accompanied by traditional hymns and joyous songs.',
    typicalArrangements: [
      'Fresh coconut milk / herbal oil blessing',
      'Traditional setup with brass lamps and banana leaves',
      'Family fellowship and traditional snacks',
      'Folk singing / local choir',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Traditional Décor', 'Photography', 'Catering', 'Sound System'],
    isCommon: true,
  },
  {
    key: 'church_wedding_ceremony',
    name: 'Nuptial Mass / Church Wedding',
    weddingTypes: ['christian'],
    regionalVariants: ['kerala_christian', 'goan', 'anglo_indian'],
    description:
      'The sacred wedding service at church featuring the bridal march, solemn vows, exchange of rings, tying of the Minnu / Thali (in South Indian Christian weddings), and nuptial blessing.',
    culturalSignificance:
      'The holy sacrament of matrimony, sealing a lifetime covenant in the presence of God, priest, and family.',
    typicalArrangements: [
      'Bridal bouquet and bridesmaid floral accessories',
      'Aisle runners, altar flowers, and pew bows',
      'Choir and organist / instrumentalist',
      'Order of service booklets',
      'Minnu / Thali and Manthrakodi (for Kerala Syrian Christian rites)',
    ],
    typicalDuration: '2–3 hours',
    relatedServices: ['Church Décor', 'Choir', 'Cinematography', 'Bridal Styling', 'Vintage Car'],
    isCommon: true,
  },
  {
    key: 'christian_reception',
    name: 'Wedding Reception & Grand Ball',
    weddingTypes: ['christian'],
    regionalVariants: ['goan', 'anglo_indian', 'kerala_christian'],
    description:
      'An elegant evening gala featuring the first waltz/dance, celebratory toasts, cutting of the multi-tier wedding cake, live band performances, and dinner banquet.',
    culturalSignificance:
      'A joyous community celebration where family and friends toast the new couple and celebrate together on the dance floor.',
    typicalArrangements: [
      'Grand ballroom or open-air lawn setting',
      'Tiered wedding cake and champagne toast',
      'Live Western/Pop wedding band or DJ',
      'Plated multi-course or buffet banquet dinner',
      'Photobooth with personalised backdrop',
    ],
    typicalDuration: '4–6 hours',
    relatedServices: ['Luxury Décor', 'Live Band / DJ', 'Wedding Cake', 'Bar Services', 'Catering', 'Cinematography'],
    isCommon: true,
  },
];
