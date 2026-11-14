'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback, downloadTextFile } from '@/lib/clipboard';
import {
  FileDiff,
  Copy,
  Check,
  Download,
  Trash2,
  ArrowLeftRight,
  CheckCircle2,
} from 'lucide-react';
import {
  diffLines,
  diffCharacters,
  lineStats,
  segmentStats,
  areIdentical,
  toUnifiedDiff,
  type DiffOptions,
} from '@/lib/textDiff';

type ViewMode = 'lines' | 'characters';

const OPTION_LABELS: Array<{ key: keyof DiffOptions; label: string }> = [
  { key: 'ignoreCase', label: 'Ignore case' },
  { key: 'ignoreWhitespace', label: 'Ignore whitespace' },
  { key: 'trimLines', label: 'Trim line ends' },
];

const ROW_STYLES = {
  equal: 'text-neutral-600 dark:text-neutral-400',
  insert: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300',
  delete: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300',
} as const;

const ROW_MARKERS = { equal: ' ', insert: '+', delete: '-' } as const;

export default function TextDiffPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();

  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [mode, setMode] = useState<ViewMode>('lines');
  const [options, setOptions] = useState<DiffOptions>({});

  const rows = useMemo(() => diffLines(left, right, options), [left, right, options]);
  const segments = useMemo(() => diffCharacters(left, right, options), [left, right, options]);
  const stats = useMemo(
    () => (mode === 'lines' ? lineStats(rows) : segmentStats(segments)),
    [mode, rows, segments]
  );
  const identical = useMemo(() => areIdentical(left, right, options), [left, right, options]);
  const hasInput = left !== '' || right !== '';

  const toggleOption = (key: keyof DiffOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  const unified = () => toUnifiedDiff(rows, 'original', 'changed');

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={FileDiff}
          title="Text Diff"
          description="Compare two blocks of text line by line or character by character, and export a unified diff."
          badge={mode === 'lines' ? 'Line diff' : 'Character diff'}
        >
          <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <button
              onClick={() => setMode('lines')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'lines'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Lines
            </button>
            <button
              onClick={() => setMode('characters')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'characters'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Characters
            </button>
          </div>

          <button onClick={swap} disabled={!hasInput} className="btn btn-secondary btn-sm" title="Swap sides">
            <ArrowLeftRight size={13} />
          </button>
          <button
            onClick={() => {
              setLeft('');
              setRight('');
            }}
            disabled={!hasInput}
            className="btn btn-secondary btn-sm"
            title="Clear both sides"
          >
            <Trash2 size={13} />
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { label: 'Original', value: left, set: setLeft },
                { label: 'Changed', value: right, set: setRight },
              ].map((side) => (
                <div key={side.label} className="card p-0 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                      {side.label}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {side.value === '' ? 0 : side.value.split('\n').length} lines
                    </span>
                  </div>
                  <textarea
                    value={side.value}
                    onChange={(event) => side.set(event.target.value)}
                    placeholder={`Paste the ${side.label.toLowerCase()} text...`}
                    aria-label={`${side.label} text`}
                    spellCheck={false}
                    className="w-full h-56 p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
                </div>
              ))}
            </div>

            <div className="card p-3 flex flex-wrap items-center gap-2">
              {OPTION_LABELS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => toggleOption(option.key)}
                  aria-pressed={Boolean(options[option.key])}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                    options[option.key]
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-medium'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">+{stats.added}</span>
                <span className="text-rose-600 dark:text-rose-400">-{stats.removed}</span>
                <span className="text-neutral-400">
                  {stats.unchanged} unchanged {stats.unit}
                </span>
              </div>
            </div>

            {hasInput && identical && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>
                  The two sides are identical
                  {Object.values(options).some(Boolean) ? ' under the options above' : ''}.
                </span>
              </div>
            )}

            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  {mode === 'lines' ? 'Line diff' : 'Character diff'}
                </span>
                {mode === 'lines' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(unified(), 'unified')}
                      disabled={!hasInput}
                      className="btn btn-secondary btn-sm"
                    >
                      {copiedKey === 'unified' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>Copy unified</span>
                    </button>
                    <button
                      onClick={() => downloadTextFile(unified(), 'changes.diff')}
                      disabled={!hasInput}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={12} />
                      <span>.diff</span>
                    </button>
                  </div>
                )}
              </div>

              {!hasInput ? (
                <div className="p-10 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  Paste text into both sides to see the difference.
                </div>
              ) : mode === 'lines' ? (
                <div className="overflow-auto max-h-[32rem] font-mono text-xs">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 px-3 py-0.5 ${ROW_STYLES[row.op]}`}
                    >
                      <span className="w-8 text-right text-neutral-400 select-none shrink-0">
                        {row.leftNumber ?? ''}
                      </span>
                      <span className="w-8 text-right text-neutral-400 select-none shrink-0">
                        {row.rightNumber ?? ''}
                      </span>
                      <span className="w-3 select-none shrink-0">{ROW_MARKERS[row.op]}</span>
                      <span className="whitespace-pre-wrap break-all flex-1">{row.text || ' '}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-[32rem]">
                  {segments.map((segment, index) => {
                    if (segment.op === 'equal') {
                      return (
                        <span key={index} className="text-neutral-600 dark:text-neutral-400">
                          {segment.text}
                        </span>
                      );
                    }
                    if (segment.op === 'insert') {
                      return (
                        <ins
                          key={index}
                          className="bg-emerald-100 dark:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 no-underline rounded px-0.5"
                        >
                          {segment.text}
                        </ins>
                      );
                    }
                    return (
                      <del
                        key={index}
                        className="bg-rose-100 dark:bg-rose-500/25 text-rose-900 dark:text-rose-200 rounded px-0.5"
                      >
                        {segment.text}
                      </del>
                    );
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
