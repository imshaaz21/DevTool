'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import {
    parseInputTime,
    convertToTimezone,
    parseDateTimeLocalInput,
    getTimezoneOffsetMs,
    TIME_ZONES,
    TimeZoneId,
} from '@/utils/timezoneConverter';
import { Copy, Clock, Trash2, Calendar } from 'lucide-react';

type InputMode = 'paste' | 'picker';

export default function TimeZoneConverterPage() {
    const [inputMode, setInputMode] = useState<InputMode>('paste');
    const [sourceTimezone, setSourceTimezone] = useState<TimeZoneId>('UTC');
    const [textInput, setTextInput] = useState('');
    const [dateTimeInput, setDateTimeInput] = useState('');
    const [convertedTimes, setConvertedTimes] = useState<{ timezone: TimeZoneId; name: string; time: string; diff: string }[]>([]);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Auto-convert when inputs change
    useEffect(() => {
        handleConvert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textInput, dateTimeInput, sourceTimezone, inputMode]);

    const handleConvert = () => {
        setError('');
        setConvertedTimes([]);

        let parsedDate: Date | null = null;

        if (inputMode === 'paste' && textInput.trim()) {
            parsedDate = parseInputTime(textInput, sourceTimezone);
            if (!parsedDate) {
                setError('Could not parse the input time. Supported formats: YYYY-MM-DD HH:mm:ss.SSS, YYYY-MM-DD HH:mm:ss, DD/MM/YYYY HH:mm:ss');
                return;
            }
        } else if (inputMode === 'picker' && dateTimeInput) {
            parsedDate = parseDateTimeLocalInput(dateTimeInput, sourceTimezone);
            if (!parsedDate) {
                setError('Invalid date/time selection');
                return;
            }
        }

        if (!parsedDate) {
            return;
        }

        const sourceOffset = getTimezoneOffsetMs(sourceTimezone);

        const results = TIME_ZONES.map((tz) => {
            const targetOffset = getTimezoneOffsetMs(tz.id);
            const diffMs = targetOffset - sourceOffset;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            let diffString = '';
            if (diffHours > 0) {
                diffString = `(+${Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1)}h)`;
            } else if (diffHours < 0) {
                diffString = `(${Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1)}h)`;
            }

            return {
                timezone: tz.id,
                name: `${tz.name} (${tz.abbreviation})`,
                time: convertToTimezone(parsedDate!, tz.id),
                diff: diffString,
            };
        });

        setConvertedTimes(results);
    };

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClear = () => {
        setTextInput('');
        setDateTimeInput('');
        setConvertedTimes([]);
        setError('');
    };

    const handleUseNow = () => {
        const now = new Date();
        if (inputMode === 'picker') {
            // Set datetime-local value in local time
            const localISOTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                .toISOString()
                .slice(0, 19);
            setDateTimeInput(localISOTime);
        } else {
            // Set text input to current time in source timezone
            setTextInput(convertToTimezone(now, sourceTimezone));
        }
    };

    return (
        <div className="flex">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen overflow-hidden">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Time Zone Converter
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Convert between UTC, Saudi Arabia (AST), and Sri Lanka (IST) time zones.
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Input Mode Selector */}
                    <div className="card">
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Input Method:
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setInputMode('paste')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                                        inputMode === 'paste'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    Paste Time
                                </button>
                                <button
                                    onClick={() => setInputMode('picker')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                                        inputMode === 'picker'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Date Picker
                                </button>
                            </div>

                            <div className="border-l border-slate-300 dark:border-slate-600 h-8 mx-2"></div>

                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Source Time Zone:
                            </label>
                            <select
                                value={sourceTimezone}
                                onChange={(e) => setSourceTimezone(e.target.value as TimeZoneId)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
                            >
                                {TIME_ZONES.map((tz) => (
                                    <option key={tz.id} value={tz.id}>
                                        {tz.name} ({tz.abbreviation}) {tz.offset}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {inputMode === 'paste' ? 'Paste Time String' : 'Select Date & Time'}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUseNow}
                                    className="btn btn-secondary btn-sm flex items-center gap-1"
                                >
                                    <Clock className="w-4 h-4" />
                                    Use Now
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="btn btn-secondary btn-sm flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {inputMode === 'paste' ? (
                            <div>
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="e.g., 2026-01-01 11:04:44.001 or 01/01/2026 11:04:44"
                                    className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Supported formats: YYYY-MM-DD HH:mm:ss.SSS, YYYY-MM-DD HH:mm:ss, YYYY-MM-DD HH:mm, DD/MM/YYYY HH:mm:ss
                                </p>
                            </div>
                        ) : (
                            <input
                                type="datetime-local"
                                step="1"
                                value={dateTimeInput}
                                onChange={(e) => setDateTimeInput(e.target.value)}
                                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Results Section */}
                    {convertedTimes.length > 0 && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                Converted Times
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {convertedTimes.map((result, index) => (
                                    <div
                                        key={result.timezone}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            result.timezone === sourceTimezone
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {result.name} <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{result.diff}</span>
                                                {result.timezone === sourceTimezone && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded">
                                                        Source
                                                    </span>
                                                )}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(result.time, index)}
                                                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                {copiedIndex === index ? (
                                                    <span className="text-green-500 text-xs font-medium">Copied!</span>
                                                ) : (
                                                    <Copy className="w-4 h-4 text-slate-500" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="font-mono text-lg text-slate-900 dark:text-slate-100">
                                            {result.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="card bg-slate-50 dark:bg-slate-900">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Time Zone Information
                        </h3>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <li>• <strong>UTC</strong> - Coordinated Universal Time (GMT+0)</li>
                            <li>• <strong>Saudi Arabia (AST)</strong> - Arabia Standard Time (GMT+3)</li>
                            <li>• <strong>Sri Lanka (IST)</strong> - India Standard Time (GMT+5:30)</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
