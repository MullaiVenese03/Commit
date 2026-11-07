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
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/90',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    accent: 'bg-blue-50 text-blue-700 border-blue-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  }[variant];

  const dotStyles = {
    neutral: 'bg-zinc-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    accent: 'bg-blue-600',
    danger: 'bg-rose-500',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles} ${sizeStyles} ${className} tracking-tight select-none`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />}
      {icon}
      <span>{children}</span>
    </span>
  );
};
