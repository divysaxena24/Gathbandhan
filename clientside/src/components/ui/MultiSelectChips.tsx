'use client';

// ============================================================
// Gathbandhan — Multi-Select Chips Component
// Pill-shaped toggleable chips for multi-selection
// ============================================================

import React from 'react';
import { Check, X } from 'lucide-react';

interface ChipOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MultiSelectChipsProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCustomAdd?: (value: string) => void;
}

export default function MultiSelectChips({
  options,
  selected,
  onChange,
  maxSelections,
  allowCustom = false,
  customPlaceholder = 'Add custom...',
  onCustomAdd,
}: MultiSelectChipsProps) {
  const [customInput, setCustomInput] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  const toggleChip = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, value]);
    }
  };

  const handleCustomAdd = () => {
    const trimmed = customInput.trim();
    if (trimmed && onCustomAdd) {
      onCustomAdd(trimmed);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isDisabled = !isSelected && maxSelections ? selected.length >= maxSelections : false;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isDisabled && toggleChip(option.value)}
            disabled={isDisabled}
            className={`chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-pressed={isSelected}
          >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      })}

      {allowCustom && !showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="chip border-dashed border-warm-gray-light/50 text-warm-gray hover:border-gold hover:text-gold-dark"
        >
          <span>+ Add Custom</span>
        </button>
      )}

      {showCustomInput && (
        <div className="flex items-center gap-2 w-full mt-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            placeholder={customPlaceholder}
            className="form-input flex-1"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomAdd}
            className="btn-gold !py-2 !px-4"
            disabled={!customInput.trim()}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomInput('');
            }}
            className="p-2 text-warm-gray hover:text-maroon transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
