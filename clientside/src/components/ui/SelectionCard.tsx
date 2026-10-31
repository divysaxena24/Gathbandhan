'use client';

// ============================================================
// Gathbandhan — Selection Card Component
// Premium clickable card for single or multi-select options
// ============================================================

import React from 'react';

interface SelectionCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function SelectionCard({
  value,
  label,
  description,
  icon,
  selected,
  onClick,
  size = 'md',
  disabled = false,
}: SelectionCardProps) {
  const sizeClasses = {
    sm: 'p-3 gap-1.5',
    md: 'p-5 gap-2.5',
    lg: 'p-6 gap-3',
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick(value)}
      disabled={disabled}
      className={`
        selection-card ${selected ? 'selected' : ''}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        w-full text-left
      `}
      aria-pressed={selected}
      aria-label={label}
    >
      {icon && (
        <div className={`
          flex items-center justify-center
          ${size === 'lg' ? 'w-14 h-14 text-2xl' : size === 'md' ? 'w-11 h-11 text-xl' : 'w-8 h-8 text-base'}
          rounded-full
          ${selected
            ? 'bg-gradient-to-br from-gold/20 to-gold-light/30 text-gold-dark'
            : 'bg-cream text-warm-gray'
          }
          transition-colors duration-300
        `}>
          {icon}
        </div>
      )}

      <h3 className={`
        font-heading font-semibold text-center
        ${size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-sm'}
        ${selected ? 'text-maroon-deep' : 'text-charcoal'}
        transition-colors duration-300
      `}>
        {label}
      </h3>

      {description && (
        <p className={`
          text-center leading-relaxed
          ${size === 'lg' ? 'text-sm' : 'text-xs'}
          ${selected ? 'text-warm-gray' : 'text-warm-gray-light'}
          transition-colors duration-300
        `}>
          {description}
        </p>
      )}
    </button>
  );
}
