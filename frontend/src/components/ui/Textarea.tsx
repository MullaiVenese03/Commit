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
            className="block text-xs font-semibold text-zinc-700 mb-1.5 tracking-tight"
          >
            {label}
            {showRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-zinc-200/90 hover:border-zinc-300 focus:border-blue-600 focus:ring-blue-600/15'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-rose-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="mt-1 text-xs text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
