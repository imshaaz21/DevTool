import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  options: (string | SelectOption)[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
  dropdownClassName = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = formattedOptions.find(o => o.value === value);
  const selectedLabel = selectedOption?.label || value;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full mt-1.5 bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto overflow-x-hidden ${dropdownClassName}`}
        >
          {formattedOptions.map(opt => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 font-normal'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={12} className="shrink-0 text-neutral-600 dark:text-neutral-400 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
