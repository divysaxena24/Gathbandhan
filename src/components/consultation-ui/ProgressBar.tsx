'use client';

// ============================================================
// Gathbandhan — Progress Bar Component
// Elegant wedding-themed progress indicator
// ============================================================

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
  stepTitle?: string;
}

export default function ProgressBar({ current, total, percentage, stepTitle }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Step counter & title */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gold-dark tracking-wider uppercase">
            Step {current} of {total}
          </span>
          {stepTitle && (
            <>
              <span className="text-warm-gray-light">·</span>
              <span className="text-sm font-medium text-charcoal">{stepTitle}</span>
            </>
          )}
        </div>
        <span className="text-xs font-medium text-warm-gray">{percentage}%</span>
      </div>

      {/* Progress track */}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`
              w-1.5 h-1.5 rounded-full transition-all duration-300
              ${i < current
                ? 'bg-gold scale-100'
                : i === current
                ? 'bg-gold-light scale-125'
                : 'bg-cream'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
