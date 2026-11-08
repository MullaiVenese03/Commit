import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
  dot = false,
}) => {
  const variantStyles = {
    neutral: 'bg-[#ECEBE7] text-[#24242A] border-[#E4E2DE]',
    success: 'bg-[#278568]/12 text-[#278568] border-[#278568]/25',
    warning: 'bg-[#B98237]/12 text-[#B98237] border-[#B98237]/25',
    info: 'bg-[#5557C8]/10 text-[#5557C8] border-[#5557C8]/20',
    accent: 'bg-[#EEEEFC] text-[#5557C8] border-[#5557C8]/25',
    danger: 'bg-[#C45C5C]/12 text-[#C45C5C] border-[#C45C5C]/25',
  }[variant];

  const dotStyles = {
    neutral: 'bg-[#777782]',
    success: 'bg-[#278568]',
    warning: 'bg-[#B98237]',
    info: 'bg-[#5557C8]',
    accent: 'bg-[#5557C8]',
    danger: 'bg-[#C45C5C]',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles} ${sizeStyles} ${className} tracking-tight select-none`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
