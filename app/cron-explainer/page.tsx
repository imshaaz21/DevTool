'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback } from '@/lib/clipboard';
import {
  Timer,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  CalendarClock,
} from 'lucide-react';
import { parseCron, nextRuns, CRON_PRESETS } from '@/lib/cronExplainer';

const FIELD_HINTS: Record<string, string> = {
  second: '0-59',
  minute: '0-59',
  hour: '0-23',
  'day of month': '1-31',
  month: '1-12 or JAN-DEC',
  'day of week': '0-6 or SUN-SAT',
};

export default function CronExplainerPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();
  const [expression, setExpression] = useState('0 9 * * MON-FRI');

  const parsed = useMemo(() => parseCron(expression), [expression]);

  // Runs are listed from a fixed instant so the list does not shuffle every second.
  const runs = useMemo(
    () => (parsed.valid ? nextRuns(expression, new Date(), 8) : []),
    [expression, parsed.valid]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Timer}
          title="Cron Expression Explainer"
          description="Read a cron expression in plain English and see when it fires next, in UTC."
          badge={parsed.valid ? `${parsed.fieldCount} fields` : 'Invalid'}
          badgeVariant={parsed.valid ? 'success' : 'warning'}
        >
          <button
            onClick={() => handleCopy(expression, 'expression')}
            disabled={!expression.trim()}
            className="btn btn-secondary btn-sm"
          >
            {copiedKey === 'expression' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>Copy</span>
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="card p-4 space-y-3">
              <input
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                placeholder="*/5 * * * *"
                spellCheck={false}
                aria-label="Cron expression"
                className="w-full px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-base tracking-wide focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-neutral-100/10 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />

              <div className="flex flex-wrap gap-1.5">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.expression}
                    onClick={() => setExpression(preset.expression)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                      expression === preset.expression
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-medium'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {parsed.valid ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-start gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    {parsed.description}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{parsed.error}</p>
                </div>
              )}
            </div>

            {parsed.valid && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-0 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                      Fields
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {parsed.fields.map((field) => (
                      <div key={field.spec.name} className="px-4 py-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                            {field.spec.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            {FIELD_HINTS[field.spec.name]}
                          </div>
                        </div>
                        <div className="text-right min-w-0">
                          <div className="font-mono text-xs text-neutral-900 dark:text-neutral-100">
                            {field.raw}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
                            {field.isWildcard
                              ? 'every value'
                              : `${field.values.length} value${field.values.length === 1 ? '' : 's'}: ${field.values.slice(0, 8).join(', ')}${field.values.length > 8 ? '…' : ''}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-0 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center gap-2">
                    <CalendarClock size={13} className="text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                      Next runs (UTC)
                    </span>
                  </div>
                  {runs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                      This expression never fires within the next year. Check the day and month fields.
                    </div>
                  ) : (
                    <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {runs.map((run, index) => (
                        <li
                          key={run.toISOString()}
                          className="px-4 py-2 flex items-center gap-3 text-xs"
                        >
                          <span className="font-mono text-[10px] text-neutral-400 w-4 text-right">
                            {index + 1}
                          </span>
                          <span className="font-mono text-neutral-900 dark:text-neutral-100 select-all">
                            {run.toISOString().replace('T', ' ').replace('.000Z', '')}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              Standard 5 field cron, or 6 fields with leading seconds. Vendor extensions
              (L, W, # and ?) are rejected rather than guessed at. Times are UTC, so compare them
              against the timezone your scheduler runs in.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
