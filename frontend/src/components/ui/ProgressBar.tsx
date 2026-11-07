import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'success';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  className = '',
  variant,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  }[size];

  // Restrained professional color scale
  const getColorClass = (pct: number) => {
    if (variant === 'success' || pct >= 100) return 'bg-emerald-600';
    if (pct >= 50) return 'bg-blue-600';
    if (pct > 0) return 'bg-sky-600';
    return 'bg-zinc-300';
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-zinc-600 mb-1.5 font-medium">
          {label && <span className="truncate pr-2">{label}</span>}
          {showValue && <span className="font-semibold text-zinc-900 tabular-nums shrink-0">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-zinc-100 rounded-full overflow-hidden ${sizeClasses}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${getColorClass(
            percentage,
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
