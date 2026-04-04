'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { AutoToggle } from '@/components/AutoToggle';
import { Fingerprint, Copy, RefreshCcw, Hash, Layers, CheckCircle2 } from 'lucide-react';

export default function UuidGenerator() {
  const { width } = useSidebar();
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [autoGenerate, setAutoGenerate] = useState(true);

  useEffect(() => {
    if (autoGenerate) {
      generateUuid(false);
    }
  }, [count, autoGenerate]);

  const generateUuid = (showToast = true) => {
    const newUuids = Array.from({ length: count }, () => crypto.randomUUID());
    setUuids(newUuids);
    if (showToast) {
      toast.success(`Generated ${count} UUID${count > 1 ? 's' : ''}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main 
        className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
        style={{ marginLeft: width }}
      >
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
              <Fingerprint size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">UUID Generator</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Standard Version 4 (Random) IDs.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AutoToggle enabled={autoGenerate} onChange={setAutoGenerate} activeColorClass="bg-cyan-600" activeTextClass="text-cyan-500 fill-cyan-500" />
            <button
              onClick={() => generateUuid(true)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <RefreshCcw size={16} />
                Generate New
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantity to Generate</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-2xl font-black text-cyan-600 w-12 text-center">{count}</span>
                  </div>
                </div>
                <div className="h-12 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
                <div className="hidden sm:flex flex-col items-center gap-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Version</span>
                   <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-indigo-500">V4</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Layers size={14} />
                  <span>{uuids.length} Generated UUIDs</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(uuids.join('\n'))}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-xs font-bold text-cyan-600 dark:text-cyan-400"
                >
                  <Copy size={14} />
                  Copy All
                </button>
              </div>

              <div className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uuids.map((uuid, i) => (
                    <div 
                      key={`${uuid}-${i}`} 
                      className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-cyan-500/30 transition-all animate-in fade-in zoom-in-95"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <span className="font-mono text-[13px] font-bold text-slate-600 dark:text-slate-300 break-all select-all">{uuid}</span>
                      <button
                        onClick={() => copyToClipboard(uuid)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 shadow-lg rounded-lg text-cyan-600 hover:scale-110 active:scale-90 transition-all"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-900 text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-4">
                 <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"/> RFC 4122 Standard</div>
                 <div className="flex items-center gap-2"><CheckCircle2 size={10} className="text-emerald-500"/> Crypto Safe</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
