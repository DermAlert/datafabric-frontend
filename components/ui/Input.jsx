'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

export function Input({
  label,
  error,
  hint,
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  required,
  id,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-lg border bg-gray-50 dark:bg-zinc-800 transition-all outline-none',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-200 dark:border-zinc-700',
            sizeStyles[size],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

// Search Input especializado
export function SearchInput({ onClear, value, ...props }) {
  return (
    <Input
      leftIcon={<Search className="w-4 h-4" />}
      rightIcon={
        value && onClear ? (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            type="button"
            aria-label="Limpar busca"
          >
            ×
          </button>
        ) : undefined
      }
      value={value}
      {...props}
    />
  );
}

// Textarea
export function Textarea({
  label,
  error,
  hint,
  className,
  required,
  id,
  ...props
}) {
  const textareaId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-zinc-800 text-sm resize-none transition-all outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error
            ? 'border-red-300 dark:border-red-700'
            : 'border-gray-200 dark:border-zinc-700',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}
