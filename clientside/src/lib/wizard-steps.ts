// ============================================================
// Gathbandhan — Wizard Step Definitions
// ============================================================

import { WizardStep, WeddingSelections } from '@/types/wedding';

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'wedding_type',
    title: 'Wedding Type',
    subtitle: 'What type of wedding are you planning?',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'regional_traditions',
    title: 'Family Traditions',
    subtitle: 'Tell us about your regional and family traditions',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'ceremony_discovery',
    title: 'Discover Ceremonies',
    subtitle: 'Learn about the beautiful traditions of your wedding',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'ceremony_selection',
    title: 'Select Ceremonies',
    subtitle: 'Choose the ceremonies for your wedding celebration',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'destination',
    title: 'Destination & Venue',
    subtitle: 'Where would you like to celebrate your wedding?',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'date_duration',
    title: 'Date & Duration',
    subtitle: 'When and how long will your wedding celebration be?',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'guest_count',
    title: 'Guest Count',
    subtitle: 'How many guests will join your celebration?',
    isOptional: false,
    isConditional: false,
  },
  {
    id: 'theme_decor',
    title: 'Theme & Decoration',
    subtitle: 'Create the perfect ambiance for your wedding',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'catering',
    title: 'Catering & Cuisine',
    subtitle: 'Plan the perfect wedding feast',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'photo_entertainment',
    title: 'Photography & Entertainment',
    subtitle: 'Capture and celebrate every moment',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'accommodation',
    title: 'Accommodation & Transport',
    subtitle: 'Take care of your guests\' comfort',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'additional_services',
    title: 'Additional Services',
    subtitle: 'Complete your wedding with special touches',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'budget_preferences',
    title: 'Budget & Priorities',
    subtitle: 'Set your budget and spending preferences',
    isOptional: true,
    isConditional: false,
  },
  {
    id: 'review_summary',
    title: 'Review Your Plan',
    subtitle: 'Review and confirm your wedding selections',
    isOptional: false,
    isConditional: false,
  },
];

/**
 * Get the visible steps for the current selections.
 * Filters out conditional steps whose condition is not met.
 */
export function getVisibleSteps(selections: WeddingSelections): WizardStep[] {
  return WIZARD_STEPS.filter((step) => {
    if (!step.isConditional) return true;
    if (step.condition) return step.condition(selections);
    return true;
  });
}

/**
 * Get step index within visible steps.
 */
export function getStepProgress(
  currentIndex: number,
  selections: WeddingSelections
): { current: number; total: number; percentage: number } {
  const visible = getVisibleSteps(selections);
  const total = visible.length;
  const current = Math.min(currentIndex + 1, total);
  const percentage = Math.round((current / total) * 100);
  return { current, total, percentage };
}
