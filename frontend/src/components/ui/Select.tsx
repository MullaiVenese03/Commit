import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, requiredIndicator, required, options, children, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const showRequired = required || requiredIndicator;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-tight"
          >
            {label}
            {showRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={`w-full rounded-md border px-3 py-1.5 text-sm text-zinc-900 bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed appearance-none cursor-pointer pr-8 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-zinc-200/90 hover:border-zinc-300 focus:border-blue-600 focus:ring-blue-600/15'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error ? (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-rose-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
