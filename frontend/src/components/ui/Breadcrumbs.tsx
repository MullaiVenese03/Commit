import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-zinc-500 font-medium ${className}`}>
      <ol className="flex items-center space-x-1.5 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 mx-1 shrink-0 pointer-events-none" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors py-0.5 px-1 rounded-sm"
                >
                  <span className="pointer-events-none">{item.label}</span>
                </Link>
              ) : (
                <span className={isLast ? 'text-zinc-900 font-semibold truncate max-w-xs sm:max-w-md' : 'text-zinc-600'}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
