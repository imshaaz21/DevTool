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
  activeColorClass = 'bg-indigo-600',
  activeTextClass = 'text-indigo-500 fill-indigo-500'
}: AutoToggleProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <Zap className={`w-3.5 h-3.5 ${enabled ? activeTextClass : 'text-slate-400'}`} />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Auto</span>
        <button 
            type="button"
            onClick={() => onChange(!enabled)}
            className={`w-8 h-4 rounded-full transition-colors relative ${enabled ? activeColorClass : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    </div>
  );
}
