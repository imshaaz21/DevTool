'use client';

import { useEffect, useState } from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import { setConsent } from '@/lib/consent';
import { useConsent } from './useConsent';

/**
 * Asks once, before any analytics loads.
 *
 * Render is gated on mount as well as on the stored value: the server snapshot
 * is `unset`, so without the gate a returning visitor who already answered
 * would see the banner flash on every page load.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || consent !== 'unset') return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed bottom-4 left-4 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113] shadow-lg p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center border border-neutral-200/60 dark:border-neutral-700/60">
          <BarChart3 size={14} strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            Help improve these tools?
          </p>
          <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Anonymous usage analytics help me see which tools are worth the work. It stays off
            unless you allow it.
          </p>

          {/*
            Layered notice: the headline stays short so the banner is not alarming, and the
            specifics that consent has to be informed about sit one click away rather than
            being left out.
          */}
          <details className="group">
            <summary className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors list-none flex items-center gap-1">
              <ChevronRight
                size={11}
                className="shrink-0 transition-transform group-open:rotate-90"
              />
              What is collected
            </summary>
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Which pages you open and how you move around them, through a third party analytics
              service. That includes session replay, so it can record what is on screen. No
              account, no ads, and you can change your mind any time under Privacy in the sidebar.
            </p>
          </details>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-9">
        <button
          type="button"
          onClick={() => setConsent('granted')}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => setConsent('denied')}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
