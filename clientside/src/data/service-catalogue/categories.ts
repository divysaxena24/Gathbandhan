// ============================================================
// Gathbandhan — Service Catalogue Categories
// ============================================================

import { ServiceCategory } from '@/types/wedding';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'venue',
    name: 'Venue & Lawns',
    description: 'Palaces, resorts, heritage forts, banquet ballrooms',
    icon: '🏰',
  },
  {
    id: 'catering',
    name: 'Catering & Banquets',
    description: 'Multi-course menus, live counters, royal thalis, bar',
    icon: '🍽️',
  },
  {
    id: 'decor',
    name: 'Décor & Floral Architecture',
    description: 'Mandap, stage, entry tunnels, lighting, tablescapes',
    icon: '🌸',
  },
  {
    id: 'photography',
    name: 'Photography & Cinematography',
    description: 'Candid portraits, 4K film trailers, drone footage',
    icon: '📸',
  },
  {
    id: 'entertainment',
    name: 'Artistes & Entertainment',
    description: 'DJs, live Sufi bands, folk dancers, choreography',
    icon: '🎶',
  },
  {
    id: 'accommodation',
    name: 'Accommodations & Hospitality',
    description: 'Rooms, suites, guest luggage handling, welcome desk',
    icon: '🏨',
  },
  {
    id: 'logistics',
    name: 'Logistics & Transport',
    description: 'Airport shuttles, AC coaches, luxury bridal cars',
    icon: '🚗',
  },
  {
    id: 'special',
    name: 'Special Services & Styling',
    description: 'Bridal makeup, Mehendi artists, invites, favors',
    icon: '✨',
  },
];
