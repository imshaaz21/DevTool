'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { compareJsonObjects, type JsonComparisonResult } from '@/utils/jsonComparator';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false, loading: () => <EditorSkeleton /> });
import { EditorSkeleton } from '@/components/EditorSkeleton';
import { ViewTab, StatBox, KeyDiffList, ValueDiffRow, EmptyState } from '@/components/JsonCompareParts';
import {
  ArrowLeft,
  Diff,
  CheckCircle2,
  AlertCircle,
  Info,
  LayoutGrid,
  FileCode
} from 'lucide-react';

export default function JsonComparatorPage() {
  const { width } = useSidebar();
  const [jsonA, setJsonA] = useState<unknown>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: false,
        enableBetaFeatures: true,
        enableAnalytics: false
      }
    }
  });
  const [jsonB, setJsonB] = useState<unknown>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: true,
        enableBetaFeatures: false,
        enableAnalytics: false
      }
    }
  });

  const [comparison, setComparison] = useState<JsonComparisonResult | null>(null);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'input' | 'comparison'>('input');
  const [selectedView, setSelectedView] = useState<'common' | 'values' | 'keys' | 'all'>('keys');

  const hasConfigValueRelease = (json: unknown): boolean => {
    if (!json || typeof json !== 'object') return false;
    const configValue = (json as Record<string, unknown>).configValue;
    return !!configValue && typeof configValue === 'object' && 'release' in configValue;
  };

  const { isValidStructure, validationError } = useMemo(() => {
    try {
      if (!jsonA || typeof jsonA !== 'object' || !jsonB || typeof jsonB !== 'object') {
        return { isValidStructure: false, validationError: '' };
      }
      const valid = hasConfigValueRelease(jsonA) && hasConfigValueRelease(jsonB);
      return {
        isValidStructure: valid,
        validationError: valid ? '' : 'Both JSON inputs must contain "configValue.release"',
      };
    } catch {
      return { isValidStructure: false, validationError: '' };
    }
  }, [jsonA, jsonB]);

  // Return to the input view whenever either document changes
  useEffect(() => {
    setViewMode('input');
    setComparison(null);
    setError('');
  }, [jsonA, jsonB]);

  const handleCompare = () => {
    setError('');
    try {
      const releaseA = (jsonA as { configValue?: { release?: unknown } }).configValue?.release;
      const releaseB = (jsonB as { configValue?: { release?: unknown } }).configValue?.release;
      const result = compareJsonObjects(releaseA, releaseB);
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
          icon={Diff}
          title="Feature Toggle Comparison"
          description="Compare configValue.release toggles between Ops and Release environments."
          badge="Release Diff"
        >
          {viewMode === 'comparison' ? (
            <div className="flex items-center gap-2">
              <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                <ViewTab active={selectedView === 'keys'} onClick={() => setSelectedView('keys')} label="Key Diffs" />
                <ViewTab active={selectedView === 'values'} onClick={() => setSelectedView('values')} label="Value Diffs" />
                <ViewTab active={selectedView === 'common'} onClick={() => setSelectedView('common')} label="Identical" />
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
              disabled={!isValidStructure}
              className="btn btn-primary"
            >
              Compare Environments
            </button>
          )}
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {viewMode === 'input' || !comparison ? (
            <div className="h-full flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px]">
                <EditorPanel title="Environment A (Ops)" json={jsonA} onChange={setJsonA} />
                <EditorPanel title="Environment B (Release)" json={jsonB} onChange={setJsonB} />
              </div>
              {validationError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  label="Total Diffs"
                  value={comparison.valueDiffs.length + comparison.keysOnlyInA.length + comparison.keysOnlyInB.length}
                  icon={<Diff size={14} className="text-neutral-500" />}
                />
                <StatBox
                  label="Key Mismatches"
                  value={comparison.keysOnlyInA.length + comparison.keysOnlyInB.length}
                  icon={<AlertCircle size={14} className="text-rose-500" />}
                />
                <StatBox
                  label="Value Mismatches"
                  value={comparison.valueDiffs.length}
                  icon={<Info size={14} className="text-amber-500" />}
                />
                <StatBox
                  label="Identical Keys"
                  value={comparison.commonKeysWithSameValue.length}
                  icon={<CheckCircle2 size={14} className="text-emerald-500" />}
                />
              </div>

              {/* Diffs View */}
              <div className="card p-0 overflow-hidden">
                {selectedView === 'keys' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                    <KeyDiffList title="Missing in Release (Only in A)" items={comparison.keysOnlyInA} type="removed" />
                    <KeyDiffList title="New in Release (Only in B)" items={comparison.keysOnlyInB} type="added" />
                  </div>
                )}

                {selectedView === 'values' && (
                  <div className="p-4 space-y-3">
                    {comparison.valueDiffs.map((diff, i) => (
                      <ValueDiffRow key={i} diff={diff} labelA="Ops" labelB="Release" />
                    ))}
                    {comparison.valueDiffs.length === 0 && <EmptyState text="No value differences found." />}
                  </div>
                )}

                {selectedView === 'common' && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {comparison.commonKeysWithSameValue.map((key: string, i: number) => (
                        <div key={i} className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedView === 'all' && (
                  <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                      <LayoutGrid size={20} />
                    </div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Comparison Ready</h2>
                    <p className="text-xs text-neutral-500 max-w-sm">Use the tabs in the header to inspect key differences or value overrides between your environments.</p>
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


