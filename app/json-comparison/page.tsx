'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { compareJsonObjects } from '@/utils/jsonComparator';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false });
import { JsonDiffViewer } from '@/components/JsonDiffViewer';
import { ArrowLeft, Binary, FileCode, CheckCircle2, AlertCircle, Info, LayoutGrid } from 'lucide-react';

export default function JsonComparisonPage() {
    const { width } = useSidebar();
    const [jsonA, setJsonA] = useState<any>({
        example: "Paste or edit JSON A here",
        user: { name: "John", age: 30 }
    });
    const [jsonB, setJsonB] = useState<any>({
        example: "Paste or edit JSON B here",
        user: { name: "Jane", age: 25 }
    });

    const [comparison, setComparison] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [viewMode, setViewMode] = useState<'input' | 'comparison'>('input');
    const [selectedView, setSelectedView] = useState<'diff' | 'common' | 'values' | 'keys' | 'all'>('diff');

    useEffect(() => {
        if (viewMode === 'comparison') {
            setViewMode('input');
            setComparison(null);
            setError('');
        }
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
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main 
                className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
                style={{ marginLeft: width }}
            >
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Binary size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">JSON Comparison</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">Side-by-side object diffing</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {viewMode === 'comparison' ? (
                            <>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <ViewTab active={selectedView === 'diff'} onClick={() => setSelectedView('diff')} label="Full Diff" />
                                    <ViewTab active={selectedView === 'keys'} onClick={() => setSelectedView('keys')} label="Keys" />
                                    <ViewTab active={selectedView === 'values'} onClick={() => setSelectedView('values')} label="Values" />
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
                                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                Compare Objects
                            </button>
                        )}
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
                    {viewMode === 'input' ? (
                        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-6 flex-1 min-h-[500px]">
                                <EditorPanel title="Original (A)" json={jsonA} onChange={setJsonA} />
                                <EditorPanel title="Comparison (B)" json={jsonB} onChange={setJsonB} />
                            </div>
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox label="Total Changes" value={comparison.valueDiffs.length + comparison.keysOnlyInA.length + comparison.keysOnlyInB.length} color="text-blue-500" icon={<Binary size={16}/>} />
                                <StatBox label="Keys Only in A" value={comparison.keysOnlyInA.length} color="text-red-500" icon={<AlertCircle size={16}/>} />
                                <StatBox label="Keys Only in B" value={comparison.keysOnlyInB.length} color="text-emerald-500" icon={<Info size={16}/>} />
                                <StatBox label="Common Identical" value={comparison.commonKeysWithSameValue.length} color="text-slate-500" icon={<CheckCircle2 size={16}/>} />
                            </div>

                            {/* Diffs View */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px]">
                                {selectedView === 'diff' && (
                                    <div className="p-0">
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visual Diff Viewer</p>
                                        </div>
                                        <div className="p-6">
                                            <JsonDiffViewer jsonA={jsonA} jsonB={jsonB} />
                                        </div>
                                    </div>
                                )}

                                {selectedView === 'keys' && (
                                    <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                                        <KeyDiffList title="Keys Only in A" items={comparison.keysOnlyInA} type="removed" />
                                        <KeyDiffList title="Keys Only in B" items={comparison.keysOnlyInB} type="added" />
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

                                {selectedView === 'all' && (
                                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                                            <LayoutGrid size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Object Analysis Ready</h2>
                                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Keys in A</div>
                                                <div className="text-xl font-black">{comparison.totalKeysA}</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Keys in B</div>
                                                <div className="text-xl font-black">{comparison.totalKeysB}</div>
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

// Reuse helper components (In a real app, these would be separate component files)
function ViewTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {label}
        </button>
    );
}

function EditorPanel({ title, json, onChange }: { title: string, json: any, onChange: (j: any) => void }) {
    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden lg:h-full">
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
                {items.length === 0 && <p className="text-xs text-slate-400 italic">No matches</p>}
            </div>
        </div>
    );
}

function ValueDiffRow({ diff }: { diff: any }) {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-all" />
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 break-all">{diff.key}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ValBox label="JSON A" value={diff.valueA} color="text-red-500" />
                <ValBox label="JSON B" value={diff.valueB} color="text-emerald-500" />
            </div>
        </div>
    );
}

function ValBox({ label, value, color }: { label: string, value: any, color: string }) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
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
