'use client';

import React from 'react';
import { clsx } from 'clsx';

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover = false }) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl',
        hover && 'hover:shadow-md transition-shadow',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div
      className={clsx(
        'pb-4 border-b border-gray-100 dark:border-zinc-800',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={clsx('py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={clsx(
        'pt-4 border-t border-gray-100 dark:border-zinc-800',
        className
      )}
    >
      {children}
    </div>
  );
}
