import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const variantStyles = {
    info: 'bg-sky-50/70 border-sky-200/80 text-sky-950',
    success: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
    warning: 'bg-amber-50/70 border-amber-200/80 text-amber-950',
    error: 'bg-rose-50/70 border-rose-200/80 text-rose-950',
  }[variant];

  const iconStyles = {
    info: 'text-sky-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-rose-600',
  }[variant];

  const IconComponent = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  }[variant];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-lg border p-3.5 text-xs ${variantStyles} ${className}`}
    >
      <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${iconStyles}`} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5 text-xs tracking-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto -mx-1 -my-1 rounded-md p-1 inline-flex text-zinc-400 hover:text-zinc-700 hover:bg-black/5 cursor-pointer transition"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
