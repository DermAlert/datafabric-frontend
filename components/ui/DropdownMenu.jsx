'use client';

import React from 'react';
import { clsx } from 'clsx';
import { useClickOutside } from '@/hooks';

export function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
  className,
}) {
  const menuRef = useClickOutside(onClose, isOpen);

  return (
    <div className="relative" ref={menuRef}>
      {trigger}
      {isOpen && (
        <div
          className={clsx(
            'absolute top-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon,
  onClick,
  variant = 'default',
  disabled = false,
  href,
}) {
  const classes = clsx(
    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
    disabled && 'opacity-50 cursor-not-allowed',
    !disabled && variant === 'default' && 'hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200',
    !disabled && variant === 'danger' && 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
  );

  if (href && !disabled) {
    return (
      <a href={href} className={classes} role="menuitem">
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <hr className="my-1 border-gray-200 dark:border-zinc-700" />;
}
