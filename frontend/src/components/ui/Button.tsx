import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.99]';

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600 border border-blue-600 shadow-xs',
      secondary:
        'bg-zinc-100 text-zinc-800 hover:bg-zinc-200/70 active:bg-zinc-200 focus-visible:ring-zinc-400 border border-zinc-200/80',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 border border-red-600 shadow-xs',
      ghost:
        'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200/70 focus-visible:ring-zinc-400',
      outline:
        'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 focus-visible:ring-blue-600 shadow-2xs',
    }[variant];

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5 leading-normal',
      md: 'text-sm px-3.5 py-1.5 rounded-md gap-2 leading-normal',
      lg: 'text-sm px-4 py-2.5 rounded-lg gap-2.5 font-medium leading-normal',
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
