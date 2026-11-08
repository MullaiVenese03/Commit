import React from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'text';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isIconOnly?: boolean;
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
      isIconOnly = false,
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
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#5557C8] hover:bg-[#4446B4] text-white shadow-xs border border-[#4446B4]/40 active:bg-[#3D3F9E] focus-visible:ring-[#5557C8]/40',
      secondary:
        'bg-white hover:bg-[#F8F7F4] text-[#24242A] border border-[#E4E2DE] shadow-2xs active:bg-[#ECEBE7] focus-visible:ring-[#5557C8]/25',
      tertiary:
        'bg-[#F8F7F4] hover:bg-[#ECEBE7] text-[#24242A] border border-transparent active:bg-[#E4E2DE] focus-visible:ring-[#5557C8]/25',
      destructive:
        'bg-[#C45C5C] hover:bg-[#B04B4B] text-white shadow-xs border border-[#B04B4B]/40 active:bg-[#9B3C3C] focus-visible:ring-[#C45C5C]/40',
      danger:
        'bg-[#C45C5C] hover:bg-[#B04B4B] text-white shadow-xs border border-[#B04B4B]/40 active:bg-[#9B3C3C] focus-visible:ring-[#C45C5C]/40',
      ghost:
        'text-[#777782] hover:bg-[#24242A]/5 hover:text-[#24242A] border border-transparent active:bg-[#24242A]/10 focus-visible:ring-[#5557C8]/25',
      outline:
        'border border-[#E4E2DE] bg-transparent text-[#24242A] hover:bg-white hover:border-[#D5D3CE] shadow-2xs active:bg-[#F8F7F4] focus-visible:ring-[#5557C8]/25',
      text:
        'text-[#5557C8] hover:text-[#4446B4] hover:underline p-0 h-auto border-0 bg-transparent shadow-none focus-visible:ring-0 active:scale-100',
    };

    const sizeStyles = isIconOnly
      ? {
          xs: 'w-7 h-7 p-0 rounded-md',
          sm: 'w-8.5 h-8.5 p-0 rounded-lg',
          md: 'w-9.5 h-9.5 p-0 rounded-lg',
          lg: 'w-11 h-11 p-0 rounded-lg',
        }[size]
      : {
          xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md leading-tight tracking-tight',
          sm: 'h-8.5 px-3 text-xs gap-2 rounded-lg leading-tight tracking-tight',
          md: 'h-9.5 px-4 text-xs sm:text-sm gap-2 rounded-lg leading-tight tracking-tight',
          lg: 'h-11 px-5 text-sm gap-2.5 font-medium rounded-lg leading-normal tracking-tight',
        }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${variant === 'text' ? '' : sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {!isLoading && leftIcon && <span className="shrink-0 flex items-center pointer-events-none">{leftIcon}</span>}
        {children && <span className="pointer-events-none">{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0 flex items-center pointer-events-none">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
