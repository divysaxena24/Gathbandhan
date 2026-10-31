'use client';

// ============================================================
// Gathbandhan — Step 4: Ceremony Selection
// Checkbox / Card selection for ceremonies, event day assignment,
// custom ceremony creation with full cultural flexibility.
// ============================================================

import React, { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { getCeremoniesByTraditions } from '@/data/wedding-knowledge';
import { CeremonySelection, CustomCeremony } from '@/types/wedding';
import { Check, Plus, Trash2, Calendar, Sparkles } from 'lucide-react';

export default function CeremonySelectionStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { weddingType, regionalTraditions, selectedCeremonies = [], customCeremonies = [] } = state.selections;

  const availableCeremonies = getCeremoniesByTraditions(weddingType, regionalTraditions);

  // New custom ceremony input state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customDay, setCustomDay] = useState(1);

  const isSelected = (key: string) => {
    return selectedCeremonies.some((c) => c.ceremonyKey === key);
  };

  const toggleCeremony = (ceremonyKey: string, ceremonyName: string) => {
    if (isSelected(ceremonyKey)) {
      const updated = selectedCeremonies.filter((c) => c.ceremonyKey !== ceremonyKey);
      updateSelections({ selectedCeremonies: updated });
    } else {
      const newSelection: CeremonySelection = {
        ceremonyKey,
        ceremonyName,
        isCustom: false,
        eventDay: 1,
      };
      updateSelections({ selectedCeremonies: [...selectedCeremonies, newSelection] });
    }
  };

  const handleDayChange = (ceremonyKey: string, day: number) => {
    const updated = selectedCeremonies.map((c) =>
      c.ceremonyKey === ceremonyKey ? { ...c, eventDay: day } : c
    );
    updateSelections({ selectedCeremonies: updated });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newCustom: CustomCeremony = {
      name: customName.trim(),
      description: customDesc.trim(),
      isCustom: true,
      eventDay: customDay,
    };

    updateSelections({ customCeremonies: [...customCeremonies, newCustom] });
    setCustomName('');
    setCustomDesc('');
    setShowCustomModal(false);
  };

  const removeCustom = (index: number) => {
    const updated = customCeremonies.filter((_, idx) => idx !== index);
    updateSelections({ customCeremonies: updated });
  };

  const totalSelected = selectedCeremonies.length + customCeremonies.length;

  return (
    <div className="step-container">
      {/* Step header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Calendar className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Select Your Wedding Ceremonies
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Choose the ceremonies you want to celebrate. You can assign each ceremony to a specific day of your wedding itinerary.
        </p>
      </div>

      {/* Ceremonies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {availableCeremonies.map((c) => {
          const selected = isSelected(c.key);
          const currentCeremony = selectedCeremonies.find((sc) => sc.ceremonyKey === c.key);

          return (
            <div
              key={c.key}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                selected
                  ? 'bg-soft-white border-gold shadow-md ring-2 ring-gold/30'
                  : 'bg-soft-white/60 hover:bg-soft-white border-gold/20'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCeremony(c.key, c.name)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                        selected
                          ? 'bg-maroon text-soft-white border-maroon'
                          : 'bg-cream/40 border-gold/40 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <h3 className="font-heading font-semibold text-lg text-maroon-deep">{c.name}</h3>
                  </div>
                  {c.typicalDuration && (
                    <span className="text-[11px] text-warm-gray-light bg-cream/40 px-2 py-0.5 rounded-full">
                      {c.typicalDuration}
                    </span>
                  )}
                </div>

                <p className="text-xs text-warm-gray leading-relaxed pl-8.5 mb-3">
                  {c.description}
                </p>
              </div>

              {selected && (
                <div className="pt-3 border-t border-gold/15 flex items-center justify-between text-xs">
                  <span className="text-warm-gray">Assigned Day:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayChange(c.key, day)}
                        className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                          (currentCeremony?.eventDay || 1) === day
                            ? 'bg-gold text-maroon-deep font-bold shadow-sm'
                            : 'bg-cream/60 text-charcoal hover:bg-cream'
                        }`}
                      >
                        D{day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Ceremonies list */}
      {customCeremonies.length > 0 && (
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-dark">
            Custom Ceremonies Added
          </h4>
          {customCeremonies.map((cc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-soft-white border border-gold/30 flex items-center justify-between shadow-sm"
            >
              <div>
                <h5 className="font-heading font-semibold text-sm text-maroon-deep">{cc.name}</h5>
                {cc.description && <p className="text-xs text-warm-gray">{cc.description}</p>}
                <span className="text-[11px] text-gold-dark font-medium">Assigned to Day {cc.eventDay || 1}</span>
              </div>
              <button
                type="button"
                onClick={() => removeCustom(idx)}
                className="text-warm-gray hover:text-red-600 transition-colors p-1.5"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Ceremony button */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gold/40 text-maroon hover:bg-cream/40 transition-colors text-xs font-semibold"
        >
          <Plus className="w-4 h-4 text-gold" />
          Add Custom or Family Ceremony
        </button>
      </div>

      {/* Custom ceremony modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-soft-white rounded-2xl max-w-md w-full p-6 border border-gold/30 shadow-2xl animate-[fadeInUp_0.2s_ease-out]">
            <h3 className="font-heading font-bold text-xl text-maroon-deep mb-2">
              Add Custom Ceremony
            </h3>
            <p className="text-xs text-warm-gray mb-4">
              Add any unique family rituals, welcome cocktails, or bespoke ceremonies.
            </p>

            <form onSubmit={handleAddCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Ceremony Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sufi Musical Evening, Tilak"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details of rituals, timing or theme"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Event Day</label>
                <select
                  value={customDay}
                  onChange={(e) => setCustomDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
                >
                  <option value={1}>Day 1</option>
                  <option value={2}>Day 2</option>
                  <option value={3}>Day 3</option>
                  <option value={4}>Day 4</option>
                  <option value={5}>Day 5</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-warm-gray hover:bg-cream/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-maroon text-soft-white text-xs font-semibold hover:bg-maroon-deep transition-all shadow"
                >
                  Add Ceremony
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter summary */}
      <div className="text-center mb-6">
        <p className="text-xs text-warm-gray">
          <span className="font-bold text-maroon">{totalSelected}</span> ceremonies selected for your wedding itinerary
        </p>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={totalSelected > 0}
        canGoPrev={true}
        nextLabel="Continue to Destination"
      />
    </div>
  );
}
