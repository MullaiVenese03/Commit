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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full bg-white rounded-xl shadow-2xl border border-[#E4E2DE] overflow-hidden transform transition-all duration-150 flex flex-col max-h-[92vh] ${sizeClasses}`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[#E4E2DE] shrink-0 bg-white">
            <div>
              {title && <h3 className="text-sm sm:text-base font-semibold text-[#24242A] tracking-tight">{title}</h3>}
              {description && <p className="text-xs text-[#777782] mt-0.5 leading-normal">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#777782] hover:text-[#24242A] rounded-full p-1.5 hover:bg-[#24242A]/5 transition cursor-pointer -mr-1"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        )}

        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 bg-[#F8F7F4] border-t border-[#E4E2DE] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
