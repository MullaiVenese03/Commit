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
  iconBgColor = 'bg-[#F8F7F4] text-[#24242A] border border-[#E4E2DE]',
  className = '',
  badge,
  variant = 'default',
}) => {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-150 ${
        variant === 'highlight'
          ? 'bg-[#EEEEFC]/50 border-[#5557C8]/25 shadow-2xs'
          : 'bg-white border-[#E4E2DE] shadow-xs'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#777782] uppercase tracking-wider select-none">
              {title}
            </span>
            {badge}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#24242A] mt-1.5 tracking-tight tabular-nums truncate">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-[#777782] mt-1 font-medium leading-normal truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBgColor} shrink-0 flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
