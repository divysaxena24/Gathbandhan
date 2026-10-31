// ============================================================
// Gathbandhan — Wedding Knowledge Base Index
// Central registry and lookup helper methods
// ============================================================

import { CeremonyInfo, WeddingType, RegionalTradition } from '@/types/wedding';
import { hinduCeremonies } from './hindu';
import { sikhCeremonies } from './sikh';
import { muslimCeremonies } from './muslim';
import { christianCeremonies } from './christian';
import { jainCeremonies } from './jain';
import { interfaithCeremonies } from './interfaith';

export const ALL_CEREMONIES: CeremonyInfo[] = [
  ...hinduCeremonies,
  ...sikhCeremonies,
  ...muslimCeremonies,
  ...christianCeremonies,
  ...jainCeremonies,
  ...interfaithCeremonies,
];

/**
 * Get ceremonies associated with a specific wedding type.
 * For interfaith/custom, returns comprehensive selection.
 */
export function getCeremoniesForWeddingType(type?: WeddingType): CeremonyInfo[] {
  if (!type) return ALL_CEREMONIES;

  if (type === 'interfaith' || type === 'custom') {
    return [
      ...interfaithCeremonies,
      ...hinduCeremonies.filter((c) => ['mehendi', 'sangeet', 'wedding_ceremony', 'reception'].includes(c.key)),
      ...sikhCeremonies.filter((c) => ['anand_karaj'].includes(c.key)),
      ...christianCeremonies.filter((c) => ['church_wedding_ceremony'].includes(c.key)),
      ...muslimCeremonies.filter((c) => ['nikah'].includes(c.key)),
    ];
  }

  const matches = ALL_CEREMONIES.filter((ceremony) => ceremony.weddingTypes.includes(type));
  return matches.length > 0 ? matches : ALL_CEREMONIES;
}

/**
 * Filter ceremonies further by selected regional traditions if specified.
 */
export function getCeremoniesByTraditions(
  weddingType?: WeddingType,
  traditions?: RegionalTradition[]
): CeremonyInfo[] {
  const baseList = getCeremoniesForWeddingType(weddingType);
  if (!traditions || traditions.length === 0) return baseList;

  // Filter or prioritize regional ceremonies
  return baseList.filter((c) => {
    if (!c.regionalVariants || c.regionalVariants.length === 0) return true;
    return c.regionalVariants.some((variant) => traditions.includes(variant));
  });
}

/**
 * Find ceremony details by key.
 */
export function getCeremonyByKey(key: string): CeremonyInfo | undefined {
  return ALL_CEREMONIES.find((c) => c.key === key);
}
