// ============================================================
// Gathbandhan — Hindu Wedding Knowledge Base
// Structured, editable, versionable wedding ceremony data
// ============================================================

import { CeremonyInfo } from '@/types/wedding';

export const hinduCeremonies: CeremonyInfo[] = [
  {
    key: 'roka',
    name: 'Roka',
    weddingTypes: ['hindu'],
    regionalVariants: ['north_indian', 'punjabi_hindu', 'rajasthani'],
    description:
      'The Roka ceremony marks the formal acceptance of the match by both families. It is a joyful gathering where elders bless the couple and gifts are exchanged.',
    culturalSignificance:
      'Roka signifies the commitment of both families to the union. It is the first formal step of the wedding journey, bringing both families together in celebration.',
    typicalArrangements: [
      'Family gathering venue or home decoration',
      'Sweets and dry fruit trays',
      'Gift items for the couple and families',
      'Floral arrangements',
      'Traditional seating arrangement',
    ],
    typicalDuration: '2–3 hours',
    decorConsiderations: 'Warm, intimate setting with floral decorations and traditional elements',
    cateringConsiderations: 'Light refreshments, sweets, snacks, and beverages',
    relatedServices: ['Decoration', 'Catering', 'Photography'],
    isCommon: true,
  },
  {
    key: 'engagement',
    name: 'Engagement (Sagai)',
    weddingTypes: ['hindu'],
    description:
      'The engagement ceremony is when the couple exchanges rings in the presence of family and friends. It formalises the wedding commitment.',
    culturalSignificance:
      'The ring exchange symbolises the couple\'s promise to each other, witnessed by their loved ones. It is a celebratory event marking the beginning of wedding preparations.',
    typicalArrangements: [
      'Ring ceremony setup with stage',
      'Floral and fabric decoration',
      'Music and entertainment',
      'Catering for guests',
      'Photography and videography',
    ],
    typicalDuration: '3–5 hours',
    decorConsiderations: 'Elegant stage setup, backdrop, and table arrangements',
    cateringConsiderations: 'Full meal or elaborate high tea depending on timing',
    relatedServices: ['Venue', 'Decoration', 'Catering', 'Photography', 'DJ/Music'],
    isCommon: true,
  },
  {
    key: 'ganesh_puja',
    name: 'Ganesh Puja',
    weddingTypes: ['hindu'],
    description:
      'A prayer ceremony invoking Lord Ganesh, the remover of obstacles, seeking blessings for a smooth and auspicious wedding celebration.',
    culturalSignificance:
      'In Hindu tradition, every auspicious event begins with prayers to Lord Ganesh. This ceremony seeks divine blessings for the wedding to proceed without obstacles.',
    typicalArrangements: [
      'Puja setup with idol or image of Lord Ganesh',
      'Flowers, incense, and puja items',
      'Pandit (priest) arrangements',
      'Traditional seating',
    ],
    typicalDuration: '1–2 hours',
    decorConsiderations: 'Traditional puja decoration with flowers, rangoli, and diyas',
    cateringConsiderations: 'Prasad and light refreshments',
    relatedServices: ['Pandit', 'Decoration', 'Puja Items'],
    isCommon: true,
  },
  {
    key: 'mehendi',
    name: 'Mehendi',
    weddingTypes: ['hindu', 'muslim'],
    description:
      'A colourful ceremony where the bride and female family members have intricate henna designs applied to their hands and feet, accompanied by music and celebrations.',
    culturalSignificance:
      'Mehendi symbolises joy, beauty, and the deep bond of love. The depth of colour is traditionally believed to represent the strength of the couple\'s love.',
    typicalArrangements: [
      'Professional mehendi artists',
      'Comfortable seating for guests',
      'Music and entertainment',
      'Colourful décor with cushions and drapes',
      'Refreshments and snacks',
    ],
    typicalDuration: '4–6 hours',
    decorConsiderations: 'Vibrant, colourful setup with Rajasthani or Mughal-inspired elements',
    cateringConsiderations: 'Chaat counters, beverages, and light snacks',
    relatedServices: ['Mehendi Artists', 'Decoration', 'Music', 'Catering'],
    isCommon: true,
  },
  {
    key: 'haldi',
    name: 'Haldi',
    weddingTypes: ['hindu'],
    description:
      'A pre-wedding ritual where a paste of turmeric, sandalwood, and rose water is applied to the bride and groom for purification and to give a natural glow.',
    culturalSignificance:
      'Haldi is considered purifying and auspicious. The yellow colour represents prosperity and new beginnings. It is an intimate family gathering filled with laughter and blessings.',
    typicalArrangements: [
      'Turmeric paste and floral decorations',
      'Waterproof seating area',
      'Yellow and marigold themed décor',
      'Music system',
      'Towels and cleanup arrangements',
    ],
    typicalDuration: '2–3 hours',
    decorConsiderations: 'Yellow and marigold themed décor, outdoor setup preferred',
    cateringConsiderations: 'Light brunch or snacks with beverages',
    relatedServices: ['Decoration', 'Music', 'Catering'],
    isCommon: true,
  },
  {
    key: 'sangeet',
    name: 'Sangeet',
    weddingTypes: ['hindu', 'sikh'],
    description:
      'A lively evening of music, dance performances, and celebration. Both families prepare choreographed performances and celebrate together.',
    culturalSignificance:
      'Sangeet brings both families together through music and dance, creating bonds and shared memories before the wedding day.',
    typicalArrangements: [
      'Dance floor and stage setup',
      'Sound system and lighting',
      'DJ or live music',
      'Dinner or cocktail arrangements',
      'Choreographer (optional)',
    ],
    typicalDuration: '4–6 hours',
    decorConsiderations: 'Party-style décor with stage, dance floor, lighting effects',
    cateringConsiderations: 'Full dinner, beverage counters, dessert station',
    relatedServices: ['Venue', 'DJ', 'Choreographer', 'Decoration', 'Catering', 'Lighting'],
    isCommon: true,
  },
  {
    key: 'wedding_ceremony',
    name: 'Wedding Ceremony',
    weddingTypes: ['hindu'],
    description:
      'The main wedding ceremony includes sacred rituals such as Jaimala (garland exchange), Kanyadaan (giving away of the bride), the sacred fire ceremony, and Pheras (seven vows around the sacred fire).',
    culturalSignificance:
      'The wedding ceremony is the most sacred part of a Hindu wedding. The seven Pheras around the sacred fire represent seven vows and promises the couple makes to each other for this life and beyond.',
    typicalArrangements: [
      'Mandap (wedding canopy) setup',
      'Sacred fire (havan kund) arrangement',
      'Pandit (priest) and puja items',
      'Floral and fabric mandap decoration',
      'Seating for families and guests',
      'Baraat welcome arrangements',
    ],
    typicalDuration: '3–5 hours',
    decorConsiderations: 'Grand mandap with floral arrangements, lighting, and traditional elements',
    cateringConsiderations: 'Welcome drinks, light refreshments during ceremony',
    relatedServices: ['Mandap', 'Pandit', 'Decoration', 'Photography', 'Sound'],
    isCommon: true,
  },
  {
    key: 'vidaai',
    name: 'Vidaai',
    weddingTypes: ['hindu'],
    description:
      'An emotional farewell ceremony where the bride leaves her parental home to begin her new life. The bride throws rice over her shoulder, symbolising prosperity for her parents\' home.',
    culturalSignificance:
      'Vidaai is an emotional moment symbolising the bride\'s transition to her new family while carrying blessings and love from her birth family.',
    typicalArrangements: [
      'Decorated car or vehicle for the couple',
      'Rice and flowers for the ceremony',
      'Photography team positioned for the moment',
    ],
    typicalDuration: '30–60 minutes',
    relatedServices: ['Decorated Vehicle', 'Photography'],
    isCommon: true,
  },
  {
    key: 'reception',
    name: 'Reception',
    weddingTypes: ['hindu', 'sikh', 'muslim', 'christian', 'jain'],
    description:
      'A grand celebration where the newlywed couple is formally introduced to extended family, friends, and well-wishers. It typically includes dinner, entertainment, and the couple receiving guests on stage.',
    culturalSignificance:
      'The reception celebrates the union publicly and allows the wider community to bless the couple. It is often the grandest event of the wedding celebrations.',
    typicalArrangements: [
      'Stage and backdrop setup for the couple',
      'Elaborate dinner arrangements',
      'DJ or live entertainment',
      'Lighting and sound system',
      'Photo and video team',
      'Guest seating and table arrangements',
    ],
    typicalDuration: '4–6 hours',
    decorConsiderations: 'Grand stage, elegant table settings, ambient lighting, entrance installations',
    cateringConsiderations: 'Multi-cuisine buffet, live counters, dessert station, beverages',
    relatedServices: ['Venue', 'Decoration', 'Catering', 'DJ', 'Photography', 'Lighting'],
    isCommon: true,
  },
];

export default hinduCeremonies;
