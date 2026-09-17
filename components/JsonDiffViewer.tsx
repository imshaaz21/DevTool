'use client';

import { useMemo } from 'react';

interface DiffLine {
  lineNumber: number;
  content: string;
  type: 'added' | 'removed' | 'unchanged' | 'modified';
}

interface JsonDiffViewerProps {
  jsonA: any;
  jsonB: any;
}

export function JsonDiffViewer({ jsonA, jsonB }: JsonDiffViewerProps) {
  const diffLines = useMemo(() => {
    const linesA = JSON.stringify(jsonA, null, 2).split('\n');
    const linesB = JSON.stringify(jsonB, null, 2).split('\n');

    const result: { lineA: DiffLine | null; lineB: DiffLine | null }[] = [];
    const maxLines = Math.max(linesA.length, linesB.length);

    for (let i = 0; i < maxLines; i++) {
      const contentA = i < linesA.length ? linesA[i] : '';
      const contentB = i < linesB.length ? linesB[i] : '';

      let typeA: DiffLine['type'] = 'unchanged';
      let typeB: DiffLine['type'] = 'unchanged';

      if (contentA !== contentB) {
        if (!contentA && contentB) {
          typeA = 'removed';
          typeB = 'added';
        } else if (contentA && !contentB) {
          typeA = 'removed';
          typeB = 'added';
        } else {
          typeA = 'modified';
          typeB = 'modified';
        }
      }

      result.push({
        lineA: contentA ? { lineNumber: i + 1, content: contentA, type: typeA } : null,
        lineB: contentB ? { lineNumber: i + 1, content: contentB, type: typeB } : null,
      });
    }

    return result;
  }, [jsonA, jsonB]);

  const getLineClassName = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
      case 'removed':
        return 'bg-rose-500/10 text-rose-800 dark:text-rose-300';
      case 'modified':
        return 'bg-amber-500/10 text-amber-800 dark:text-amber-300';
      default:
        return 'text-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
      {/* JSON A Side */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-3 py-1.5 font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span>Original (A)</span>
          <span className="text-[10px] text-zinc-400 font-mono">Input A</span>
        </div>
        <div className="max-h-[500px] overflow-auto divide-y divide-zinc-100 dark:divide-zinc-900/50">
          {diffLines.map((diff, idx) => (
            <div
              key={idx}
              className={`flex items-center text-xs leading-relaxed ${
                diff.lineA ? getLineClassName(diff.lineA.type) : 'bg-zinc-50/30 dark:bg-zinc-900/20'
              }`}
            >
              <span className="px-2.5 py-0.5 text-zinc-400 dark:text-zinc-600 select-none w-10 shrink-0 text-right text-[11px]">
                {diff.lineA?.lineNumber || ''}
              </span>
              <span className="px-2 py-0.5 flex-1 whitespace-pre overflow-x-auto">
                {diff.lineA?.content || '\u00A0'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* JSON B Side */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-3 py-1.5 font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span>Comparison (B)</span>
          <span className="text-[10px] text-zinc-400 font-mono">Input B</span>
        </div>
        <div className="max-h-[500px] overflow-auto divide-y divide-zinc-100 dark:divide-zinc-900/50">
          {diffLines.map((diff, idx) => (
            <div
              key={idx}
              className={`flex items-center text-xs leading-relaxed ${
                diff.lineB ? getLineClassName(diff.lineB.type) : 'bg-zinc-50/30 dark:bg-zinc-900/20'
              }`}
            >
              <span className="px-2.5 py-0.5 text-zinc-400 dark:text-zinc-600 select-none w-10 shrink-0 text-right text-[11px]">
                {diff.lineB?.lineNumber || ''}
              </span>
              <span className="px-2 py-0.5 flex-1 whitespace-pre overflow-x-auto">
                {diff.lineB?.content || '\u00A0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
