'use client';

// ============================================================
// Gathbandhan — Step 3: Ceremony Discovery & Cultural Insight
// Displays ceremonies based on wedding type & traditions,
// with cultural significance, typical arrangements, and AI advice.
// ============================================================

import React, { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { getCeremoniesByTraditions } from '@/data/wedding-knowledge';
import { CeremonyInfo } from '@/types/wedding';
import { Sparkles, BookOpen, Clock, Users, ChevronDown, ChevronUp, Bot, CheckCircle } from 'lucide-react';

export default function CeremonyDiscoveryStep() {
  const { state, nextStep, prevStep } = useConsultation();
  const { weddingType, regionalTraditions } = state.selections;

  const ceremonies: CeremonyInfo[] = getCeremoniesByTraditions(weddingType, regionalTraditions);
  const [expandedKey, setExpandedKey] = useState<string | null>(ceremonies[0]?.key || null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

  const handleAskAI = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/wedding-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: state.consultationId,
          currentStep: 'ceremony_discovery',
          selections: state.selections,
          requestType: 'ceremony_explanation',
          userMessage: `Please explain how these traditional ceremonies flow together and offer luxury planning tips.`,
        }),
      });
      const data = await res.json();
      setAiAdvice(data.message || 'Consultation advice generated.');
    } catch {
      setAiAdvice('Our senior consultants suggest arranging these ceremonies chronologically with adequate rest buffers between high-energy celebrations.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="step-container">
      {/* Step header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <BookOpen className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Discover Traditional Ceremonies
        </h2>
        <p className="text-warm-gray max-w-xl mx-auto">
          Explore the cherished rituals associated with your wedding heritage. Each ceremony carries timeless symbolism and joyous celebration.
        </p>
      </div>

      {/* AI Consultant Banner */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-cream/70 via-ivory to-cream/70 border border-gold/30 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-maroon/10 flex items-center justify-center text-maroon">
              <Bot className="w-5 h-5 text-maroon" />
            </div>
            <div>
              <h4 className="font-medium text-maroon-deep text-sm">Gathbandhan AI Wedding Advisor</h4>
              <p className="text-xs text-warm-gray">Get personalized insights on sequencing, logistics, and significance</p>
            </div>
          </div>
          <button
            onClick={handleAskAI}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-maroon text-soft-white text-xs font-semibold hover:bg-maroon-deep transition-all shadow hover:shadow-md disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-light" />
            {loadingAi ? 'Consulting AI...' : 'Ask AI Advisor'}
          </button>
        </div>

        {aiAdvice && (
          <div className="mt-4 pt-4 border-t border-gold/20 text-xs sm:text-sm text-charcoal/90 leading-relaxed whitespace-pre-line bg-white/60 p-4 rounded-xl">
            {aiAdvice}
          </div>
        )}
      </div>

      {/* Ceremonies list */}
      <div className="space-y-4">
        {ceremonies.map((c) => {
          const isExpanded = expandedKey === c.key;
          return (
            <div
              key={c.key}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? 'bg-soft-white border-gold/60 shadow-md ring-1 ring-gold/20'
                  : 'bg-soft-white/60 hover:bg-soft-white border-gold/15'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(c.key)}
                className="w-full text-left p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold-dark font-heading font-bold text-sm">
                    ✦
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-maroon-deep">{c.name}</h3>
                    <p className="text-xs text-warm-gray line-clamp-1">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {c.typicalDuration && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-warm-gray bg-cream/60 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-gold" />
                      {c.typicalDuration}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gold" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-gray" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-gold/10 space-y-4 text-sm animate-[fadeIn_0.2s_ease]">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark block mb-1">
                      Cultural Significance
                    </span>
                    <p className="text-charcoal/85 leading-relaxed">{c.culturalSignificance}</p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark block mb-2">
                      Key Arrangements & Services
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.typicalArrangements.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-charcoal/80 bg-ivory/80 p-2 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={true}
        canGoPrev={true}
        nextLabel="Select Your Ceremonies"
      />
    </div>
  );
}
