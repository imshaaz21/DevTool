import { CheckCircle2 } from 'lucide-react';
import type { ValueDiff } from '@/utils/jsonComparator';

export function ViewTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}

export function StatBox({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{value}</div>
    </div>
  );
}

export function KeyDiffList({ title, items, type }: { title: string, items: string[], type: 'added' | 'removed' }) {
  const isAdded = type === 'added';
  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isAdded ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        {title}
        <span className="text-[10px] font-mono text-neutral-400 ml-auto">({items.length})</span>
      </h3>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className={`px-2.5 py-1.5 rounded-md font-mono text-xs border ${
              isAdded
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            {isAdded ? '+' : '-'} {item}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-neutral-400 italic">No keys in this category</p>}
      </div>
    </div>
  );
}

export function ValueDiffRow({ diff, labelA, labelB }: { diff: ValueDiff, labelA: string, labelB: string }) {
  return (
    <div className="p-3 bg-neutral-50/60 dark:bg-neutral-900/40 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
      <div className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-2 truncate">
        {diff.key}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ValBox label={labelA} value={diff.valueA} variant="removed" />
        <ValBox label={labelB} value={diff.valueB} variant="added" />
      </div>
    </div>
  );
}

export function ValBox({ label, value, variant }: { label: string, value: unknown, variant: 'added' | 'removed' }) {
  const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-2 rounded-md">
      <div className="text-[10px] uppercase font-mono text-neutral-400 mb-0.5">{label}</div>
      <div className={`font-mono text-xs font-semibold ${variant === 'added' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {valStr}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-neutral-400 gap-1.5">
      <CheckCircle2 size={18} className="text-neutral-300 dark:text-neutral-600" />
      <p className="text-xs text-neutral-500">{text}</p>
    </div>
  );
}
