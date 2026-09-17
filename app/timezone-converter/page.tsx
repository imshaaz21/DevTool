'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { CustomSelect } from '@/components/CustomSelect';
import {
  parseInputTime,
  convertToTimezone,
  parseDateTimeLocalInput,
  getTimezoneOffsetMs,
  getUnixEpoch,
  TIME_ZONES,
  TimeZoneId,
} from '@/utils/timezoneConverter';
import {
  Copy,
  Clock,
  Trash2,
  Globe,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type InputMode = 'paste' | 'picker';

export default function TimeZoneConverterPage() {
  const { width } = useSidebar();
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [sourceTimezone, setSourceTimezone] = useState<TimeZoneId>('UTC');
  const [textInput, setTextInput] = useState('');
  const [dateTimeInput, setDateTimeInput] = useState('');
  const [convertedTimes, setConvertedTimes] = useState<{
    timezone: TimeZoneId;
    name: string;
    time: string;
    diff: string;
    abbreviation: string;
    epochSeconds: number;
    epochMs: number;
  }[]>([]);
  const [error, setError] = useState('');
  const [copiedTz, setCopiedTz] = useState<string | null>(null);

  const handleConvert = useCallback(() => {
    setError('');
    let parsedDate: Date | null = null;

    if (inputMode === 'paste' && textInput.trim()) {
      parsedDate = parseInputTime(textInput, sourceTimezone);
      if (!parsedDate && textInput.length > 10) {
        setError('Format error. Try standard ISO or: YYYY-MM-DD HH:mm:ss');
        return;
      }
    } else if (inputMode === 'picker' && dateTimeInput) {
      parsedDate = parseDateTimeLocalInput(dateTimeInput, sourceTimezone);
    }

    if (!parsedDate) {
      setConvertedTimes([]);
      return;
    }

    const sourceOffset = getTimezoneOffsetMs(sourceTimezone);
    const epochInfo = getUnixEpoch(parsedDate!);
    const results = TIME_ZONES.map((tz) => {
      const targetOffset = getTimezoneOffsetMs(tz.id);
      const diffHours = (targetOffset - sourceOffset) / (1000 * 60 * 60);
      const diffString = diffHours === 0 ? 'Same' : (diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`);

      return {
        timezone: tz.id,
        name: tz.name,
        abbreviation: tz.abbreviation,
        time: convertToTimezone(parsedDate!, tz.id),
        diff: diffString,
        epochSeconds: epochInfo.seconds,
        epochMs: epochInfo.milliseconds,
      };
    });

    setConvertedTimes(results);
  }, [textInput, dateTimeInput, sourceTimezone, inputMode]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = (text: string, tz: string, label = 'Timestamp') => {
    navigator.clipboard.writeText(text);
    setCopiedTz(tz);
    setTimeout(() => setCopiedTz(null), 1500);
    toast.success(`${label} copied to clipboard`);
  };

  const handleUseNow = () => {
    const now = new Date();
    if (inputMode === 'picker') {
      const localISOTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
      setDateTimeInput(localISOTime);
    } else {
      setTextInput(convertToTimezone(now, sourceTimezone));
    }
    toast.success('Updated to current timestamp');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Globe}
          title="Time Zone Converter"
          description="Convert timestamps with live offsets across UTC, Saudi Arabia (AST), and Sri Lanka (IST)."
          badge="AST • UTC • IST"
        >
          <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                inputMode === 'paste'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputMode('picker')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                inputMode === 'picker'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Date Picker
            </button>
          </div>

          <button
            onClick={handleUseNow}
            className="btn btn-primary"
          >
            <Zap size={13} />
            <span>Use Current</span>
          </button>
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Input Card */}
            <div className="card p-5 space-y-4">
              <label className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Source Timestamp & Time Zone
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  {inputMode === 'paste' ? (
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g. 2026-04-04 11:21:40 or unix epoch 1712568051409"
                      className="input font-mono text-sm py-2"
                    />
                  ) : (
                    <input
                      type="datetime-local"
                      step="1"
                      value={dateTimeInput}
                      onChange={(e) => setDateTimeInput(e.target.value)}
                      className="input font-mono text-sm py-2"
                    />
                  )}
                </div>

                <div className="sm:w-60">
                  <CustomSelect
                    value={sourceTimezone}
                    onChange={(val) => setSourceTimezone(val as TimeZoneId)}
                    options={TIME_ZONES.map(tz => ({
                      label: `${tz.name} (${tz.abbreviation})`,
                      value: tz.id
                    }))}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {convertedTimes.length > 0 ? (
                convertedTimes.map((tz) => {
                  const isSource = tz.timezone === sourceTimezone;
                  return (
                    <div
                      key={tz.timezone}
                      className={`card p-4 flex flex-col justify-between transition-colors ${
                        isSource
                          ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-900'
                          : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              {tz.name}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {tz.abbreviation}
                            </span>
                          </div>

                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSource
                              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                          }`}>
                            {tz.diff}
                          </span>
                        </div>

                        <div className="py-2.5 font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100 select-all">
                          {tz.time}
                        </div>

                        {/* Unix Epoch Display */}
                        <div className="mt-2 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                              Epoch (s)
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 select-all">
                                {tz.epochSeconds}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tz.epochSeconds.toString(), `${tz.timezone}-sec`, 'Epoch (seconds)')}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                title="Copy Epoch in seconds"
                              >
                                {copiedTz === `${tz.timezone}-sec` ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                              Epoch (ms)
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 select-all">
                                {tz.epochMs}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tz.epochMs.toString(), `${tz.timezone}-ms`, 'Epoch (milliseconds)')}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                title="Copy Epoch in milliseconds"
                              >
                                {copiedTz === `${tz.timezone}-ms` ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(tz.time, tz.timezone, 'Timestamp')}
                        className="btn btn-secondary btn-sm w-full mt-3"
                      >
                        {copiedTz === tz.timezone ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedTz === tz.timezone ? 'Copied' : 'Copy Timestamp'}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-3 p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/30">
                  <Clock size={28} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                  <p className="text-xs text-neutral-500">
                    Enter a valid date/time or click &ldquo;Use Current&rdquo; to calculate timezone conversions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
