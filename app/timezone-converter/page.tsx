'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { CustomSelect } from '@/components/CustomSelect';
import {
    parseInputTime,
    convertToTimezone,
    parseDateTimeLocalInput,
    getTimezoneOffsetMs,
    TIME_ZONES,
    TimeZoneId,
} from '@/utils/timezoneConverter';
import { Copy, Clock, Trash2, Calendar, Globe, ArrowRightLeft, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

type InputMode = 'paste' | 'picker';

export default function TimeZoneConverterPage() {
    const { width } = useSidebar();
    const [inputMode, setInputMode] = useState<InputMode>('paste');
    const [sourceTimezone, setSourceTimezone] = useState<TimeZoneId>('UTC');
    const [textInput, setTextInput] = useState('');
    const [dateTimeInput, setDateTimeInput] = useState('');
    const [convertedTimes, setConvertedTimes] = useState<{ timezone: TimeZoneId; name: string; time: string; diff: string; abbreviation: string }[]>([]);
    const [error, setError] = useState('');

    const handleConvert = useCallback(() => {
        setError('');
        let parsedDate: Date | null = null;

        if (inputMode === 'paste' && textInput.trim()) {
            parsedDate = parseInputTime(textInput, sourceTimezone);
            if (!parsedDate && textInput.length > 10) {
                setError('Format error. Try: YYYY-MM-DD HH:mm:ss');
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
            };
        });

        setConvertedTimes(results);
    }, [textInput, dateTimeInput, sourceTimezone, inputMode]);

    useEffect(() => {
        handleConvert();
    }, [handleConvert]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Time copied!');
    };

    const handleUseNow = () => {
        const now = new Date();
        if (inputMode === 'picker') {
            const localISOTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
            setDateTimeInput(localISOTime);
        } else {
            setTextInput(convertToTimezone(now, sourceTimezone));
        }
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
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Time Zone Converter</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono uppercase tracking-tighter">UTC • AST • IST</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button onClick={() => setInputMode('paste')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'paste' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-400'}`}>Paste Text</button>
                          <button onClick={() => setInputMode('picker')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'picker' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-400'}`}>Picker</button>
                        </div>
                        <button onClick={handleUseNow} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95">
                            <Zap size={14} /> Use Current
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Input Area */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 group">
                            <div className="flex items-center gap-6">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Source Time & Zone</label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            {inputMode === 'paste' ? (
                                                <input
                                                    type="text"
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    placeholder="2026-04-04 11:21:40 or 1712568051409"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-amber-500/50 rounded-2xl p-4 font-mono text-xl text-slate-900 dark:text-white outline-none transition-all"
                                                />
                                            ) : (
                                                <input
                                                    type="datetime-local"
                                                    step="1"
                                                    value={dateTimeInput}
                                                    onChange={(e) => setDateTimeInput(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-amber-500/50 rounded-2xl p-4 font-mono text-xl text-slate-900 dark:text-white outline-none transition-all"
                                                />
                                            )}
                                        </div>
                                        <div className="sm:w-64">
                                            <CustomSelect
                                                value={sourceTimezone}
                                                onChange={(val) => setSourceTimezone(val as TimeZoneId)}
                                                options={TIME_ZONES.map(tz => ({ label: `${tz.abbreviation} (${tz.offset})`, value: tz.id }))}
                                                className="w-full h-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-amber-500/50 rounded-2xl p-4 font-bold text-slate-600 dark:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {error && <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-2"><Trash2 size={12}/> {error}</p>}
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {convertedTimes.length > 0 ? (
                                convertedTimes.map((tz, i) => (
                                    <div 
                                        key={tz.timezone}
                                        className={`group relative bg-white dark:bg-slate-900 rounded-3xl border-2 p-6 shadow-xl transition-all duration-500 ${tz.timezone === sourceTimezone ? 'border-amber-500 ring-4 ring-amber-500/5' : 'border-slate-100 dark:border-slate-800'}`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tz.name}</span>
                                                <span className="text-xl font-black text-slate-900 dark:text-white">{tz.abbreviation}</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${tz.timezone === sourceTimezone ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                {tz.diff}
                                            </div>
                                        </div>
                                        <div className="font-mono text-lg font-bold text-slate-600 dark:text-slate-300 break-all mb-6">
                                            {tz.time}
                                        </div>
                                        <button 
                                            onClick={() => handleCopy(tz.time)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-600 hover:text-white rounded-2xl transition-all text-xs font-bold text-slate-500"
                                        >
                                            <Copy size={14} /> Copy Result
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 h-64 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-4">
                                     <ArrowRightLeft size={48} className="opacity-20" />
                                     <p className="text-xs font-black uppercase tracking-widest">Waiting for input...</p>
                                </div>
                            )}
                        </div>

                        {/* Technical Footer */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white/50 flex flex-wrap gap-8 items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-xl text-emerald-400"><CheckCircle2 size={24}/></div>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-white tracking-widest">Precision Engine</h4>
                                    <p className="text-[10px] font-medium opacity-60">Milliseconds preserved during conversion.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <InfoItem label="Engine" value="Intl.DateTimeFormat" />
                                <InfoItem label="Base" value="ISO 8601" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="text-right">
            <div className="text-[8px] font-black uppercase tracking-tighter opacity-40">{label}</div>
            <div className="text-[10px] font-bold text-white/80">{value}</div>
        </div>
    );
}
