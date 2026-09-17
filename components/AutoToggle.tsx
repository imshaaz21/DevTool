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
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 shadow-sm'
          : 'bg-white dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
      }`}
      title={enabled ? 'Auto-processing enabled' : 'Auto-processing disabled'}
    >
      <Zap className={`w-3.5 h-3.5 transition-colors ${enabled ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'}`} />
      <span>Auto</span>
      <span
        className={`w-7 h-4 rounded-full transition-colors relative inline-block shrink-0 ${
          enabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-200 ${
            enabled
              ? 'translate-x-3 bg-white dark:bg-zinc-900'
              : 'translate-x-0 bg-white dark:bg-zinc-300'
          }`}
        />
      </span>
    </button>
  );
}
