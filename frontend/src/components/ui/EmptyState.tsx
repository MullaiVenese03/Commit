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
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-center text-zinc-400 mb-3">
        {icon || <Inbox className="w-5 h-5 text-zinc-400" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h4>
      {description && (
        <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4 leading-normal">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
