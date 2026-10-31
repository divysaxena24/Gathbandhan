'use client';

// ============================================================
// Gathbandhan — Step 5: Destination & Venue Selection
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import SelectionCard from '@/components/consultation-ui/SelectionCard';
import { DestinationType, VenueType } from '@/types/wedding';
import { MapPin, Castle, Building2, Trees, Sparkles } from 'lucide-react';

const DESTINATION_TYPES: Array<{
  value: DestinationType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'destination',
    label: 'Destination Wedding',
    description: 'Celebrate at a majestic royal city, beach resort, or hill retreat',
    icon: '🏰',
  },
  {
    value: 'local',
    label: 'City / Hometown Wedding',
    description: 'Host comfortably in your home city with family and local networks',
    icon: '🏙️',
  },
  {
    value: 'not_decided',
    label: 'Still Exploring',
    description: 'We are open to exploring both destination and hometown options',
    icon: '🧭',
  },
];

const POPULAR_DESTINATIONS = [
  { id: 'udaipur', name: 'Udaipur', tag: 'City of Lakes & Palaces' },
  { id: 'jaipur', name: 'Jaipur', tag: 'The Regal Pink City' },
  { id: 'jodhpur', name: 'Jodhpur', tag: 'Blue City Grandeur' },
  { id: 'jaisalmer', name: 'Jaisalmer', tag: 'Golden Fort & Dunes' },
  { id: 'goa', name: 'Goa', tag: 'Sun, Sand & Coastal Luxury' },
  { id: 'kerala', name: 'Kerala', tag: 'Serene Backwaters & Hills' },
  { id: 'rishikesh', name: 'Rishikesh / Mussoorie', tag: 'Himalayan Spiritual Romance' },
  { id: 'other', name: 'Other Location', tag: 'Custom Location' },
];

const VENUE_TYPES: Array<{ value: VenueType; label: string; icon: string }> = [
  { value: 'palace', label: 'Royal Palace', icon: '👑' },
  { value: 'luxury_resort', label: 'Luxury Resort', icon: '🌴' },
  { value: 'five_star_hotel', label: '5-Star Hotel Ballroom', icon: '🏨' },
  { value: 'heritage_property', label: 'Heritage Haveli', icon: '🏛️' },
  { value: 'outdoor_lawn', label: 'Sprawling Outdoor Lawn', icon: '🌿' },
  { value: 'beachside', label: 'Beachside Venue', icon: '🏖️' },
  { value: 'banquet_hall', label: 'Premium Banquet Hall', icon: '✨' },
  { value: 'private_property', label: 'Private Estate / Villa', icon: '🏡' },
];

export default function DestinationStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const { destination, destinationCity, customCity, venueType } = state.selections;

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <MapPin className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Destination & Venue Style
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Where do you envision your wedding celebrations taking place?
        </p>
      </div>

      {/* Destination Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {DESTINATION_TYPES.map((dt) => (
          <SelectionCard
            key={dt.value}
            value={dt.value}
            label={dt.label}
            description={dt.description}
            icon={<span className="text-2xl">{dt.icon}</span>}
            selected={destination === dt.value}
            onClick={(val) => updateSelections({ destination: val as DestinationType })}
          />
        ))}
      </div>

      {/* Destination Cities (if destination or not_decided) */}
      {destination && destination !== 'local' && (
        <div className="mb-8 p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm animate-[fadeIn_0.3s_ease]">
          <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-3">
            Select Destination Region
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {POPULAR_DESTINATIONS.map((loc) => {
              const isSelected = destinationCity === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => updateSelections({ destinationCity: loc.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cream/80 border-gold shadow-sm ring-1 ring-gold'
                      : 'bg-ivory/60 hover:bg-cream/40 border-gold/20'
                  }`}
                >
                  <div className="font-heading font-medium text-sm text-maroon-deep">{loc.name}</div>
                  <div className="text-[11px] text-warm-gray truncate">{loc.tag}</div>
                </button>
              );
            })}
          </div>

          {destinationCity === 'other' && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Enter your preferred city or country
              </label>
              <input
                type="text"
                value={customCity || ''}
                onChange={(e) => updateSelections({ customCity: e.target.value })}
                placeholder="e.g., Jim Corbett, Bali, Dubai, Thailand"
                className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          )}
        </div>
      )}

      {/* Local city input (if local) */}
      {destination === 'local' && (
        <div className="mb-8 p-6 rounded-2xl bg-soft-white border border-gold/20 shadow-sm animate-[fadeIn_0.3s_ease]">
          <label className="block text-sm font-heading font-semibold text-maroon-deep mb-2">
            Which city will host your celebrations?
          </label>
          <input
            type="text"
            value={customCity || ''}
            onChange={(e) => updateSelections({ customCity: e.target.value, destinationCity: 'other' })}
            placeholder="e.g., Hyderabad, Mumbai, Delhi NCR, Bangalore, Chennai"
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      )}

      {/* Venue Types */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-3 text-center sm:text-left">
          Preferred Venue Ambience
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VENUE_TYPES.map((vt) => {
            const isSelected = venueType === vt.value;
            return (
              <button
                key={vt.value}
                type="button"
                onClick={() => updateSelections({ venueType: vt.value })}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'bg-cream/80 border-gold shadow ring-1 ring-gold text-maroon-deep font-semibold'
                    : 'bg-soft-white hover:bg-cream/30 border-gold/20 text-charcoal'
                }`}
              >
                <span className="text-2xl mb-1.5">{vt.icon}</span>
                <span className="text-xs">{vt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={!!destination}
        canGoPrev={true}
        nextLabel="Continue to Date & Duration"
      />
    </div>
  );
}
