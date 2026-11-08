import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, requiredIndicator, required, className = '', rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const showRequired = required || requiredIndicator;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-[#24242A] mb-1.5 tracking-tight select-none"
          >
            {label}
            {showRequired && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm text-[#24242A] placeholder:text-[#777782]/70 bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed ${
            error
              ? 'border-[#C45C5C] focus:border-[#C45C5C] focus:ring-[#C45C5C]/20'
              : 'border-[#E4E2DE] hover:border-[#24242A]/30 focus:border-[#5557C8] focus:ring-[#5557C8]/20'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-[#C45C5C] font-medium tracking-tight">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="mt-1 text-xs text-[#777782] leading-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
