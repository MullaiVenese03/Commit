import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
  badge?: React.ReactNode;
  variant?: 'default' | 'highlight';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-zinc-100 text-zinc-700',
  className = '',
  badge,
  variant = 'default',
}) => {
  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-150 ${
        variant === 'highlight'
          ? 'bg-blue-50/40 border-blue-200/90 shadow-2xs'
          : 'bg-white border-zinc-200/90 shadow-2xs'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
              {title}
            </span>
            {badge}
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight tabular-nums truncate">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-1 font-medium leading-normal truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-md ${iconBgColor} shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
