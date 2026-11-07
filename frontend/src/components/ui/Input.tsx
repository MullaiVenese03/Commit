import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, requiredIndicator, className = '', required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const showRequired = required || requiredIndicator;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-tight"
          >
            {label}
            {showRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full rounded-md border px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-zinc-200/90 hover:border-zinc-300 focus:border-blue-600 focus:ring-blue-600/15'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-rose-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
