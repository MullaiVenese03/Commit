import React, {
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      requiredIndicator,
      required,
      options: optionsProp,
      children,
      className = '',
      value,
      defaultValue,
      onChange,
      disabled = false,
      placeholder = 'Select...',
      name,
      size: selectSize = 'md',
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const selectId = id || autoId;
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    // Combine forwarded ref and hiddenSelectRef
    const setSelectRef = useCallback(
      (element: HTMLSelectElement | null) => {
        hiddenSelectRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLSelectElement | null>).current = element;
        }
      },
      [ref],
    );

    // Parse options from prop or children
    const parsedOptions: SelectOption[] = React.useMemo(() => {
      if (optionsProp && optionsProp.length > 0) {
        return optionsProp;
      }

      const list: SelectOption[] = [];
      const extractLabel = (node: React.ReactNode): string => {
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractLabel).join('');
        if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
          return extractLabel((node.props as { children?: React.ReactNode }).children);
        }
        return '';
      };

      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const childProps = child.props as { value?: string | number; disabled?: boolean; children?: React.ReactNode };
          const val = childProps.value !== undefined ? String(childProps.value) : '';
          const lbl = extractLabel(childProps.children) || val;
          list.push({
            value: val,
            label: lbl,
            disabled: childProps.disabled,
          });
        }
      });

      return list;
    }, [optionsProp, children]);

    // Track controlled vs uncontrolled value
    const [internalValue, setInternalValue] = useState<string>(
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
        ? String(defaultValue)
        : parsedOptions[0]?.value || '',
    );

    const currentValue = value !== undefined ? String(value) : internalValue;

    const selectedOption = parsedOptions.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    // Click outside to dismiss
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (isOpen && listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        if (items[highlightedIndex]) {
          (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (option: SelectOption) => {
      if (option.disabled || disabled) return;

      if (value === undefined) {
        setInternalValue(option.value);
      }

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = option.value;
      }

      if (onChange) {
        const syntheticEvent = {
          target: {
            value: option.value,
            name: name || '',
            id: selectId,
          },
          currentTarget: {
            value: option.value,
            name: name || '',
            id: selectId,
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const currIdx = parsedOptions.findIndex((opt) => opt.value === currentValue);
          setHighlightedIndex(currIdx >= 0 ? currIdx : 0);
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
        case 'Tab':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < parsedOptions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : parsedOptions.length - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (parsedOptions[highlightedIndex]) {
            handleSelect(parsedOptions[highlightedIndex]);
          }
          break;
        default:
          break;
      }
    };

    const sizeStyles = {
      sm: 'py-1.5 px-3 text-xs',
      md: 'py-2 px-3.5 text-xs sm:text-sm',
      lg: 'py-2.5 px-4 text-sm',
    }[selectSize];

    const showRequired = required || requiredIndicator;

    return (
      <div className="w-full relative" ref={containerRef}>
        {label && (
          <label
            id={`${selectId}-label`}
            htmlFor={selectId}
            className="block text-xs font-semibold text-[#24242A] mb-1.5 tracking-tight select-none"
          >
            {label}
            {showRequired && <span className="text-[#C45C5C] ml-1 font-bold">*</span>}
          </label>
        )}

        {/* Hidden accessible native select to keep DOM forms & React Hook Form in sync */}
        <select
          ref={setSelectRef}
          id={selectId}
          name={name}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
          {...props}
        >
          {parsedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom macOS-styled Floating Trigger Button */}
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            onClick={() => {
              if (disabled) return;
              if (!isOpen) {
                const currIdx = parsedOptions.findIndex((opt) => opt.value === currentValue);
                setHighlightedIndex(currIdx >= 0 ? currIdx : 0);
              }
              setIsOpen((prev) => !prev);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full flex items-center justify-between gap-2 ${sizeStyles} rounded-lg border bg-white text-[#24242A] shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5557C8]/20 focus:border-[#5557C8] disabled:bg-[#ECEBE7] disabled:text-[#777782] disabled:cursor-not-allowed cursor-pointer ${
              error
                ? 'border-[#C45C5C] focus:ring-[#C45C5C]/20 focus:border-[#C45C5C]'
                : isOpen
                ? 'border-[#5557C8] ring-2 ring-[#5557C8]/20'
                : 'border-[#E4E2DE] hover:border-[#24242A]/30'
            } ${className}`}
          >
            <span className={`truncate text-left flex-1 pointer-events-none ${!selectedOption?.value && !currentValue ? 'text-[#777782]' : 'font-medium'}`}>
              {displayLabel}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#777782] shrink-0 transition-transform duration-200 pointer-events-none ${
                isOpen ? 'rotate-180 text-[#5557C8]' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Options Panel */}
          {isOpen && (
            <div
              ref={listRef}
              role="listbox"
              tabIndex={-1}
              className="absolute z-50 left-0 right-0 mt-1 min-w-[12rem] bg-white border border-[#E4E2DE] shadow-lg rounded-xl py-1 max-h-60 overflow-y-auto animate-in fade-in duration-100"
            >
              {parsedOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[#777782] text-center select-none">
                  No options available
                </div>
              ) : (
                parsedOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer select-none transition-colors ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-[#777782]'
                          : isSelected
                          ? 'bg-[#EEEEFC] text-[#5557C8] font-medium'
                          : isHighlighted
                          ? 'bg-[#F8F7F4] text-[#24242A]'
                          : 'text-[#24242A]'
                      }`}
                    >
                      <span className="truncate pointer-events-none">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5557C8] shrink-0 ml-2 pointer-events-none" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {error ? (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-[#C45C5C] font-medium tracking-tight">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-[#777782] leading-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
