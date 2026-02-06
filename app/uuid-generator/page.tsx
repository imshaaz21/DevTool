'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);

  useEffect(() => {
    generateUuid();
  }, []);

  const generateUuid = () => {
    const newUuids = Array.from({ length: count }, () => crypto.randomUUID());
    setUuids(newUuids);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold">UUID Generator</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Generate random Version 4 UUIDs (Universally Unique Identifiers)
          </p>
        </div>

        <div className="p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-end gap-4 mb-8">
              <div className="flex-1 max-w-xs">
                <label htmlFor="count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="count"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                />
              </div>
              <button
                onClick={generateUuid}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                title="Generate new UUIDs"
              >
                Generate UUID{count > 1 ? 's' : ''}
              </button>
            </div>

            {uuids.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Result</h2>
                  <button
                    onClick={() => copyToClipboard(uuids.join('\n'))}
                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    title="Copy all generated UUIDs"
                  >
                    Copy All
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 font-mono text-sm border border-gray-200 dark:border-gray-700">
                  {uuids.map((uuid, i) => (
                    <div key={`${uuid}-${i}`} className="flex items-center gap-3 group py-1">
                      <span className="text-gray-800 dark:text-gray-300">{uuid}</span>
                      <button
                        onClick={() => copyToClipboard(uuid)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-indigo-600 transition-opacity"
                        title="Copy"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
