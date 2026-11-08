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
    info: 'bg-[#EEEEFC] border-[#5557C8]/25 text-[#24242A]',
    success: 'bg-[#278568]/10 border-[#278568]/25 text-[#24242A]',
    warning: 'bg-[#B98237]/10 border-[#B98237]/25 text-[#24242A]',
    error: 'bg-[#C45C5C]/10 border-[#C45C5C]/25 text-[#24242A]',
  }[variant];

  const iconStyles = {
    info: 'text-[#5557C8]',
    success: 'text-[#278568]',
    warning: 'text-[#B98237]',
    error: 'text-[#C45C5C]',
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
        {title && <h5 className="font-semibold mb-0.5 text-xs tracking-tight text-[#24242A]">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto -mx-1 -my-1 rounded-md p-1 inline-flex text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 cursor-pointer transition"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5 pointer-events-none" />
        </button>
      )}
    </div>
  );
};
