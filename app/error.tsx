'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCw, ArrowLeft } from 'lucide-react';

/**
 * Route level error boundary.
 *
 * Every tool is a client component doing real work (canvas, OCR, video, crypto),
 * so a throw is plausible. Without this a visitor lands on a blank framework
 * error with no route back to the other tools.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa] dark:bg-[#09090b]">
      <div className="w-full max-w-md space-y-4 p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/70 dark:border-amber-900/60">
            <TriangleAlert size={16} strokeWidth={2} />
          </div>
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            This tool hit an error
          </h1>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Nothing left your browser. Your input is still in the page behind this message, so
          retrying is usually enough. If it keeps happening, the detail below helps to report it.
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 break-all">
            digest: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <RotateCw size={13} />
            Try again
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={13} />
            All tools
          </Link>
        </div>
      </div>
    </main>
  );
}
