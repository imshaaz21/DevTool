'use client';

import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { DatabaseZap, Copy, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { computeChecksums, matchStored, EMPTY_CHECKSUM } from '@/lib/liquibaseChecksum';

const DATABASES = ['postgresql', 'oracle'];

export default function LiquibaseChecksum() {
  const { width } = useSidebar();
  const [xml, setXml] = useState('');
  const [stored, setStored] = useState('');
  const [database, setDatabase] = useState('postgresql');

  const { results, error } = useMemo(() => {
    if (!xml.trim()) return { results: [], error: '' };
    try {
      return { results: computeChecksums(xml, database), error: '' };
    } catch (e) {
      return { results: [], error: (e as Error).message };
    }
  }, [xml, database]);

  const matches = useMemo(() => matchStored(results, stored), [results, stored]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
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
          icon={DatabaseZap}
          title="Liquibase Checksum"
          description="Compute the v9 checksum of <sql> changesets and compare it with databasechangelog.md5sum."
          badge="v9"
        >
          <div className="flex items-center gap-1">
            {DATABASES.map((db) => (
              <button
                key={db}
                onClick={() => setDatabase(db)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  database === db
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-medium'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {db}
              </button>
            ))}
          </div>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-0 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  Changeset XML (one, many, or a whole changelog file)
                </div>
                <textarea
                  value={xml}
                  onChange={(e) => setXml(e.target.value)}
                  placeholder={'<changeSet id="..." author="...">\n  <sql dbms="postgresql">CREATE INDEX ...</sql>\n</changeSet>'}
                  className="h-72 w-full p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-y placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  spellCheck={false}
                />
              </div>

              <div className="card p-0 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  Stored md5sum (optional): a checksum, psql output, or databasechangelog CSV
                </div>
                <textarea
                  value={stored}
                  onChange={(e) => setStored(e.target.value)}
                  placeholder={'9:a8e825e3de21af024b922d861c863507\n\nor rows containing id + md5sum, e.g. a CSV export'}
                  className="h-72 w-full p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-y placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  spellCheck={false}
                />
              </div>
            </div>

            {error && (
              <div className="card text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle size={14} /> {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="card p-0 overflow-x-auto">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Changeset</th>
                      <th>Computed ({database})</th>
                      <th>Stored</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={`${r.id}-${i}`}>
                        <td className="font-mono text-xs">
                          <div>{r.id}</div>
                          <div className="text-neutral-400">{r.author}</div>
                          {r.unsupported.length > 0 && (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle size={12} /> Unsupported: {r.unsupported.join(', ')} (checksum not reliable)
                            </div>
                          )}
                        </td>
                        <td className="font-mono text-xs">
                          <button onClick={() => copy(r.checksum)} className="inline-flex items-center gap-1.5 hover:underline" title="Copy">
                            {r.checksum} <Copy size={12} />
                          </button>
                          {r.sqlCount === 0 && (
                            <div className="text-amber-600 dark:text-amber-400">No &lt;sql&gt; targets {database}: empty checksum</div>
                          )}
                        </td>
                        <td className="font-mono text-xs">
                          {(matches.get(r.id) ?? []).map((m, j) => (
                            <div key={j} className={`flex items-center gap-1.5 ${m.matches ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {m.matches ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {m.stored}
                              {!m.matches && m.stored === EMPTY_CHECKSUM && <span className="text-neutral-400">(blank)</span>}
                              {!m.matches && !m.stored.startsWith('9:') && <span className="text-neutral-400">(not v9)</span>}
                            </div>
                          ))}
                          {!matches.has(r.id) && <span className="text-neutral-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
