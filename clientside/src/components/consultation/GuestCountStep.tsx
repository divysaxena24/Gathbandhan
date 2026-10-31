'use client';

// ============================================================
// Gathbandhan — Step 7: Guest Count & Attendance Breakdown
// ============================================================

import React, { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/ui/StepNavigation';
import SelectionCard from '@/components/ui/SelectionCard';
import { GuestRange } from '@/types/wedding';
import { Users, UserCheck, Baby, Plane } from 'lucide-react';

const GUEST_RANGES: Array<{
  value: GuestRange;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'below_100',
    label: 'Intimate (< 100)',
    description: 'Closest family, relatives & inner circle',
    icon: '🥂',
  },
  {
    value: '100_300',
    label: 'Classic (100 – 300)',
    description: 'Perfect for luxury destination weddings',
    icon: '✨',
  },
  {
    value: '300_500',
    label: 'Grand (300 – 500)',
    description: 'Vibrant celebration with extended friends & family',
    icon: '🎉',
  },
  {
    value: '500_800',
    label: 'Royal (500 – 800)',
    description: 'Lavish high-capacity celebration',
    icon: '👑',
  },
  {
    value: '800_1000',
    label: 'Palatial (800 – 1000)',
    description: 'Magnificent large scale Indian wedding',
    icon: '🏰',
  },
  {
    value: 'above_1000',
    label: 'Mega Celebration (> 1000)',
    description: 'Mega-scale social gathering & VIP reception',
    icon: '🌟',
  },
];

export default function GuestCountStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { totalGuests, outsideGuests, childrenCount } = state.selections;

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Users className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Expected Guest Count
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Guest count drives venue capacity, banquet planning, and overall wedding logistics.
        </p>
      </div>

      {/* Guest Ranges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {GUEST_RANGES.map((range) => (
          <SelectionCard
            key={range.value}
            value={range.value}
            label={range.label}
            description={range.description}
            icon={<span className="text-2xl">{range.icon}</span>}
            selected={totalGuests === range.value}
            onClick={(val) => updateSelections({ totalGuests: val as GuestRange })}
          />
        ))}
      </div>

      {/* Outstation & Children details */}
      <div className="p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm max-w-2xl mx-auto space-y-5 mb-6">
        <h4 className="font-heading font-semibold text-maroon-deep text-base">
          Outstation Guests & Travel Accommodations
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal mb-1.5">
              <Plane className="w-3.5 h-3.5 text-gold" />
              Out-of-Town Guests (Needing Stay)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g., 150"
              value={outsideGuests || ''}
              onChange={(e) => updateSelections({ outsideGuests: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal mb-1.5">
              <Baby className="w-3.5 h-3.5 text-gold" />
              Children Attending (&lt; 12 years)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g., 25"
              value={childrenCount || ''}
              onChange={(e) => updateSelections({ childrenCount: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={!!totalGuests}
        canGoPrev={true}
        nextLabel="Continue to Theme & Décor"
      />
    </div>
  );
}
