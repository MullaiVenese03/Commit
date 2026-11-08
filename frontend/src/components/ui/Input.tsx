import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  hideSpinners?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      requiredIndicator,
      hideSpinners = false,
      leftElement,
      rightElement,
      className = '',
      required,
      type,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const showRequired = required || requiredIndicator;
    const isNumberType = type === 'number';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#24242A] mb-1.5 tracking-tight select-none"
          >
            {label}
            {showRequired && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#777782]">
              {leftElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full rounded-lg border px-3.5 py-2 text-xs sm:text-sm text-[#24242A] placeholder:text-[#777782]/70 bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed ${
              leftElement ? 'pl-9' : ''
            } ${rightElement ? 'pr-9' : ''} ${
              isNumberType && hideSpinners ? 'hide-spinners' : ''
            } ${
              error
                ? 'border-[#C45C5C] focus:border-[#C45C5C] focus:ring-[#C45C5C]/20'
                : 'border-[#E4E2DE] hover:border-[#24242A]/30 focus:border-[#5557C8] focus:ring-[#5557C8]/20'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-[#777782]">
              {rightElement}
            </div>
          )}
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
  },
);

Input.displayName = 'Input';
