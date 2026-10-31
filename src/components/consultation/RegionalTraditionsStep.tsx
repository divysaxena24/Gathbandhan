'use client';

// ============================================================
// Gathbandhan — Step 2: Regional Traditions Selection
// ============================================================

import React, { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import MultiSelectChips from '@/components/consultation-ui/MultiSelectChips';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { RegionalTradition, WeddingType } from '@/types/wedding';
import { MapPin } from 'lucide-react';

// Regional tradition options based on wedding type
const TRADITIONS_BY_TYPE: Record<WeddingType, Array<{ value: string; label: string }>> = {
  hindu: [
    { value: 'north_indian', label: 'North Indian' },
    { value: 'south_indian', label: 'South Indian' },
    { value: 'rajasthani', label: 'Rajasthani' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'punjabi_hindu', label: 'Punjabi Hindu' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'other', label: 'Other' },
  ],
  sikh: [
    { value: 'punjabi_sikh', label: 'Punjabi Sikh' },
    { value: 'north_indian', label: 'North Indian' },
    { value: 'other', label: 'Other' },
  ],
  muslim: [
    { value: 'north_indian', label: 'North Indian' },
    { value: 'south_indian', label: 'South Indian' },
    { value: 'other', label: 'Other' },
  ],
  christian: [
    { value: 'kerala_christian', label: 'Kerala Christian' },
    { value: 'goan', label: 'Goan' },
    { value: 'anglo_indian', label: 'Anglo-Indian' },
    { value: 'north_indian', label: 'North Indian' },
    { value: 'other', label: 'Other' },
  ],
  jain: [
    { value: 'rajasthani', label: 'Rajasthani' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'north_indian', label: 'North Indian' },
    { value: 'other', label: 'Other' },
  ],
  interfaith: [
    { value: 'north_indian', label: 'North Indian' },
    { value: 'south_indian', label: 'South Indian' },
    { value: 'rajasthani', label: 'Rajasthani' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'punjabi_hindu', label: 'Punjabi' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'kerala_christian', label: 'Kerala' },
    { value: 'goan', label: 'Goan' },
    { value: 'other', label: 'Other' },
  ],
  custom: [
    { value: 'north_indian', label: 'North Indian' },
    { value: 'south_indian', label: 'South Indian' },
    { value: 'other', label: 'Other' },
  ],
};

export default function RegionalTraditionsStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const [customTradition, setCustomTradition] = useState(
    state.selections.customTradition || ''
  );

  const weddingType = state.selections.weddingType || 'hindu';
  const traditions = TRADITIONS_BY_TYPE[weddingType] || TRADITIONS_BY_TYPE.hindu;
  const selected = state.selections.regionalTraditions;

  const handleChange = (values: string[]) => {
    updateSelections({
      regionalTraditions: values as RegionalTradition[],
    });
  };

  const handleCustomAdd = (value: string) => {
    setCustomTradition(value);
    updateSelections({
      customTradition: value,
      regionalTraditions: [...selected, 'other' as RegionalTradition],
    });
  };

  const showCustomInput = selected.includes('other');

  return (
    <div className="step-container">
      {/* Step header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <MapPin className="w-4 h-4 text-gold" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Tell us about your family traditions
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Select the regional traditions that are important to your family.
          You can select more than one.
        </p>
      </div>

      {/* Info note */}
      <div className="info-card mb-8">
        <p className="!text-sm !text-warm-gray">
          Every family has unique customs. Select what applies to you — we&apos;ll use
          this to show you the most relevant ceremonies and traditions.
        </p>
      </div>

      {/* Tradition chips */}
      <div className="mb-6">
        <MultiSelectChips
          options={traditions}
          selected={selected}
          onChange={handleChange}
          allowCustom={!showCustomInput}
          customPlaceholder="Describe your tradition..."
          onCustomAdd={handleCustomAdd}
        />
      </div>

      {/* Custom tradition input */}
      {showCustomInput && (
        <div className="mt-4 animate-[fadeIn_0.3s_ease]">
          <label className="form-label">Describe your tradition</label>
          <input
            type="text"
            value={customTradition}
            onChange={(e) => {
              setCustomTradition(e.target.value);
              updateSelections({ customTradition: e.target.value });
            }}
            placeholder="E.g., Marwari customs with specific family rituals..."
            className="form-input"
          />
        </div>
      )}

      {/* Not sure option */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            updateSelections({
              regionalTraditions: ['other' as RegionalTradition],
              customTradition: 'Not sure yet',
            });
            nextStep();
          }}
          className="text-sm text-warm-gray hover:text-gold-dark transition-colors underline underline-offset-4"
        >
          Not sure yet — show me all ceremonies
        </button>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={selected.length > 0}
        canGoPrev={true}
      />
    </div>
  );
}
