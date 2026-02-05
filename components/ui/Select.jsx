'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '@/hooks';

const sizeStyles = {
  sm: {
    trigger: 'px-3 py-1.5 text-xs min-h-[32px]',
    option: 'px-3 py-1.5 text-xs',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    trigger: 'px-3 py-2.5 text-sm min-h-[42px]',
    option: 'px-3 py-2.5 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    trigger: 'px-4 py-3 text-base min-h-[50px]',
    option: 'px-4 py-3 text-base',
    icon: 'w-5 h-5',
  },
};

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  hint,
  required,
  disabled = false,
  size = 'md',
  className,
  leftIcon,
  badge,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useClickOutside(() => setIsOpen(false), isOpen);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(280, options.length * 44 + 8); // Approximate height
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      
      // Open upward if not enough space below but enough above
      setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen, options.length]);

  // Reset highlighted index when options change
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, options, value]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex];
      highlightedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex < options.length ? nextIndex : prev;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex >= 0 ? nextIndex : prev;
          });
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleOptionClick = (option) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
          {badge}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? selectId : undefined}
          className={clsx(
            'w-full flex items-center justify-between gap-2 rounded-lg border transition-all outline-none',
            'bg-gray-50 dark:bg-zinc-800/80',
            sizeStyles[size].trigger,
            disabled
              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-zinc-700'
              : error
              ? 'border-red-400 dark:border-red-600 focus:ring-2 focus:ring-red-500/30'
              : isOpen
              ? 'border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/20'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {leftIcon && (
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{leftIcon}</span>
            )}
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span
              className={clsx(
                'truncate',
                selectedOption
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown
            className={clsx(
              sizeStyles[size].icon,
              'text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            aria-activedescendant={
              highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined
            }
            className={clsx(
              'absolute z-50 w-full py-1 rounded-xl border',
              'bg-white dark:bg-zinc-800',
              'border-gray-200 dark:border-zinc-700',
              'shadow-lg shadow-black/10 dark:shadow-black/30',
              'max-h-[280px] overflow-auto',
              // Position based on available space
              openUpward 
                ? 'bottom-full mb-1.5 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150'
                : 'top-full mt-1.5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150'
            )}
          >
            {options.length === 0 ? (
              <div className={clsx(sizeStyles[size].option, 'text-gray-400 dark:text-gray-500')}>
                No options available
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={option.value}
                    id={`${selectId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={clsx(
                      sizeStyles[size].option,
                      'flex items-center gap-3 cursor-pointer transition-colors',
                      option.disabled && 'opacity-40 cursor-not-allowed',
                      !option.disabled && isHighlighted && 'bg-purple-50 dark:bg-purple-900/20',
                      !option.disabled &&
                        !isHighlighted &&
                        'hover:bg-gray-50 dark:hover:bg-zinc-700/50'
                    )}
                  >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div
                        className={clsx(
                          'truncate font-medium',
                          isSelected
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        className={clsx(sizeStyles[size].icon, 'text-purple-600 dark:text-purple-400 shrink-0')}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}
