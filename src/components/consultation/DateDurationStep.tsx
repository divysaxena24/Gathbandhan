'use client';

// ============================================================
// Gathbandhan — Step 6: Date & Duration Selection
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import SelectionCard from '@/components/consultation-ui/SelectionCard';
import { WeddingDuration } from '@/types/wedding';
import { Calendar, Clock, Check } from 'lucide-react';

const DURATION_OPTIONS: Array<{
  value: WeddingDuration;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: '1_day',
    label: 'Single Day Celebration',
    description: 'All key ceremonies hosted in a focused, elegant 1-day itinerary',
    icon: '☀️',
  },
  {
    value: '2_days',
    label: '2-Day Extravaganza',
    description: 'E.g., Day 1 Mehendi & Sangeet, Day 2 Wedding & Reception',
    icon: '✨',
  },
  {
    value: '3_days',
    label: '3-Day Classic Luxury',
    description: 'The golden standard for Indian luxury destination weddings',
    icon: '👑',
  },
  {
    value: '4_5_days',
    label: '4 to 5 Days Royal Festivity',
    description: 'Comprehensive celebrations with pre-wedding and post-wedding festivities',
    icon: '🏰',
  },
  {
    value: 'not_decided',
    label: 'Flexible / To Be Decided',
    description: 'We would love the planner to propose the optimal itinerary',
    icon: '⏳',
  },
];

export default function DateDurationStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { preferredDate, dateFlexible, duration } = state.selections;

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Calendar className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Wedding Dates & Duration
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          When would you like to celebrate, and how many days of festivities are you planning?
        </p>
      </div>

      {/* Date Picker Input */}
      <div className="mb-8 p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm max-w-xl mx-auto">
        <label className="block text-sm font-heading font-semibold text-maroon-deep mb-2">
          Target Wedding Date (or estimated month)
        </label>
        <input
          type="date"
          value={preferredDate || ''}
          onChange={(e) => updateSelections({ preferredDate: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white text-charcoal mb-4"
        />

        {/* Date flexible checkbox */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!dateFlexible}
            onChange={(e) => updateSelections({ dateFlexible: e.target.checked })}
            className="w-4 h-4 text-maroon rounded border-gold/40 focus:ring-gold"
          />
          <span className="text-xs text-charcoal">
            Our dates are flexible based on auspicious Muhurat dates and venue availability
          </span>
        </label>
      </div>

      {/* Duration options */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-4 text-center">
          Planned Duration of Celebrations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DURATION_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              description={opt.description}
              icon={<span className="text-2xl">{opt.icon}</span>}
              selected={duration === opt.value}
              onClick={(val) => updateSelections({ duration: val as WeddingDuration })}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={!!duration}
        canGoPrev={true}
        nextLabel="Continue to Guest Count"
      />
    </div>
  );
}
