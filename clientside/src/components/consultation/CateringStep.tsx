'use client';

// ============================================================
// Gathbandhan — Step 9: Catering & Culinary Experience
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/ui/StepNavigation';
import SelectionCard from '@/components/ui/SelectionCard';
import { CateringType } from '@/types/wedding';
import { Utensils, Check } from 'lucide-react';

const CATERING_TYPES: Array<{
  value: CateringType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'both',
    label: 'Vegetarian & Non-Vegetarian',
    description: 'Separate dedicated preparation & serving counters for both',
    icon: '🍖🥗',
  },
  {
    value: 'vegetarian',
    label: 'Pure Vegetarian',
    description: '100% vegetarian feast prepared with highest sanctity',
    icon: '🥦',
  },
  {
    value: 'non_vegetarian',
    label: 'Non-Vegetarian Specialized',
    description: 'Gourmet regional meats, seafood and coastal delicacies',
    icon: '🍗',
  },
];

const POPULAR_CUISINES = [
  'Royal Awadhi & Mughlai',
  'North Indian / Punjabi Dawat',
  'Rajasthani Royal Thali',
  'Authentic South Indian & Chettinad',
  'Gourmet Pan-Asian & Dim Sum',
  'Italian Artisanal Pastas & Woodfire',
  'Mediterranean & Mezze',
  'Street Food Chaat Galli',
  'Continental & European Grills',
  'Gujarati Kathiyawadi',
];

const DIETARY_TAGS = [
  'Strict Jain (No Root Veggies)',
  'Certified Halal Meat',
  'Vegan Friendly Dishes',
  'Gluten-Free Selections',
  'Nut Allergy Sensitive',
];

export default function CateringStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const {
    cateringType,
    cuisines = [],
    dietaryRestrictions = [],
    liveFoodCounters = true,
    dessertCounter = true,
    beverageCounter = true,
  } = state.selections;

  const toggleCuisine = (c: string) => {
    if (cuisines.includes(c)) {
      updateSelections({ cuisines: cuisines.filter((item) => item !== c) });
    } else {
      updateSelections({ cuisines: [...cuisines, c] });
    }
  };

  const toggleDiet = (d: string) => {
    if (dietaryRestrictions.includes(d)) {
      updateSelections({ dietaryRestrictions: dietaryRestrictions.filter((item) => item !== d) });
    } else {
      updateSelections({ dietaryRestrictions: [...dietaryRestrictions, d] });
    }
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Utensils className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Catering & Banqueting
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Food is the soulful centerpiece of an Indian wedding. Curate an unforgettable culinary feast.
        </p>
      </div>

      {/* Catering Diet Preference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {CATERING_TYPES.map((ct) => (
          <SelectionCard
            key={ct.value}
            value={ct.value}
            label={ct.label}
            description={ct.description}
            icon={<span className="text-2xl">{ct.icon}</span>}
            selected={cateringType === ct.value}
            onClick={(val) => updateSelections({ cateringType: val as CateringType })}
          />
        ))}
      </div>

      {/* Cuisines Grid */}
      <div className="p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm mb-6">
        <h3 className="font-heading font-semibold text-maroon-deep text-base mb-3">
          Desired Cuisine Selections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          {POPULAR_CUISINES.map((cuisine) => {
            const isSelected = cuisines.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => toggleCuisine(cuisine)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-cream/80 border-gold text-maroon-deep ring-1 ring-gold shadow-xs'
                    : 'bg-ivory/60 hover:bg-cream/40 border-gold/20 text-charcoal'
                }`}
              >
                <span>{cuisine}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Special Dietary Requirements */}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-dark mb-2">
          Special Dietary & Religious Needs
        </h4>
        <div className="flex flex-wrap gap-2 mb-6">
          {DIETARY_TAGS.map((tag) => {
            const isSelected = dietaryRestrictions.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDiet(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-maroon text-soft-white border-maroon'
                    : 'bg-ivory/80 text-charcoal border-gold/30 hover:bg-cream/50'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Experience Counters */}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-dark mb-3">
          Interactive Culinary Experiences
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gold/20 bg-ivory/50 cursor-pointer">
            <input
              type="checkbox"
              checked={liveFoodCounters}
              onChange={(e) => updateSelections({ liveFoodCounters: e.target.checked })}
              className="w-4 h-4 text-maroon rounded border-gold/40 focus:ring-gold"
            />
            <span className="text-xs font-medium text-charcoal">Live Chef Interactive Stations</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gold/20 bg-ivory/50 cursor-pointer">
            <input
              type="checkbox"
              checked={dessertCounter}
              onChange={(e) => updateSelections({ dessertCounter: e.target.checked })}
              className="w-4 h-4 text-maroon rounded border-gold/40 focus:ring-gold"
            />
            <span className="text-xs font-medium text-charcoal">Grand Mithai & Artisanal Bakery</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gold/20 bg-ivory/50 cursor-pointer">
            <input
              type="checkbox"
              checked={beverageCounter}
              onChange={(e) => updateSelections({ beverageCounter: e.target.checked })}
              className="w-4 h-4 text-maroon rounded border-gold/40 focus:ring-gold"
            />
            <span className="text-xs font-medium text-charcoal">Cocktails & Mocktail Mixology Bar</span>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={true}
        canGoPrev={true}
        nextLabel="Continue to Photography & Entertainment"
      />
    </div>
  );
}
