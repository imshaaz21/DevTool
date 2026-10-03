'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { compareJsonObjects, type JsonComparisonResult } from '@/utils/jsonComparator';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false, loading: () => <EditorSkeleton /> });
import { EditorSkeleton } from '@/components/EditorSkeleton';
import { ViewTab, StatBox, KeyDiffList, ValueDiffRow, EmptyState } from '@/components/JsonCompareParts';
import { JsonDiffViewer } from '@/components/JsonDiffViewer';
import {
  ArrowLeft,
  ArrowRight,
  Binary,
  FileCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  LayoutGrid
} from 'lucide-react';

export default function JsonComparisonPage() {
  const { width } = useSidebar();
  const [jsonA, setJsonA] = useState<unknown>({
    example: "Paste or edit JSON A here",
    user: { name: "John", age: 30 }
  });
  const [jsonB, setJsonB] = useState<unknown>({
    example: "Paste or edit JSON B here",
    user: { name: "Jane", age: 25 }
  });

  const [comparison, setComparison] = useState<JsonComparisonResult | null>(null);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'input' | 'comparison'>('input');
  const [selectedView, setSelectedView] = useState<'diff' | 'common' | 'values' | 'keys' | 'all'>('diff');

  // Return to the input view whenever either document changes
  useEffect(() => {
    setViewMode('input');
    setComparison(null);
    setError('');
  }, [jsonA, jsonB]);

  const handleCompare = () => {
    setError('');
    try {
      if (!jsonA || typeof jsonA !== 'object' || !jsonB || typeof jsonB !== 'object') {
        throw new Error('Both inputs must be valid JSON objects');
      }
      const result = compareJsonObjects(jsonA, jsonB);
      setComparison(result);
      setViewMode('comparison');
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Binary}
          title="JSON Comparison"
          description="Side-by-side visual diff and key/value comparison for any two JSON objects."
          badge="Deprecated"
        >
          {viewMode === 'comparison' ? (
            <div className="flex items-center gap-2">
              <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                <ViewTab active={selectedView === 'diff'} onClick={() => setSelectedView('diff')} label="Visual Diff" />
                <ViewTab active={selectedView === 'keys'} onClick={() => setSelectedView('keys')} label="Keys" />
                <ViewTab active={selectedView === 'values'} onClick={() => setSelectedView('values')} label="Values" />
                <ViewTab active={selectedView === 'all'} onClick={() => setSelectedView('all')} label="Summary" />
              </div>
              <button
                onClick={() => setViewMode('input')}
                className="btn btn-secondary btn-sm"
              >
                <ArrowLeft size={13} /> Back
              </button>
            </div>
          ) : (
            <button
              onClick={handleCompare}
              className="btn btn-primary"
            >
              Compare Objects
            </button>
          )}
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Deprecation Warning Banner */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Notice:</strong> This tool is <strong>deprecated</strong>. For accurate semantic diffing with line alignment, type checking, and key-order invariance, please use{' '}
                <Link href="/json-diff-v2" className="underline font-semibold text-amber-800 dark:text-amber-100 hover:text-amber-950 dark:hover:text-white">
                  JSON Diff v2
                </Link>
                .
              </span>
            </div>
            <Link
              href="/json-diff-v2"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-800 text-neutral-800 dark:text-neutral-200 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <span>Try JSON Diff v2</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {viewMode === 'input' || !comparison ? (
            <div className="h-full flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px]">
                <EditorPanel title="Original JSON (A)" json={jsonA} onChange={setJsonA} />
                <EditorPanel title="Comparison JSON (B)" json={jsonB} onChange={setJsonB} />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  label="Total Changes"
                  value={comparison.valueDiffs.length + comparison.keysOnlyInA.length + comparison.keysOnlyInB.length}
                  icon={<Binary size={14} className="text-neutral-500" />}
                />
                <StatBox
                  label="Keys Only in A"
                  value={comparison.keysOnlyInA.length}
                  icon={<AlertCircle size={14} className="text-rose-500" />}
                />
                <StatBox
                  label="Keys Only in B"
                  value={comparison.keysOnlyInB.length}
                  icon={<Info size={14} className="text-amber-500" />}
                />
                <StatBox
                  label="Identical Keys"
                  value={comparison.commonKeysWithSameValue.length}
                  icon={<CheckCircle2 size={14} className="text-emerald-500" />}
                />
              </div>

              {/* Diffs View */}
              <div className="card p-0 overflow-hidden min-h-[450px]">
                {selectedView === 'diff' && (
                  <div className="p-4">
                    <JsonDiffViewer jsonA={jsonA} jsonB={jsonB} />
                  </div>
                )}

                {selectedView === 'keys' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                    <KeyDiffList title="Keys Only in A" items={comparison.keysOnlyInA} type="removed" />
                    <KeyDiffList title="Keys Only in B" items={comparison.keysOnlyInB} type="added" />
                  </div>
                )}

                {selectedView === 'values' && (
                  <div className="p-4 space-y-3">
                    {comparison.valueDiffs.map((diff, i) => (
                      <ValueDiffRow key={i} diff={diff} labelA="JSON A" labelB="JSON B" />
                    ))}
                    {comparison.valueDiffs.length === 0 && <EmptyState text="No value differences found." />}
                  </div>
                )}

                {selectedView === 'all' && (
                  <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                      <LayoutGrid size={20} />
                    </div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Comparison Complete</h2>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-left">
                        <div className="text-[10px] font-mono text-neutral-400">Keys in A</div>
                        <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">{comparison.totalKeysA}</div>
                      </div>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-left">
                        <div className="text-[10px] font-mono text-neutral-400">Keys in B</div>
                        <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">{comparison.totalKeysB}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EditorPanel({ title, json, onChange }: { title: string, json: unknown, onChange: (j: unknown) => void }) {
  return (
    <div className="flex flex-col card p-0 overflow-hidden lg:h-[600px]">
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">{title}</span>
        <FileCode size={13} className="text-neutral-400" />
      </div>
      <div className="flex-1 overflow-hidden p-1">
        <JsonEditorComponent json={json} onChange={onChange} mode="code" height="100%" />
      </div>
    </div>
  );
}


