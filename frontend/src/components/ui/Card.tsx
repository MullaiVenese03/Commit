import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E4E2DE] shadow-xs transition-all duration-150 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#E4E2DE]">
          <div className="min-w-0">
            {title && typeof title === 'string' ? (
              <h3 className="font-semibold text-[#24242A] text-xs sm:text-sm tracking-tight truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-[#777782] mt-0.5 leading-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4 flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-4 sm:px-5 py-3 bg-[#F8F7F4] border-t border-[#E4E2DE] rounded-b-xl text-xs text-[#777782]">
          {footer}
        </div>
      )}
    </div>
  );
};
