import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa] dark:bg-[#09090b]">
      <div className="w-full max-w-md text-center space-y-4 p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113]">
        <div className="w-10 h-10 mx-auto rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center border border-neutral-200/60 dark:border-neutral-700/60">
          <FileQuestion size={18} strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            That tool does not exist
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            The page you asked for is not part of the suite. It may have been renamed or removed.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to all tools
        </Link>
      </div>
    </main>
  );
}
