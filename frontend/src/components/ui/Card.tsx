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
      className={`bg-white rounded-lg border border-zinc-200/90 shadow-2xs transition-colors duration-150 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <div className="min-w-0">
            {title && typeof title === 'string' ? (
              <h3 className="font-semibold text-zinc-900 text-sm tracking-tight truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5 leading-normal">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-zinc-50/70 border-t border-zinc-100 rounded-b-lg text-xs text-zinc-600">
          {footer}
        </div>
      )}
    </div>
  );
};
