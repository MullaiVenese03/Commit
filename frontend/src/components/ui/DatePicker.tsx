import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  maxDate?: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  disabled?: boolean;
  id?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  maxDate,
  minDate,
  label,
  error,
  helperText,
  requiredIndicator,
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view month/year from value or current date
  const parseDate = (dStr?: string) => {
    if (!dStr) return new Date();
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(() => parseDate(value));
  const [prevValue, setPrevValue] = useState(value);

  // Adjusting state during render when prop changes
  if (value !== prevValue) {
    setPrevValue(value);
    setViewDate(parseDate(value));
  }

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

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Format today in YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formatDisplay = (dStr?: string) => {
    if (!dStr) return 'Select date...';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDateDisabled = (dateKey: string) => {
    if (maxDate && dateKey > maxDate) return true;
    if (minDate && dateKey < minDate) return true;
    return false;
  };

  const selectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!isDateDisabled(formatted)) {
      onChange(formatted);
      setIsOpen(false);
    }
  };

  const selectToday = () => {
    if (!isDateDisabled(todayStr)) {
      onChange(todayStr);
      setViewDate(new Date());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#24242A] mb-1.5 tracking-tight select-none"
        >
          {label}
          {requiredIndicator && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs sm:text-sm bg-white shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5557C8]/20 focus:border-[#5557C8] disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-[#C45C5C] focus:border-[#C45C5C] focus:ring-[#C45C5C]/20'
            : isOpen
            ? 'border-[#5557C8] ring-2 ring-[#5557C8]/20'
            : 'border-[#E4E2DE] hover:border-[#24242A]/30'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={`pointer-events-none ${value ? 'text-[#24242A] font-medium' : 'text-[#777782]'}`}>
          {formatDisplay(value)}
        </span>
        <CalendarIcon className="w-4 h-4 text-[#777782] shrink-0 ml-2 pointer-events-none" />
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

      {/* Popover Calendar */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 bg-white rounded-xl shadow-xl border border-[#E4E2DE] p-3.5 w-68 sm:w-72 animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Calendar date picker"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E4E2DE]">
            <span className="text-xs font-semibold text-[#24242A] tracking-tight">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 transition cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5 pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 transition cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5 pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 transition cursor-pointer ml-1"
                aria-label="Close calendar"
              >
                <X className="w-3.5 h-3.5 pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((dow) => (
              <span key={dow} className="text-[10px] font-semibold text-[#777782] uppercase">
                {dow}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for padding */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;
              const disabledDay = isDateDisabled(dateStr);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 text-xs font-medium rounded-full flex items-center justify-center transition cursor-pointer mx-auto ${
                    isSelected
                      ? 'bg-[#5557C8] text-white font-semibold shadow-xs'
                      : isToday
                      ? 'border border-[#5557C8] text-[#5557C8] hover:bg-[#EEEEFC]'
                      : disabledDay
                      ? 'text-[#E4E2DE] cursor-not-allowed opacity-40'
                      : 'text-[#24242A] hover:bg-[#ECEBE7]'
                  }`}
                  aria-label={`${monthNames[viewMonth]} ${day}, ${viewYear}`}
                  aria-selected={isSelected}
                >
                  <span className="pointer-events-none">{day}</span>
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 pt-2.5 border-t border-[#E4E2DE] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={selectToday}
              disabled={isDateDisabled(todayStr)}
              className="text-[#5557C8] hover:text-[#4446B4] hover:underline font-medium text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!value || disabled}
              className="text-[#777782] hover:text-[#C45C5C] hover:underline font-medium text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition"
              aria-label="Clear selected date"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
