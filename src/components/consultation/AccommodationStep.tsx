'use client';

// ============================================================
// Gathbandhan — Step 11: Accommodation & Guest Logistics
// ============================================================

import React from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
import { TransportationOption } from '@/types/wedding';
import { Hotel, Car, Check, Plane, BedDouble } from 'lucide-react';

const HOTEL_CATEGORIES = [
  { id: 'heritage_luxury', label: 'Palace & Heritage Suites', desc: 'Regal royal suites for bridal party & VIPs' },
  { id: 'five_star', label: '5-Star Luxury Resort', desc: 'World-class hospitality, pool & amenities' },
  { id: 'boutique_deluxe', label: 'Boutique Hotel & Villas', desc: 'Exclusive intimate property privatized for your wedding' },
  { id: 'premium_business', label: '4-Star / Premium Hotel', desc: 'Comfortable, centrally located guest accommodations' },
];

const TRANSPORT_OPTIONS: Array<{ value: TransportationOption; label: string; desc: string; icon: string }> = [
  { value: 'airport_transfers', label: 'Airport & Railway Meet & Greet', desc: 'Dedicated fleet receiving outstation guests', icon: '✈️' },
  { value: 'local_guest_transport', label: 'Hotel-to-Venue Shuttles', desc: 'AC coaches ferrying guests seamlessly between venues', icon: '🚌' },
  { value: 'luxury_cars', label: 'Bridal & Groom Luxury Sedans', desc: 'Vintage classic car or Mercedes/BMW for couple entry', icon: '🚗' },
  { value: 'vip_transport', label: 'VIP Convoy & Family Chauffeurs', desc: 'Dedicated on-call sedans for key elders and close family', icon: '🚘' },
];

export default function AccommodationStep() {
  const { state, updateSelections, nextStep, prevStep } = useConsultation();
  const {
    needAccommodation = true,
    accommodationRooms = 40,
    accommodationNights = 2,
    accommodationCategory = 'five_star',
    transportation = ['airport_transfers', 'local_guest_transport'],
  } = state.selections;

  const toggleTransport = (opt: TransportationOption) => {
    if (transportation.includes(opt)) {
      updateSelections({ transportation: transportation.filter((t) => t !== opt) });
    } else {
      updateSelections({ transportation: [...transportation, opt] });
    }
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Hotel className="w-4 h-4 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-3">
          Accommodation & Hospitality
        </h2>
        <p className="text-warm-gray max-w-lg mx-auto">
          Ensure your guests experience royal warmth and impeccable comfort throughout their stay.
        </p>
      </div>

      {/* Accommodation toggle */}
      <div className="mb-6 p-5 rounded-2xl bg-soft-white border border-gold/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-gold" />
            <div>
              <h4 className="font-heading font-semibold text-sm text-maroon-deep">
                Guest Room Block Required?
              </h4>
              <p className="text-xs text-warm-gray">
                Reserving hotel rooms for outstation family and wedding guests
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSelections({ needAccommodation: !needAccommodation })}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              needAccommodation ? 'bg-maroon justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-soft-white shadow-md" />
          </button>
        </div>

        {needAccommodation && (
          <div className="pt-4 border-t border-gold/15 space-y-4 animate-[fadeIn_0.3s_ease]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Estimated Rooms Needed
                </label>
                <input
                  type="number"
                  min={1}
                  value={accommodationRooms || ''}
                  onChange={(e) => updateSelections({ accommodationRooms: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Number of Nights
                </label>
                <input
                  type="number"
                  min={1}
                  value={accommodationNights || ''}
                  onChange={(e) => updateSelections({ accommodationNights: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>

            {/* Room Category */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-2">
                Preferred Hotel Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HOTEL_CATEGORIES.map((cat) => {
                  const isSelected = accommodationCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateSelections({ accommodationCategory: cat.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cream/80 border-gold shadow-xs ring-1 ring-gold'
                          : 'bg-ivory/60 hover:bg-cream/40 border-gold/20'
                      }`}
                    >
                      <div className="font-heading font-medium text-xs text-maroon-deep">{cat.label}</div>
                      <div className="text-[11px] text-warm-gray">{cat.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transportation Section */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-lg text-maroon-deep mb-3 flex items-center gap-2">
          <Car className="w-5 h-5 text-gold" />
          Transportation & Logistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRANSPORT_OPTIONS.map((item) => {
            const isSelected = transportation.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleTransport(item.value)}
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
                  <p className="text-[11px] text-warm-gray">{item.desc}</p>
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
      </div>

      {/* Navigation */}
      <StepNavigation
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={true}
        canGoPrev={true}
        nextLabel="Continue to Additional Services"
      />
    </div>
  );
}
