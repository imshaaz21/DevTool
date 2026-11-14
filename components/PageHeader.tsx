'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LucideIcon, Star } from 'lucide-react';
import { useFavourites } from './useFavourites';
import { recordToolVisit } from '@/lib/recentTools';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'deprecated' | 'warning' | 'success';
  children?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant,
  children
}: PageHeaderProps) {
  const pathname = usePathname();
  const { isFavourite, toggle } = useFavourites();
  const canFavourite = Boolean(pathname) && pathname !== '/';

  // Every tool page renders this header, so it is the one place a visit is known.
  useEffect(() => {
    if (pathname) recordToolVisit(pathname);
  }, [pathname]);
  const favourited = canFavourite && isFavourite(pathname);

  const handleToggleFavourite = () => {
    const { favourited: nowFavourited, persisted } = toggle(pathname);
    if (!persisted) {
      toast.error('Favourites cannot be saved in this browser');
      return;
    }
    toast.success(nowFavourited ? `Pinned ${title}` : `Unpinned ${title}`);
  };

  const isDeprecated = badgeVariant === 'deprecated' || badge?.toLowerCase() === 'deprecated';
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
              <span
                className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                  isDeprecated
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/80'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {description}
          </p>
        </div>
      </div>

      {(canFavourite || children) && (
        <div className="flex items-center gap-2 shrink-0">
          {canFavourite && (
            <button
              type="button"
              onClick={handleToggleFavourite}
              aria-pressed={favourited}
              aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
              title={favourited ? 'Remove from favourites' : 'Add to favourites'}
              className="p-1.5 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 transition-colors"
            >
              <Star
                size={15}
                strokeWidth={2}
                className={favourited ? 'fill-amber-400 text-amber-500 dark:text-amber-400' : ''}
              />
            </button>
          )}
          {children}
        </div>
      )}
    </header>
  );
}
