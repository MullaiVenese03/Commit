import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  secondaryLabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option...',
  error,
  helperText,
  requiredIndicator,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.secondaryLabel && opt.secondaryLabel.toLowerCase().includes(q))
    );
  });

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSearchTerm('');
        setHighlightedIndex(0);
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full relative" onKeyDown={handleKeyDown}>
      {label && (
        <label
          htmlFor={autoId}
          className="block text-xs font-semibold text-[#24242A] mb-1.5 tracking-tight select-none"
        >
          {label}
          {requiredIndicator && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={autoId}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs sm:text-sm bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5557C8]/20 focus:border-[#5557C8] disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed cursor-pointer text-left ${
          error
            ? 'border-[#C45C5C] focus:border-[#C45C5C] focus:ring-[#C45C5C]/20'
            : isOpen
            ? 'border-[#5557C8] ring-2 ring-[#5557C8]/20'
            : 'border-[#E4E2DE] hover:border-[#24242A]/30'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0 pr-2 pointer-events-none">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-medium text-[#24242A] truncate">{selectedOption.label}</span>
              {selectedOption.secondaryLabel && (
                <span className="text-[11px] text-[#777782] truncate">
                  ({selectedOption.secondaryLabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#777782]">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#777782] shrink-0 transition-transform duration-200 pointer-events-none ${
            isOpen ? 'rotate-180 text-[#5557C8]' : ''
          }`}
        />
      </button>

      {error ? (
        <p className="mt-1 text-xs text-[#C45C5C] font-medium tracking-tight">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#777782] leading-normal">
          {helperText}
        </p>
      ) : null}

      {/* Searchable Options Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#E4E2DE] p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-64"
          role="listbox"
        >
          {/* Search Input */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#777782] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Filter topics..."
              className="w-full text-xs rounded-lg bg-[#F8F7F4] border border-[#E4E2DE] pl-8 pr-7 py-1.5 text-[#24242A] placeholder:text-[#777782]/70 focus:outline-none focus:ring-1 focus:ring-[#5557C8] focus:border-[#5557C8]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#777782] hover:text-[#24242A] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3 pointer-events-none" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="overflow-y-auto space-y-0.5 flex-1 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#777782]">
                No matching topics found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#EEEEFC] text-[#5557C8] font-medium'
                        : isHighlighted
                        ? 'bg-[#F8F7F4] text-[#24242A]'
                        : 'text-[#24242A] hover:bg-[#F8F7F4]'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="min-w-0 pr-2 pointer-events-none">
                      <div className="font-semibold text-xs truncate">{opt.label}</div>
                      {opt.secondaryLabel && (
                        <div className="text-[10px] text-[#777782] truncate mt-0.5">
                          {opt.secondaryLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#5557C8] shrink-0 pointer-events-none" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
