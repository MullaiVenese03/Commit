import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full bg-white rounded-lg shadow-lg border border-zinc-200/90 overflow-hidden transform transition-all duration-150 flex flex-col max-h-[90vh] ${sizeClasses}`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
            <div>
              {title && <h3 className="text-base font-semibold text-zinc-900 tracking-tight">{title}</h3>}
              {description && <p className="text-xs text-zinc-500 mt-0.5 leading-normal">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 rounded-md p-1 hover:bg-zinc-100 transition cursor-pointer -mr-1"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
