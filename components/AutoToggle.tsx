import React from 'react';
import { Zap } from 'lucide-react';

interface AutoToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  activeColorClass?: string;
  activeTextClass?: string;
}

export function AutoToggle({
  enabled,
  onChange,
}: AutoToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        enabled
          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 shadow-sm'
          : 'bg-white dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
      }`}
      title={enabled ? 'Auto-processing enabled' : 'Auto-processing disabled'}
    >
      <Zap className={`w-3.5 h-3.5 transition-colors ${enabled ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
      <span>Auto</span>
      <span
        className={`w-7 h-4 rounded-full transition-colors relative inline-block shrink-0 ${
          enabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-200 ${
            enabled
              ? 'translate-x-3 bg-white dark:bg-neutral-950'
              : 'translate-x-0 bg-white dark:bg-neutral-300'
          }`}
        />
      </span>
    </button>
  );
}
