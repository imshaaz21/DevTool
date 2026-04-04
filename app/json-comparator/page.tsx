'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { compareJsonObjects } from '@/utils/jsonComparator';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false });
import { ArrowLeft, Diff, CheckCircle2, AlertCircle, Info, LayoutGrid, FileCode } from 'lucide-react';

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
        setValidationError('Both JSONs must have "configValue.release" structure');
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main 
        className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
        style={{ marginLeft: width }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <Diff size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Feature Toggle Comparison</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">Comparing configValue.release</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'comparison' ? (
              <>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <ViewTab active={selectedView === 'keys'} onClick={() => setSelectedView('keys')} label="Key Diffs" />
                  <ViewTab active={selectedView === 'values'} onClick={() => setSelectedView('values')} label="Value Diffs" />
                  <ViewTab active={selectedView === 'common'} onClick={() => setSelectedView('common')} label="Identical" />
                  <ViewTab active={selectedView === 'all'} onClick={() => setSelectedView('all')} label="Summary" />
                </div>
                <button 
                  onClick={() => setViewMode('input')}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-105 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </>
            ) : (
              <button
                onClick={handleCompare}
                disabled={!isValidStructure}
                className="px-8 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-95"
              >
                Compare Environments
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {viewMode === 'input' ? (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-6 flex-1 min-h-[500px]">
                <EditorPanel title="Environment A (Ops)" json={jsonA} onChange={setJsonA} />
                <EditorPanel title="Environment B (Release)" json={jsonB} onChange={setJsonB} />
              </div>
              {validationError && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 text-sm font-bold">
                  <AlertCircle size={18} />
                  {validationError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-4 gap-4">
                <StatBox label="Differences" value={comparison.valueDiffs.length + comparison.keysOnlyInA.length + comparison.keysOnlyInB.length} color="text-orange-500" icon={<Diff size={16}/>} />
                <StatBox label="Key Mismatch" value={comparison.keysOnlyInA.length + comparison.keysOnlyInB.length} color="text-red-500" icon={<AlertCircle size={16}/>} />
                <StatBox label="Value Mismatch" value={comparison.valueDiffs.length} color="text-yellow-500" icon={<Info size={16}/>} />
                <StatBox label="Identical Keys" value={comparison.commonKeysWithSameValue.length} color="text-emerald-500" icon={<CheckCircle2 size={16}/>} />
              </div>

              {/* Diffs View */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                {selectedView === 'keys' && (
                  <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                    <KeyDiffList title="Missing in Release" items={comparison.keysOnlyInA} type="removed" />
                    <KeyDiffList title="New in Release (Extra)" items={comparison.keysOnlyInB} type="added" />
                  </div>
                )}

                {selectedView === 'values' && (
                  <div className="p-6 space-y-4">
                    {comparison.valueDiffs.map((diff: any, i: number) => (
                      <ValueDiffRow key={i} diff={diff} />
                    ))}
                    {comparison.valueDiffs.length === 0 && <EmptyState text="No value differences found." />}
                  </div>
                )}

                {selectedView === 'common' && (
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {comparison.commonKeysWithSameValue.map((key: string, i: number) => (
                        <div key={i} className="px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] font-mono text-emerald-600 dark:text-emerald-400 break-all flex items-center gap-2">
                          <CheckCircle2 size={10} /> {key}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedView === 'all' && (
                   <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                      <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                        <LayoutGrid size={32} />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Comparison Complete</h2>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">Use the toggle buttons in the header to drill down into specific differences between environment configurations.</p>
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
      className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {label}
    </button>
  );
}

function EditorPanel({ title, json, onChange }: { title: string, json: any, onChange: (j: any) => void }) {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden lg:h-[600px]">
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <FileCode size={14} className="text-slate-300" />
      </div>
      <div className="flex-1 overflow-hidden">
        <JsonEditorComponent json={json} onChange={onChange} mode="code" height="100%" />
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string, value: number, color: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className={color}>{icon}</div>
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function KeyDiffList({ title, items, type }: { title: string, items: string[], type: 'added' | 'removed' }) {
  return (
    <div className="p-6">
      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${type === 'added' ? 'text-emerald-500' : 'text-red-500'}`}>{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`px-3 py-2 rounded-xl font-mono text-xs break-all border transition-all ${type === 'added' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600' : 'bg-red-500/5 border-red-500/10 text-red-600'}`}>
            {type === 'added' ? '+' : '-'} {item}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic">None found</p>}
      </div>
    </div>
  );
}

function ValueDiffRow({ diff }: { diff: any }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-orange-500/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-150 transition-all" />
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 break-all">{diff.key}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ValBox label="Ops" value={diff.valueA} color="text-red-500" />
        <ValBox label="Release" value={diff.valueB} color="text-emerald-500" />
      </div>
    </div>
  );
}

function ValBox({ label, value, color }: { label: string, value: any, color: string }) {
  const valStr = typeof value === 'boolean' ? String(value) : JSON.stringify(value);
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
      <div className="text-[8px] font-black uppercase text-slate-400 mb-1">{label}</div>
      <div className={`font-mono text-xs font-bold ${color}`}>{valStr}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
      <CheckCircle2 size={24} className="text-slate-200" />
      <p className="text-sm italic">{text}</p>
    </div>
  );
}
