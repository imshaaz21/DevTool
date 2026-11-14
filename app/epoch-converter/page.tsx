'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback } from '@/lib/clipboard';
import {
  Clock,
  Copy,
  Check,
  AlertCircle,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';
import {
  EPOCH_UNITS,
  fromEpoch,
  fromDateString,
  type EpochUnit,
} from '@/lib/epochConverter';

const UNIT_LABELS: Record<EpochUnit, string> = {
  seconds: 'Seconds',
  milliseconds: 'Milliseconds',
  microseconds: 'Microseconds',
  nanoseconds: 'Nanoseconds',
};

const UNIT_SHORT: Record<EpochUnit, string> = {
  seconds: 's',
  milliseconds: 'ms',
  microseconds: 'us',
  nanoseconds: 'ns',
};

export default function EpochConverterPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();

  const [timestamp, setTimestamp] = useState('');
  const [unit, setUnit] = useState<EpochUnit | 'auto'>('auto');
  const [dateInput, setDateInput] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // One timer for the whole page: the clock and every relative label share it.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const breakdown = useMemo(
    () => fromEpoch(timestamp, unit === 'auto' ? undefined : unit, now),
    [timestamp, unit, now]
  );

  const fromDate = useMemo(() => fromDateString(dateInput), [dateInput]);

  const useNow = () => {
    setUnit('milliseconds');
    setTimestamp(String(Date.now()));
  };

  const rows = breakdown.valid
    ? [
        { label: 'ISO 8601 (UTC)', value: breakdown.iso },
        { label: 'UTC string', value: breakdown.utc },
        { label: 'Local time', value: new Date(breakdown.epochMillis).toString() },
        { label: 'Epoch seconds', value: String(breakdown.epochSeconds) },
        { label: 'Epoch milliseconds', value: String(breakdown.epochMillis) },
        { label: 'Day of week', value: breakdown.dayOfWeek },
        { label: 'Relative', value: breakdown.relative },
      ]
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Clock}
          title="Epoch Converter"
          description="Convert Unix timestamps in seconds, milliseconds, microseconds or nanoseconds to a readable date, and back."
          badge="Unix time"
        >
          <span className="hidden sm:inline font-mono text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            now {Math.floor(now / 1000)}
          </span>
          <button onClick={useNow} className="btn btn-primary">
            <RefreshCw size={13} />
            <span>Use now</span>
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Timestamp to date */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Timestamp to date
                </h2>
                <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  {(['auto', ...EPOCH_UNITS] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setUnit(option)}
                      title={option === 'auto' ? 'Detect the unit from the value' : UNIT_LABELS[option]}
                      className={`min-w-[2.25rem] px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        unit === option
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      {option === 'auto' ? 'Auto' : UNIT_SHORT[option]}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
                placeholder="1794652200"
                spellCheck={false}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-neutral-100/10 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />

              {timestamp.trim() !== '' && !breakdown.valid && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{breakdown.error}</span>
                </div>
              )}

              {breakdown.valid && (
                <>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Read as <span className="font-medium text-neutral-700 dark:text-neutral-300">{UNIT_LABELS[breakdown.unit].toLowerCase()}</span>
                    {breakdown.detected ? ' (detected from the magnitude)' : ' (forced)'}.
                  </p>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    {rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-neutral-950/40 group"
                      >
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0 w-36">
                          {row.label}
                        </span>
                        <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate flex-1 select-all">
                          {row.value}
                        </span>
                        <button
                          onClick={() => handleCopy(row.value, row.label)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                          title={`Copy ${row.label}`}
                        >
                          {copiedKey === row.label ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date to timestamp */}
            <div className="card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ArrowRightLeft size={13} className="text-neutral-400" />
                Date to timestamp
              </h2>

              <input
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                placeholder="2026-11-14T10:30:00Z"
                spellCheck={false}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-neutral-100/10 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />

              {dateInput.trim() !== '' && !fromDate.valid && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{fromDate.error}</span>
                </div>
              )}

              {fromDate.valid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Epoch seconds', value: String(fromDate.epochSeconds) },
                    { label: 'Epoch milliseconds', value: String(fromDate.epochMillis) },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-neutral-400">{row.label}</span>
                        <button
                          onClick={() => handleCopy(row.value, row.label)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                          title={`Copy ${row.label}`}
                        >
                          {copiedKey === row.label ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100 select-all">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              Everything is converted in your browser. The unit is guessed from the number of digits,
              so a value in milliseconds is never silently read as seconds.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
