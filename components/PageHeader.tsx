'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  children
}: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0c] sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {title}
            </h1>
            {badge && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60 shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {description}
          </p>
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
