'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    violet: 'bg-violet-600 hover:bg-violet-700 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
  },
  secondary: {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
  },
  outline: {
    blue: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    amber: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    purple: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    cyan: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    violet: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    green: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
    red: 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700',
  },
  ghost: {
    blue: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    amber: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    purple: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    cyan: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    violet: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    green: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
    red: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800',
  },
  danger: {
    blue: 'bg-red-500 hover:bg-red-600 text-white',
    amber: 'bg-red-500 hover:bg-red-600 text-white',
    purple: 'bg-red-500 hover:bg-red-600 text-white',
    cyan: 'bg-red-500 hover:bg-red-600 text-white',
    violet: 'bg-red-500 hover:bg-red-600 text-white',
    green: 'bg-red-500 hover:bg-red-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
  },
};

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export function Button(props) {
  const {
    variant = 'primary',
    size = 'md',
    colorTheme = 'blue',
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props;

  const classes = clsx(
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    variantStyles[variant][colorTheme],
    sizeStyles[size],
    className
  );

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </>
  );

  if (props.as === 'link') {
    const { as, href, ...linkProps } = rest;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { as, ...buttonProps } = rest;
  return (
    <button
      className={classes}
      disabled={isLoading || buttonProps.disabled}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
