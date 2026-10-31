'use client';

// ============================================================
// Gathbandhan — Step Navigation Component
// Back / Continue / Skip buttons for wizard steps
// ============================================================

import React from 'react';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';

interface StepNavigationProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  isOptional?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  skipLabel?: string;
  isLoading?: boolean;
}

export default function StepNavigation({
  onNext,
  onPrev,
  onSkip,
  canGoNext = true,
  canGoPrev = true,
  isOptional = false,
  nextLabel = 'Continue',
  prevLabel = 'Back',
  skipLabel = 'Skip for Now',
  isLoading = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-cream">
      {/* Left: Back button */}
      <div>
        {onPrev && canGoPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="btn-secondary !py-2.5 !px-5 !text-sm"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            {prevLabel}
          </button>
        )}
      </div>

      {/* Right: Skip + Continue */}
      <div className="flex items-center gap-3">
        {isOptional && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1.5 text-sm font-medium text-warm-gray hover:text-gold-dark transition-colors py-2.5 px-4"
            disabled={isLoading}
          >
            {skipLabel}
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className={`
            btn-primary !py-2.5 !px-6 !text-sm
            ${(!canGoNext || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
