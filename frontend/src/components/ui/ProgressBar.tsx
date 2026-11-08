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

  // Restrained professional macOS Warm Graphite & Muted Indigo palette
  const getColorClass = (pct: number) => {
    if (variant === 'success' || pct >= 100) return 'bg-[#278568]';
    if (pct > 0) return 'bg-[#5557C8]';
    return 'bg-[#E4E2DE]';
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-[#777782] mb-1.5 font-medium select-none">
          {label && <span className="truncate pr-2">{label}</span>}
          {showValue && <span className="font-semibold text-[#24242A] tabular-nums shrink-0">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-[#E4E2DE]/70 rounded-full overflow-hidden ${sizeClasses}`}
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
