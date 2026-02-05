'use client';

import React from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Zap,
  Sparkles,
  GitCommit,
} from 'lucide-react';

// ===========================================
// Status Badge
// ===========================================

const STATUS_CONFIG = {
  active: {
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
    label: 'Active',
  },
  completed: {
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
    label: 'Completed',
  },
  running: {
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Loader2,
    label: 'Running',
  },
  failed: {
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertCircle,
    label: 'Failed',
  },
  error: {
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertCircle,
    label: 'Error',
  },
  pending: {
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
    label: 'Pending',
  },
  inactive: {
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400',
    icon: Clock,
    label: 'Inactive',
  },
};

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      <Icon
        className={clsx('w-3.5 h-3.5', status === 'running' && 'animate-spin')}
      />
      {config.label}
    </span>
  );
}

// ===========================================
// Type Badge (Persistent/Virtualized)
// ===========================================

export function TypeBadge({ type, variant = 'default', className }) {
  const configs = {
    persistent: {
      bronze: {
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        icon: Sparkles,
      },
      silver: {
        color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
        icon: Sparkles,
      },
      default: {
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        icon: Sparkles,
      },
    },
    virtualized: {
      bronze: {
        color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
        icon: Zap,
      },
      silver: {
        color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
        icon: Zap,
      },
      default: {
        color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
        icon: Zap,
      },
    },
  };

  const config = configs[type][variant];
  const Icon = config.icon;
  const label = type === 'persistent' ? 'Persistent' : 'Virtualized';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
        config.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ===========================================
// Version Badge
// ===========================================

export function VersionBadge({ version, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
        className
      )}
    >
      <GitCommit className="w-3 h-3" />
      v{version}
    </span>
  );
}

// ===========================================
// Generic Badge
// ===========================================

const VARIANT_COLORS = {
  default: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        VARIANT_COLORS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ===========================================
// Layer Badge (Bronze/Silver)
// ===========================================

export function LayerBadge({ layer, className }) {
  const config =
    layer === 'bronze'
      ? {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          label: 'Bronze',
        }
      : {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-700 dark:text-purple-400',
          label: 'Silver',
        };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}
