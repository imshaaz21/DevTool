'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { compareJsonObjects } from '@/utils/jsonComparator';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false });
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
  const [jsonA, setJsonA] = useState<any>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: false,
        enableBetaFeatures: true,
        enableAnalytics: false
      }
    }
  });
  const [jsonB, setJsonB] = useState<any>({
    configValue: {
      release: {
        enableNewUI: true,
        enableDarkMode: true,
        enableBetaFeatures: false,
        enableAnalytics: false
      }
    }
  });

  const [comparison, setComparison] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isValidStructure, setIsValidStructure] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'input' | 'comparison'>('input');
  const [selectedView, setSelectedView] = useState<'common' | 'values' | 'keys' | 'all'>('keys');

  useEffect(() => {
    if (viewMode === 'comparison') {
      setViewMode('input');
      setComparison(null);
      setError('');
    }
    validateStructure();
  }, [jsonA, jsonB]);

  const hasConfigValueRelease = (json: any): boolean => {
    return json && typeof json === 'object' && json.configValue && json.configValue.release;
  };

  const validateStructure = () => {
    try {
      if (!jsonA || typeof jsonA !== 'object' || !jsonB || typeof jsonB !== 'object') {
        setIsValidStructure(false);
        return;
      }
      const hasStructureA = hasConfigValueRelease(jsonA);
      const hasStructureB = hasConfigValueRelease(jsonB);

      if (!hasStructureA || !hasStructureB) {
        setValidationError('Both JSON inputs must contain "configValue.release"');
        setIsValidStructure(false);
        return;
      }

      setValidationError('');
      setIsValidStructure(true);
    } catch (err) {
      setIsValidStructure(false);
    }
  };

  const handleCompare = () => {
    setError('');
    try {
      const releaseA = jsonA.configValue.release;
      const releaseB = jsonB.configValue.release;
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
          {viewMode === 'input' ? (
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
                    {comparison.valueDiffs.map((diff: any, i: number) => (
                      <ValueDiffRow key={i} diff={diff} />
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

function ViewTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
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

function EditorPanel({ title, json, onChange }: { title: string, json: any, onChange: (j: any) => void }) {
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

function StatBox({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
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

function KeyDiffList({ title, items, type }: { title: string, items: string[], type: 'added' | 'removed' }) {
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

function ValueDiffRow({ diff }: { diff: any }) {
  return (
    <div className="p-3 bg-neutral-50/60 dark:bg-neutral-900/40 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
      <div className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-2 truncate">
        {diff.key}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ValBox label="Ops" value={diff.valueA} variant="removed" />
        <ValBox label="Release" value={diff.valueB} variant="added" />
      </div>
    </div>
  );
}

function ValBox({ label, value, variant }: { label: string, value: any, variant: 'added' | 'removed' }) {
  const valStr = typeof value === 'boolean' ? String(value) : JSON.stringify(value);
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-2 rounded-md">
      <div className="text-[10px] uppercase font-mono text-neutral-400 mb-0.5">{label}</div>
      <div className={`font-mono text-xs font-semibold ${variant === 'added' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {valStr}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-neutral-400 gap-1.5">
      <CheckCircle2 size={18} className="text-neutral-300 dark:text-neutral-600" />
      <p className="text-xs text-neutral-500">{text}</p>
    </div>
  );
}
