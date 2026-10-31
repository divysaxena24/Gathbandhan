'use client';

// ============================================================
// Gathbandhan — Step 12: Additional Curated Services
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { Sparkles, Check, Gift } from 'lucide-react';

const ADDITIONAL_SERVICES = [
  { id: 'bridal_makeup', label: 'Bridal Hair & Makeup Artists', desc: 'Top celebrity makeup artists & family grooming team', icon: '💄' },
  { id: 'mehendi_artists', label: 'Bespoke Mehendi & Henna Team', desc: 'Renowned henna artists with bespoke motifs & organic cone packs', icon: '🌿' },
  { id: 'stationery_invites', label: 'Luxury Invitations & Digital Suite', desc: 'Boxed physical couture invites & interactive wedding app/website', icon: '💌' },
  { id: 'wedding_favours', label: 'Customised Gifting & Return Hampers', desc: 'Curated artisanal sweets, silver coins, and wellness gift hampers', icon: '🎁' },
  { id: 'pandit_officiant', label: 'Vedic Priests / Officiants', desc: 'Experienced multilingual pandits well-versed in rituals & English explanations', icon: '🪔' },
  { id: 'hospitality_team', label: 'Shadow Planners & Hospitality Desk', desc: 'Dedicated personal shadow for bride & groom + 24/7 helpdesk for guests', icon: '🛎️' },
  { id: 'bartending_service', label: 'Flair Bartenders & Molecular Mixology', desc: 'Themed cocktails, custom ice stamps & premium glassware', icon: '🍸' },
  { id: 'safawala_dhol', label: 'Royal Turban / Safa & Dhol Ensemble', desc: 'Traditional Safa tying for groom entourage & Nashik dhol troupe', icon: '👳' },
];

export default function AdditionalServicesStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { additionalServices = [], customRequirements = '' } = state.selections;

  const toggleService = (id: string) => {
    if (additionalServices.includes(id)) {
      updateSelections({ additionalServices: additionalServices.filter((s) => s !== id) });
    } else {
      updateSelections({ additionalServices: [...additionalServices, id] });
    }
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Gift className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Special Touches & Additional Services
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Add those thoughtful elements that elevate a wedding celebration into an unforgettable luxury experience.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {ADDITIONAL_SERVICES.map((item) => {
          const isSelected = additionalServices.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleService(item.id)}
              className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                isSelected
                  ? 'bg-cream/80 border-gold shadow-xs ring-1 ring-gold'
                  : 'bg-soft-white hover:bg-cream/30 border-gold/20'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{item.icon}</span>
                  <h4 className="font-heading font-semibold text-sm text-maroon-deep">{item.label}</h4>
                </div>
                <p className="text-[11px] text-warm-gray leading-relaxed">{item.desc}</p>
              </div>
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs flex-shrink-0 ml-2 ${
                  isSelected ? 'bg-maroon text-soft-white border-maroon' : 'border-gold/40 text-transparent'
                }`}
              >
                <Check className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom notes */}
      <div className="p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm mb-6">
        <label className="block text-sm font-heading font-semibold text-maroon-deep mb-2">
          Special Notes or Specific Wishes
        </label>
        <textarea
          rows={3}
          value={customRequirements}
          onChange={(e) => updateSelections({ customRequirements: e.target.value })}
          placeholder="Tell us about any specific traditions, surprise entries, dietary customs, or unique ideas you would love for your wedding..."
          className="w-full px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={true}
        canGoPrev={true}
        nextLabel="Continue to Budget & Priorities"
      />
    </div>
  );
}
