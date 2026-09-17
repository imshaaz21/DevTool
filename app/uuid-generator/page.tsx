'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { AutoToggle } from '@/components/AutoToggle';
import {
  Fingerprint,
  Copy,
  RefreshCw,
  Check,
  Layers
} from 'lucide-react';

export default function UuidGenerator() {
  const { width } = useSidebar();
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const copyToClipboard = (text: string, idx?: number) => {
    navigator.clipboard.writeText(text);
    if (idx !== undefined) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Fingerprint}
          title="UUID Generator"
          description="Generate RFC 4122 Version 4 random universally unique identifiers."
          badge="RFC 4122 v4"
        >
          <AutoToggle
            enabled={autoGenerate}
            onChange={setAutoGenerate}
          />
          <button
            onClick={() => generateUuid(true)}
            className="btn btn-primary"
          >
            <RefreshCw size={13} />
            <span>Generate New</span>
          </button>
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Quantity Controls */}
            <div className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                    Quantity
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select number of UUIDs to generate at once (1 – 50)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 5, 10, 25, 50].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCount(num)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          count === num
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="h-6 w-[1px] bg-zinc-200 dark:border-zinc-800" />

                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value, 10))}
                    className="w-28 accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            </div>

            {/* Results Container */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <Layers size={13} />
                  <span>{uuids.length} Generated UUIDs</span>
                </div>
                <button
                  onClick={() => copyToClipboard(uuids.join('\n'))}
                  className="btn btn-secondary btn-sm"
                >
                  <Copy size={12} />
                  <span>Copy All</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-[540px] overflow-y-auto">
                {uuids.map((uuid, i) => (
                  <div
                    key={`${uuid}-${i}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono text-zinc-400 select-none w-5 text-right">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate select-all">
                        {uuid}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(uuid, i)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                      title="Copy UUID"
                    >
                      {copiedIndex === i ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
