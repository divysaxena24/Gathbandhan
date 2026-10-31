// ============================================================
// Gathbandhan — Deterministic Budget Calculator Engine
// Calculates exact line-item wedding budgets in integer paise.
// NO floating point math. Uses verified service catalogue.
// ============================================================

import { WeddingSelections, BudgetResult, BudgetLine, GuestRange } from '@/types/wedding';
import { multiplyPaise, sumPaise, calculatePercentage } from '@/lib/money';
import { SERVICE_ITEMS } from '@/data/service-catalogue/services';

/**
 * Maps guest range string or number to an estimated average guest count
 */
export function resolveGuestCount(guests?: GuestRange | number): number {
  if (typeof guests === 'number') return guests > 0 ? guests : 250;
  switch (guests) {
    case 'below_100':
      return 80;
    case '100_300':
      return 200;
    case '300_500':
      return 400;
    case '500_800':
      return 650;
    case '800_1000':
      return 900;
    case 'above_1000':
      return 1200;
    default:
      return 250;
  }
}

/**
 * Maps wedding duration to number of days
 */
export function resolveDaysCount(duration?: string): number {
  switch (duration) {
    case '1_day':
      return 1;
    case '2_days':
      return 2;
    case '3_days':
      return 3;
    case '4_5_days':
      return 4;
    case 'more_than_5':
      return 5;
    default:
      return 2;
  }
}

/**
 * Computes deterministic budget based on user selections
 */
export function calculateWeddingBudget(selections: WeddingSelections): BudgetResult {
  const lines: BudgetLine[] = [];
  const days = resolveDaysCount(selections.duration);
  const guests = resolveGuestCount(selections.totalGuests);

  // 1. Venue
  const isPalace = selections.venueType === 'palace' || selections.theme === 'palace_wedding';
  const venueItem = SERVICE_ITEMS.find((s) => s.id === (isPalace ? 'venue_palace_day' : 'venue_resort_day'))!;
  if (venueItem && venueItem.priceInPaise) {
    lines.push({
      serviceId: venueItem.id,
      serviceName: `${venueItem.name} (${days} Day${days > 1 ? 's' : ''})`,
      category: 'Venue & Lawns',
      quantity: days,
      unitPriceInPaise: venueItem.priceInPaise,
      totalPriceInPaise: multiplyPaise(venueItem.priceInPaise, days),
      priceType: venueItem.verificationStatus,
    });
  }

  // 2. Catering
  const isMixedCatering = selections.cateringType === 'both' || selections.cateringType === 'non_vegetarian';
  const cateringItem = SERVICE_ITEMS.find(
    (s) => s.id === (isMixedCatering ? 'catering_gourmet_mixed' : 'catering_gourmet_veg')
  )!;
  if (cateringItem && cateringItem.priceInPaise) {
    // Multiplied by guests and main celebration meals (approx days * 1.5 meals)
    const mealCount = Math.max(1, Math.round(days * 1.5));
    const totalCatering = multiplyPaise(cateringItem.priceInPaise, guests * mealCount);
    lines.push({
      serviceId: cateringItem.id,
      serviceName: `${cateringItem.name} (${guests} Guests × ${mealCount} banquets)`,
      category: 'Catering & Banquets',
      quantity: guests * mealCount,
      unitPriceInPaise: cateringItem.priceInPaise,
      totalPriceInPaise: totalCatering,
      priceType: cateringItem.verificationStatus,
    });
  }

  // 3. Décor & Production
  const isHighLuxuryDecor =
    selections.theme === 'royal_traditional' ||
    selections.spendingPriority === 'luxury_exclusivity' ||
    isPalace;
  const decorItem = SERVICE_ITEMS.find(
    (s) => s.id === (isHighLuxuryDecor ? 'decor_royal_package' : 'decor_classic_package')
  )!;
  if (decorItem && decorItem.priceInPaise) {
    const ceremoniesCount = Math.max(1, (selections.selectedCeremonies?.length || 3) + (selections.customCeremonies?.length || 0));
    const decorEvents = Math.min(days, Math.max(1, Math.ceil(ceremoniesCount / 2)));
    lines.push({
      serviceId: decorItem.id,
      serviceName: `${decorItem.name} (${decorEvents} Setup Day${decorEvents > 1 ? 's' : ''})`,
      category: 'Décor & Styling',
      quantity: decorEvents,
      unitPriceInPaise: decorItem.priceInPaise,
      totalPriceInPaise: multiplyPaise(decorItem.priceInPaise, decorEvents),
      priceType: decorItem.verificationStatus,
    });
  }

  // 4. Photography & Cinematography
  if (selections.photography && selections.photography.length > 0) {
    const photoItem = SERVICE_ITEMS.find((s) => s.id === 'photo_cinematic_complete')!;
    if (photoItem && photoItem.priceInPaise) {
      lines.push({
        serviceId: photoItem.id,
        serviceName: `${photoItem.name} (${selections.photography.length} selections)`,
        category: 'Photography & Film',
        quantity: 1,
        unitPriceInPaise: photoItem.priceInPaise,
        totalPriceInPaise: photoItem.priceInPaise,
        priceType: photoItem.verificationStatus,
      });
    }
  }

  // 5. Entertainment
  if (selections.entertainment && selections.entertainment.includes('dj')) {
    const djItem = SERVICE_ITEMS.find((s) => s.id === 'ent_dj_sangeet')!;
    if (djItem && djItem.priceInPaise) {
      lines.push({
        serviceId: djItem.id,
        serviceName: djItem.name,
        category: 'Entertainment',
        quantity: 1,
        unitPriceInPaise: djItem.priceInPaise,
        totalPriceInPaise: djItem.priceInPaise,
        priceType: djItem.verificationStatus,
      });
    }
  }

  if (selections.entertainment && selections.entertainment.includes('live_band')) {
    const bandItem = SERVICE_ITEMS.find((s) => s.id === 'ent_live_band')!;
    if (bandItem && bandItem.priceInPaise) {
      lines.push({
        serviceId: bandItem.id,
        serviceName: bandItem.name,
        category: 'Entertainment',
        quantity: 1,
        unitPriceInPaise: bandItem.priceInPaise,
        totalPriceInPaise: bandItem.priceInPaise,
        priceType: bandItem.verificationStatus,
      });
    }
  }

  // 6. Accommodation
  if (selections.needAccommodation) {
    const rooms = selections.accommodationRooms || 30;
    const nights = selections.accommodationNights || days;
    const roomItem = SERVICE_ITEMS.find((s) => s.id === 'room_five_star')!;
    if (roomItem && roomItem.priceInPaise) {
      const roomNights = rooms * nights;
      lines.push({
        serviceId: roomItem.id,
        serviceName: `${roomItem.name} (${rooms} Rooms × ${nights} Nights)`,
        category: 'Accommodation & Stay',
        quantity: roomNights,
        unitPriceInPaise: roomItem.priceInPaise,
        totalPriceInPaise: multiplyPaise(roomItem.priceInPaise, roomNights),
        priceType: roomItem.verificationStatus,
      });
    }
  }

  // 7. Transport
  if (selections.transportation && selections.transportation.length > 0) {
    const transItem = SERVICE_ITEMS.find((s) => s.id === 'transport_coaches_fleet')!;
    if (transItem && transItem.priceInPaise) {
      lines.push({
        serviceId: transItem.id,
        serviceName: `${transItem.name} (${days} Days)`,
        category: 'Logistics & Transport',
        quantity: days,
        unitPriceInPaise: transItem.priceInPaise,
        totalPriceInPaise: multiplyPaise(transItem.priceInPaise, days),
        priceType: transItem.verificationStatus,
      });
    }
  }

  // 8. Special Services
  if (selections.additionalServices && selections.additionalServices.includes('bridal_makeup')) {
    const muItem = SERVICE_ITEMS.find((s) => s.id === 'special_bridal_makeup')!;
    if (muItem && muItem.priceInPaise) {
      lines.push({
        serviceId: muItem.id,
        serviceName: muItem.name,
        category: 'Special Styling',
        quantity: 1,
        unitPriceInPaise: muItem.priceInPaise,
        totalPriceInPaise: muItem.priceInPaise,
        priceType: muItem.verificationStatus,
      });
    }
  }

  if (selections.additionalServices && selections.additionalServices.includes('hospitality_team')) {
    const hospItem = SERVICE_ITEMS.find((s) => s.id === 'special_hospitality_shadow')!;
    if (hospItem && hospItem.priceInPaise) {
      lines.push({
        serviceId: hospItem.id,
        serviceName: hospItem.name,
        category: 'Special Styling',
        quantity: 1,
        unitPriceInPaise: hospItem.priceInPaise,
        totalPriceInPaise: hospItem.priceInPaise,
        priceType: hospItem.verificationStatus,
      });
    }
  }

  // Calculate Category Totals
  const categoryTotals: Record<string, number> = {};
  for (const line of lines) {
    categoryTotals[line.category] = (categoryTotals[line.category] || 0) + line.totalPriceInPaise;
  }

  // Subtotal in paise
  const subtotalInPaise = sumPaise(lines.map((l) => l.totalPriceInPaise));

  // 18% GST in paise
  const taxesInPaise = calculatePercentage(subtotalInPaise, 18);

  // 5% Contingency in paise
  const contingencyInPaise = calculatePercentage(subtotalInPaise, 5);

  // Grand Total in paise
  const grandTotalInPaise = subtotalInPaise + taxesInPaise + contingencyInPaise;

  return {
    lines,
    categoryTotals,
    subtotalInPaise,
    taxesInPaise,
    contingencyInPaise,
    grandTotalInPaise,
    estimateType: 'indicative',
  };
}
