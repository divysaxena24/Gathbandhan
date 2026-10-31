'use client';

// ============================================================
// Gathbandhan — Expandable Info Card
// For displaying ceremony explanations, cultural info, etc.
// ============================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ExpandableInfoCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  accentColor?: 'gold' | 'maroon';
}

export default function ExpandableInfoCard({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  icon,
  accentColor = 'gold',
}: ExpandableInfoCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const accentClasses = {
    gold: {
      border: 'border-l-gold',
      iconBg: 'bg-gold/10 text-gold-dark',
      chevron: 'text-gold',
    },
    maroon: {
      border: 'border-l-maroon',
      iconBg: 'bg-maroon/10 text-maroon',
      chevron: 'text-maroon',
    },
  };

  const accent = accentClasses[accentColor];

  return (
    <div className={`expandable-card border-l-3 ${accent.border}`}>
      <div
        className="expandable-card-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent.iconBg}`}>
            {icon || <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-heading font-semibold text-charcoal text-sm">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-warm-gray mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className={accent.chevron}>
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="expandable-card-content">
          {children}
        </div>
      )}
    </div>
  );
}
