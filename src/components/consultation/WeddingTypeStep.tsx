'use client';

// ============================================================
// Gathbandhan — Step 1: Wedding Type Selection
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import SelectionCard from '@/components/consultation-ui/SelectionCard';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { WeddingType } from '@/types/wedding';
import { Heart, Sparkles } from 'lucide-react';

const WEDDING_TYPES: Array<{
  value: WeddingType;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'hindu',
    label: 'Hindu Wedding',
    description: 'Rich rituals, vibrant ceremonies, and sacred traditions',
    emoji: '🪔',
  },
  {
    value: 'sikh',
    label: 'Sikh Wedding',
    description: 'Beautiful Anand Karaj ceremony and joyful celebrations',
    emoji: '🙏',
  },
  {
    value: 'muslim',
    label: 'Muslim Wedding',
    description: 'Sacred Nikah ceremony and graceful family traditions',
    emoji: '☪️',
  },
  {
    value: 'christian',
    label: 'Christian Wedding',
    description: 'Elegant church ceremony and reception celebration',
    emoji: '⛪',
  },
  {
    value: 'jain',
    label: 'Jain Wedding',
    description: 'Spiritual rituals and meaningful family customs',
    emoji: '🙏',
  },
  {
    value: 'interfaith',
    label: 'Interfaith Wedding',
    description: 'Blend traditions from both families beautifully',
    emoji: '💕',
  },
  {
    value: 'custom',
    label: 'Other / Custom Wedding',
    description: 'Create your own unique wedding celebration',
    emoji: '✨',
  },
];

export default function WeddingTypeStep() {
  const { state, updateSelections, nextStep } = useConsultation();
  const selected = state.selections.weddingType;

  const handleSelect = (value: string) => {
    updateSelections({ weddingType: value as WeddingType });
  };

  return (
    <div className="step-container">
      {/* Step header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Heart className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          What type of wedding are you planning?
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Select the tradition that best represents your wedding. Don&apos;t worry — you can add customs from other traditions too.
        </p>
      </div>

      {/* Selection cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WEDDING_TYPES.map((type) => (
          <SelectionCard
            key={type.value}
            value={type.value}
            label={type.label}
            description={type.description}
            icon={<span className="text-2xl">{type.emoji}</span>}
            selected={selected === type.value}
            onClick={handleSelect}
            size="md"
          />
        ))}
      </div>

      {/* Not sure hint */}
      {!selected && (
        <div className="text-center mt-6">
          <p className="text-xs text-warm-gray-light flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-light" />
            Choose the closest match — you can customise everything later
          </p>
        </div>
      )}

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        canGoNext={!!selected}
        canGoPrev={false}
        nextLabel="Continue"
      />
    </div>
  );
}
