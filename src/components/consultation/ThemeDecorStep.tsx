'use client';

// ============================================================
// Gathbandhan — Step 8: Theme & Decoration Preferences
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import SelectionCard from '@/components/consultation-ui/SelectionCard';
import { ThemeType, DecorPreference } from '@/types/wedding';
import { Palette, Sparkles, Check } from 'lucide-react';

const THEMES: Array<{
  value: ThemeType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'royal_traditional',
    label: 'Royal Heritage',
    description: 'Gold filigree, deep maroons, velvet drapes, and heritage motifs',
    icon: '👑',
  },
  {
    value: 'floral_romantic',
    label: 'Floral Romantic',
    description: 'Cascading hydrangeas, roses, pastel draping, and fairy lights',
    icon: '🌸',
  },
  {
    value: 'minimalist_luxury',
    label: 'Minimalist Luxury',
    description: 'Clean architectural lines, monochromatic ivory, and statement botanicals',
    icon: '🏛️',
  },
  {
    value: 'modern_contemporary',
    label: 'Contemporary Chic',
    description: 'Geometric structures, metallic accents, and intelligent mood lighting',
    icon: '✨',
  },
  {
    value: 'palace_wedding',
    label: 'Palatial Splendour',
    description: 'Grand chandeliers, regal courtyards, and torchlit royal entrances',
    icon: '🏰',
  },
  {
    value: 'beach_wedding',
    label: 'Coastal / Beach Breeze',
    description: 'Driftwood arches, sheer linen drapes, and oceanfront sunset hues',
    icon: '🏖️',
  },
  {
    value: 'bohemian',
    label: 'Boho & Rustic',
    description: 'Macrame, pampas grass, warm terracotta, and earthen candle accents',
    icon: '🌾',
  },
  {
    value: 'custom',
    label: 'Bespoke Concept',
    description: 'Tailored moodboard crafted specifically to your unique love story',
    icon: '🎨',
  },
];

const DECOR_FOCUS_AREAS: Array<{ value: DecorPreference; label: string }> = [
  { value: 'mandap_design', label: 'Grand Mandap / Altar Architecture' },
  { value: 'entrance_decoration', label: 'Royal Walkway & Entrance Tunnel' },
  { value: 'floral_arrangements', label: 'Exotic Fresh Floral Styling' },
  { value: 'lighting', label: 'Concert & Architectural Ambient Lighting' },
  { value: 'stage_design', label: 'Bespoke Reception Stage' },
  { value: 'table_decoration', label: 'Banquet Centerpieces & Tablescapes' },
  { value: 'special_installations', label: 'Photo Moments & Art Installations' },
];

export default function ThemeDecorStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { theme, decorPreferences = [], customTheme } = state.selections;

  const toggleDecorPref = (pref: DecorPreference) => {
    if (decorPreferences.includes(pref)) {
      updateSelections({ decorPreferences: decorPreferences.filter((p) => p !== pref) });
    } else {
      updateSelections({ decorPreferences: [...decorPreferences, pref] });
    }
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Palette className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Theme & Visual Styling
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Define the aesthetic, colors, and decorative ambience of your dream wedding.
        </p>
      </div>

      {/* Theme Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {THEMES.map((t) => (
          <SelectionCard
            key={t.value}
            value={t.value}
            label={t.label}
            description={t.description}
            icon={<span className="text-2xl">{t.icon}</span>}
            selected={theme === t.value}
            onClick={(val) => updateSelections({ theme: val as ThemeType })}
          />
        ))}
      </div>

      {theme === 'custom' && (
        <div className="mb-8 p-5 rounded-2xl bg-soft-white border border-gold/30">
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Describe your custom theme or dream vision
          </label>
          <textarea
            rows={2}
            value={customTheme || ''}
            onChange={(e) => updateSelections({ customTheme: e.target.value })}
            placeholder="e.g., A midsummer night's dream in a Rajasthani fortress with emerald green and gold accents"
            className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      )}

      {/* Decor Focus Areas */}
      <div className="p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm mb-6">
        <h3 className="font-heading font-semibold text-maroon-deep text-base mb-4">
          Key Decoration Priorities (Select all that matter most to you)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DECOR_FOCUS_AREAS.map((item) => {
            const isSelected = decorPreferences.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleDecorPref(item.value)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-cream/70 border-gold ring-1 ring-gold shadow-xs'
                    : 'bg-ivory/60 hover:bg-cream/40 border-gold/20'
                }`}
              >
                <span className="text-xs font-medium text-charcoal">{item.label}</span>
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                    isSelected ? 'bg-maroon text-soft-white border-maroon' : 'border-gold/40 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={true}
        canGoPrev={true}
        nextLabel="Continue to Catering"
      />
    </div>
  );
}
