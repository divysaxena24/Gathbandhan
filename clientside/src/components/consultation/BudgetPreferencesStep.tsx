'use client';

// ============================================================
// Gathbandhan — Step 13: Budget & Investment Preferences
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/ui/StepNavigation';
import SelectionCard from '@/components/ui/SelectionCard';
import { BudgetRange, SpendingPriority } from '@/types/wedding';
import { IndianRupee, Sparkles, Check, ShieldCheck } from 'lucide-react';

const BUDGET_RANGES: Array<{
  value: BudgetRange;
  label: string;
  description: string;
  badge: string;
}> = [
  { value: 'below_25_lakh', label: 'Under ₹25 Lakhs', description: 'Intimate, curated hometown celebrations', badge: 'Curated' },
  { value: '25_50_lakh', label: '₹25 Lakhs – ₹50 Lakhs', description: 'Classic elegance with select premium services', badge: 'Classic' },
  { value: '50_lakh_1_crore', label: '₹50 Lakhs – ₹1 Crore', description: 'Boutique destination & upscale city luxury', badge: 'Premium' },
  { value: '1_2_crore', label: '₹1 Crore – ₹2 Crores', description: 'Grand destination wedding at top luxury resorts', badge: 'Luxury' },
  { value: '2_5_crore', label: '₹2 Crores – ₹5 Crores', description: 'Palace wedding with top artistes & couture production', badge: 'Ultra-Luxury' },
  { value: 'above_5_crore', label: '₹5 Crores+', description: 'World-class bespoke extravaganza without limits', badge: 'Royalty' },
  { value: 'not_decided', label: 'Guidance Requested', description: 'We would like Gathbandhan to calculate realistic estimates first', badge: 'Flexible' },
];

const SPENDING_PRIORITIES: Array<{ value: SpendingPriority; label: string; desc: string }> = [
  { value: 'best_experience', label: 'Guest Hospitality & Food Experience', desc: 'Prioritize extraordinary feasts, comfortable rooms, and warmth' },
  { value: 'luxury_exclusivity', label: 'Visual Grandeur & Celebrity Ambience', desc: 'Prioritize breathtaking palace decor, famous artists & couture filming' },
  { value: 'balanced', label: 'Harmonious & Balanced', desc: 'Distribute budget thoughtfully across all celebrations without overspending' },
  { value: 'budget_conscious', label: 'Smart Value Maximization', desc: 'Focus investments on high-impact rituals while optimizing peripheral costs' },
];

export default function BudgetPreferencesStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { budgetRange, spendingPriority = 'balanced' } = state.selections;

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <IndianRupee className="w-4 h-4 text-gold" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Budget Framework & Priorities
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Share your anticipated investment range. Our deterministic calculator uses real vendor catalogues to build a transparent plan.
        </p>
      </div>

      {/* Budget Ranges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
        {BUDGET_RANGES.map((br) => {
          const isSelected = budgetRange === br.value;
          return (
            <button
              key={br.value}
              type="button"
              onClick={() => updateSelections({ budgetRange: br.value })}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-cream/80 border-gold shadow-md ring-1 ring-gold'
                  : 'bg-soft-white hover:bg-cream/30 border-gold/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-dark bg-ivory px-2 py-0.5 rounded-md border border-gold/20">
                    {br.badge}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-maroon" />}
                </div>
                <h4 className="font-heading font-semibold text-base text-maroon-deep mb-1">
                  {br.label}
                </h4>
                <p className="text-xs text-warm-gray">{br.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spending Priorities */}
      <div className="p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm mb-6">
        <h3 className="font-heading font-semibold text-maroon-deep text-base mb-3">
          What is your primary investment philosophy?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPENDING_PRIORITIES.map((p) => {
            const isSelected = spendingPriority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => updateSelections({ spendingPriority: p.value })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cream/80 border-gold ring-1 ring-gold shadow-xs'
                    : 'bg-ivory/60 hover:bg-cream/40 border-gold/20'
                }`}
              >
                <div className="font-heading font-semibold text-xs text-maroon-deep mb-1">{p.label}</div>
                <div className="text-[11px] text-warm-gray">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-ivory border border-gold/20 text-xs text-warm-gray">
        <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
        <span>
          <strong>Gathbandhan Price Guarantee</strong>: All estimations are calculated mathematically using verified regional vendor price catalogues with clear line items.
        </span>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={!!budgetRange}
        canGoPrev={true}
        nextLabel="Review Wedding Plan"
      />
    </div>
  );
}
