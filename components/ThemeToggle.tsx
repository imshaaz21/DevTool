'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    // Read the true live state directly from document.documentElement
    // to guarantee 100% accurate toggling on first visit/landing
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const target = isCurrentlyDark ? 'light' : 'dark';
    setTheme(target);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400 opacity-60"
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  // Determine dark mode accurately even before next-themes settles its internal state
  const isDark = resolvedTheme 
    ? resolvedTheme === 'dark'
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  return (
    <button
      aria-label="Toggle theme"
      type="button"
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
      onClick={handleToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-neutral-200" />
      ) : (
        <Moon className="w-4 h-4 text-neutral-700" />
      )}
    </button>
  );
}
