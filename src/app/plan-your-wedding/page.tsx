'use client';

// ============================================================
// Gathbandhan — Plan Your Wedding Page (Wizard Shell)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { ConsultationProvider, useConsultation } from '@/hooks/useConsultation';
import ProgressBar from '@/components/consultation-ui/ProgressBar';
import WeddingTypeStep from '@/components/consultation/WeddingTypeStep';
import RegionalTraditionsStep from '@/components/consultation/RegionalTraditionsStep';
import CeremonyDiscoveryStep from '@/components/consultation/CeremonyDiscoveryStep';
import CeremonySelectionStep from '@/components/consultation/CeremonySelectionStep';
import DestinationStep from '@/components/consultation/DestinationStep';
import DateDurationStep from '@/components/consultation/DateDurationStep';
import GuestCountStep from '@/components/consultation/GuestCountStep';
import ThemeDecorStep from '@/components/consultation/ThemeDecorStep';
import CateringStep from '@/components/consultation/CateringStep';
import PhotoEntertainmentStep from '@/components/consultation/PhotoEntertainmentStep';
import AccommodationStep from '@/components/consultation/AccommodationStep';
import AdditionalServicesStep from '@/components/consultation/AdditionalServicesStep';
import BudgetPreferencesStep from '@/components/consultation/BudgetPreferencesStep';
import ReviewSummaryStep from '@/components/consultation/ReviewSummaryStep';

function WizardContent() {
  const { state, currentStep, progress, visibleSteps } = useConsultation();

  const renderStep = () => {
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'wedding_type':
        return <WeddingTypeStep />;
      case 'regional_traditions':
        return <RegionalTraditionsStep />;
      case 'ceremony_discovery':
        return <CeremonyDiscoveryStep />;
      case 'ceremony_selection':
        return <CeremonySelectionStep />;
      case 'destination':
        return <DestinationStep />;
      case 'date_duration':
        return <DateDurationStep />;
      case 'guest_count':
        return <GuestCountStep />;
      case 'theme_decor':
        return <ThemeDecorStep />;
      case 'catering':
        return <CateringStep />;
      case 'photo_entertainment':
        return <PhotoEntertainmentStep />;
      case 'accommodation':
        return <AccommodationStep />;
      case 'additional_services':
        return <AdditionalServicesStep />;
      case 'budget_preferences':
        return <BudgetPreferencesStep />;
      case 'review_summary':
        return <ReviewSummaryStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-warm-gray hover:text-maroon transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="font-heading text-base font-bold text-maroon-deep">
                Gathbandhan
              </span>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-serif italic text-maroon-deep/90 bg-gold/10 px-3 py-1 rounded-full border border-gold/25 shadow-2xs">
              <span className="text-gold text-[10px]">✦</span>
              <span>हर पल को इतना खूबसूरत बनाओ कि वो याद बन जाए।</span>
              <span className="text-gold text-[10px]">✦</span>
            </span>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/30 text-xs font-semibold text-maroon hover:bg-gold/10 transition-colors"
              >
                <span>Organizer Portal</span>
              </Link>

              {/* Step quick-nav (desktop) */}
              <div className="hidden md:flex items-center gap-1">
              {visibleSteps.slice(0, 7).map((step, i) => (
                <div
                  key={step.id}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${i < state.currentStepIndex
                      ? 'bg-gold'
                      : i === state.currentStepIndex
                      ? 'bg-maroon w-4'
                      : 'bg-cream'
                    }
                  `}
                  title={step.title}
                />
              ))}
              {visibleSteps.length > 7 && (
                <span className="text-xs text-warm-gray-light ml-1">
                  +{visibleSteps.length - 7}
                </span>
              )}
            </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <ProgressBar
              current={progress.current}
              total={progress.total}
              percentage={progress.percentage}
              stepTitle={currentStep?.title}
            />
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Error display */}
        {state.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
            {state.error}
          </div>
        )}

        {/* Current step */}
        <div key={currentStep?.id} className="animate-[fadeInUp_0.4s_ease-out]">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}

export default function PlanYourWeddingPage() {
  return (
    <ConsultationProvider>
      <WizardContent />
    </ConsultationProvider>
  );
}
