import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#E4E2DE] rounded-xl bg-white/70 backdrop-blur-xs ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-[#F8F7F4] border border-[#E4E2DE] shadow-2xs flex items-center justify-center text-[#777782] mb-3">
        {icon || <Inbox className="w-5 h-5 text-[#777782]" />}
      </div>
      <h4 className="text-xs sm:text-sm font-semibold text-[#24242A] tracking-tight">{title}</h4>
      {description && (
        <p className="text-xs text-[#777782] max-w-sm mt-1 mb-4 leading-normal">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
