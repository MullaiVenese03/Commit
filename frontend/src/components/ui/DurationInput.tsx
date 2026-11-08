import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface DurationInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  disabled?: boolean;
  id?: string;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  min = 5,
  max = 480,
  step = 15,
  label = 'Duration (Minutes)',
  error,
  helperText,
  requiredIndicator,
  disabled = false,
  id,
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'duration-input');

  const handleStepDown = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleStepUp = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      onChange(0);
    }
  };

  // Preset quick chips
  const presets = [15, 30, 45, 60, 90, 120].filter((p) => p >= min && p <= max);

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5 select-none">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#24242A] tracking-tight"
          >
            {label}
            {requiredIndicator && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
          </label>
          <span className="text-[11px] text-[#777782] tabular-nums">
            {min}–{max} mins allowed
          </span>
        </div>
      )}

      {/* Stepper Input Container */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleStepDown}
          disabled={disabled || value <= min}
          className="absolute left-1.5 z-10 w-7 h-7 rounded-md flex items-center justify-center text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          aria-label={`Decrease duration by ${step} minutes`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          id={inputId}
          type="number"
          value={value === 0 ? '' : value}
          onChange={handleInputChange}
          min={min}
          max={max}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`hide-spinners w-full rounded-lg border text-center px-9 py-2 text-xs sm:text-sm font-semibold tabular-nums text-[#24242A] bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed ${
            error
              ? 'border-[#C45C5C] focus:border-[#C45C5C] focus:ring-[#C45C5C]/20'
              : 'border-[#E4E2DE] hover:border-[#24242A]/30 focus:border-[#5557C8] focus:ring-[#5557C8]/20'
          }`}
        />

        <button
          type="button"
          onClick={handleStepUp}
          disabled={disabled || value >= max}
          className="absolute right-1.5 z-10 w-7 h-7 rounded-md flex items-center justify-center text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          aria-label={`Increase duration by ${step} minutes`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset duration pills */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {presets.map((mins) => (
          <button
            key={mins}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mins)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer tabular-nums select-none ${
              value === mins
                ? 'bg-[#EEEEFC] text-[#5557C8] border-[#5557C8]/30 font-semibold'
                : 'bg-[#F8F7F4] text-[#777782] border-[#E4E2DE] hover:bg-[#ECEBE7] hover:text-[#24242A]'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-[#C45C5C] font-medium tracking-tight">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-[#777782] leading-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
