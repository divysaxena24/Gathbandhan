'use client';

// ============================================================
// Gathbandhan — Step 10: Photography & Entertainment
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/ui/StepNavigation';
import { PhotographyOption, EntertainmentOption } from '@/types/wedding';
import { Camera, Music, Check, Film, Disc3, Sparkles } from 'lucide-react';

const PHOTO_OPTIONS: Array<{ value: PhotographyOption; label: string; desc: string; icon: string }> = [
  { value: 'candid', label: 'Candid Photography', desc: 'Spontaneous, artistic emotion captured unobtrusively', icon: '📸' },
  { value: 'cinematic_film', label: 'Cinematic Wedding Film', desc: '4K teaser trailers, drone establishing shots & cinematic cut', icon: '🎬' },
  { value: 'traditional', label: 'Traditional Family Portraits', desc: 'Comprehensive stage coverage with all family & guests', icon: '📷' },
  { value: 'drone', label: 'Aerial Drone Cinematography', desc: 'Breathtaking venue flyovers and procession coverage', icon: '🚁' },
  { value: 'pre_wedding_shoot', label: 'Pre-Wedding Destination Shoot', desc: 'Romantic conceptual editorial shoot before wedding', icon: '🌄' },
  { value: 'wedding_documentary', label: 'Full Feature Documentary', desc: 'In-depth interviews and complete ceremony record', icon: '🎞️' },
  { value: 'photo_booth', label: '360° Glamour / Photo Booth', desc: 'Fun guest instant prints and slow-mo video memories', icon: '🎪' },
];

const ENTERTAINMENT_OPTIONS: Array<{ value: EntertainmentOption; label: string; desc: string; icon: string }> = [
  { value: 'dj', label: 'Celebrity Club DJ & Visuals', desc: 'High octane LED wall concert party for Sangeet & Afterparty', icon: '🎧' },
  { value: 'live_band', label: 'Live Bollywood / Sufi Band', desc: 'Soulful live vocals and interactive acoustic band', icon: '🎸' },
  { value: 'folk_performances', label: 'Regional Folk Artists & Dancers', desc: 'Rajasthani Ghoomar, Punjabi Dhol Tasha, or Kathakali', icon: '🪘' },
  { value: 'traditional_music', label: 'Shehnai, Nadaswaram & Flute', desc: 'Auspicious classical morning atmosphere for rituals', icon: '🪈' },
  { value: 'dance_performances', label: 'Professional Choreography', desc: 'Family dance training, flashmobs and stage production', icon: '💃' },
  { value: 'celebrity_artist', label: 'Celebrity Singer / Performer', desc: 'Headline performance for high-profile Sangeet reception', icon: '🎤' },
  { value: 'fireworks', label: 'Cold Pyro & Fireworks Spectacular', desc: 'Safe cold-spark entry fountains and celebratory display', icon: '🎆' },
];

export default function PhotoEntertainmentStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { photography = [], entertainment = [] } = state.selections;

  const togglePhoto = (opt: PhotographyOption) => {
    if (photography.includes(opt)) {
      updateSelections({ photography: photography.filter((p) => p !== opt) });
    } else {
      updateSelections({ photography: [...photography, opt] });
    }
  };

  const toggleEnt = (opt: EntertainmentOption) => {
    if (entertainment.includes(opt)) {
      updateSelections({ entertainment: entertainment.filter((e) => e !== opt) });
    } else {
      updateSelections({ entertainment: [...entertainment, opt] });
    }
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Camera className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Photography & Entertainment
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Immortalise your celebrations and keep your guests thrilled with world-class performances.
        </p>
      </div>

      {/* Photography Section */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-3 flex items-center gap-2">
          <Film className="w-5 h-5 text-gold" />
          Photography & Cinematography Needs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PHOTO_OPTIONS.map((opt) => {
            const isSelected = photography.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePhoto(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cream/80 border-gold shadow-xs ring-1 ring-gold'
                    : 'bg-soft-white hover:bg-cream/30 border-gold/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{opt.icon}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                        isSelected ? 'bg-maroon text-soft-white border-maroon' : 'border-gold/40 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </div>
                  <h4 className="font-heading font-semibold text-sm text-maroon-deep mb-1">{opt.label}</h4>
                  <p className="text-[11px] text-warm-gray leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entertainment Section */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-3 flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-gold" />
          Entertainment & Artistes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ENTERTAINMENT_OPTIONS.map((opt) => {
            const isSelected = entertainment.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleEnt(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cream/80 border-gold shadow-xs ring-1 ring-gold'
                    : 'bg-soft-white hover:bg-cream/30 border-gold/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{opt.icon}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                        isSelected ? 'bg-maroon text-soft-white border-maroon' : 'border-gold/40 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </div>
                  <h4 className="font-heading font-semibold text-sm text-maroon-deep mb-1">{opt.label}</h4>
                  <p className="text-[11px] text-warm-gray leading-relaxed">{opt.desc}</p>
                </div>
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
        nextLabel="Continue to Accommodation & Logistics"
      />
    </div>
  );
}
