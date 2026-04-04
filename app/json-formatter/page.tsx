'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false });
import {
    parseStringifiedJSON,
    formatJSON,
    minifyJSON,
    FormatterResult
} from '@/utils/jsonFormatter';
import { Copy, Wand2, Minimize2, FileJson, Trash2, Zap } from 'lucide-react';

type ActionMode = 'parse' | 'format' | 'minify';
type EditorMode = 'tree' | 'code' | 'view' | 'form' | 'text';

export default function JsonFormatterPage() {
    const { width } = useSidebar();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [outputJson, setOutputJson] = useState<any>(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<ActionMode>('format'); // Default to format
    const [iterations, setIterations] = useState<number | undefined>();
    const [indentSize, setIndentSize] = useState(2);
    const [editorMode, setEditorMode] = useState<EditorMode>('code');
    const [isAutoFormat, setIsAutoFormat] = useState(true);

    const handleAction = useCallback(() => {
        if (!input.trim()) {
            setOutput('');
            setOutputJson(null);
            setError('');
            setIterations(undefined);
            return;
        }

        setError('');
        setIterations(undefined);

        let result: FormatterResult;

        switch (mode) {
            case 'parse':
                result = parseStringifiedJSON(input);
                break;
            case 'format':
                result = formatJSON(input, indentSize);
                break;
            case 'minify':
                result = minifyJSON(input);
                break;
            default:
                result = { success: false, error: 'Unknown mode' };
        }

        if (result.success && result.formatted) {
            setOutput(result.formatted);
            try {
                const jsonObj = JSON.parse(result.formatted);
                setOutputJson(jsonObj);
            } catch (e) {
                setOutputJson(null);
            }
            if (result.iterations) {
                setIterations(result.iterations);
            }
        } else {
            setError(result.error || 'An error occurred');
            setOutput('');
            setOutputJson(null);
        }
    }, [input, mode, indentSize]);

    // Automatically trigger action when mode or input changes with debounce
    useEffect(() => {
        if (!isAutoFormat) return;

        const timer = setTimeout(() => {
            handleAction();
        }, 300);

        return () => clearTimeout(timer);
    }, [input, mode, isAutoFormat, handleAction]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(output);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setOutputJson(null);
        setError('');
        setIterations(undefined);
    };

    const getActionButtonText = () => {
        switch (mode) {
            case 'parse': return 'Parse Now';
            case 'format': return 'Format Now';
            case 'minify': return 'Minify Now';
            default: return 'Process';
        }
    };

    const getActionIcon = () => {
        switch (mode) {
            case 'parse': return <Wand2 className="w-4 h-4" />;
            case 'format': return <FileJson className="w-4 h-4" />;
            case 'minify': return <Minimize2 className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main 
                className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
                style={{ marginLeft: width }}
            >
                {/* Compact Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                JSON Formatter
                            </h1>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                        
                        {/* Auto-Format Toggle */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Zap className={`w-3.5 h-3.5 ${isAutoFormat ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Auto</span>
                            <button 
                                onClick={() => setIsAutoFormat(!isAutoFormat)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${isAutoFormat ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isAutoFormat ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Mode Bar */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setMode('parse')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'parse'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Stringified
                            </button>
                            <button
                                onClick={() => setMode('format')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'format'
                                    ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Format
                            </button>
                            <button
                                onClick={() => setMode('minify')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'minify'
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Minify
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {iterations && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                {iterations} Iterations
                            </span>
                        )}
                        {!isAutoFormat && (
                            <button
                                onClick={handleAction}
                                disabled={!input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95"
                            >
                                {getActionIcon()}
                                {getActionButtonText()}
                            </button>
                        )}
                        <button
                            onClick={handleClear}
                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-md transition-colors"
                            title="Clear All"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Content - Full Height Flex */}
                <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-slate-50 dark:bg-slate-950">
                    {/* Input Editor */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Input JSON
                            </h2>
                            <span className="text-[10px] font-mono text-slate-400">
                                {input.length.toLocaleString()} chars
                            </span>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Paste or type JSON here...'
                            className="flex-1 w-full p-6 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            spellCheck={false}
                        />
                    </div>

                    {/* Output Editor */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Result
                            </h2>
                            <div className="flex items-center gap-3">
                                {outputJson && mode === 'format' && (
                                    <select
                                        value={editorMode}
                                        onChange={(e) => setEditorMode(e.target.value as EditorMode)}
                                        className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-[10px] font-bold uppercase outline-none"
                                    >
                                        <option value="tree">Tree</option>
                                        <option value="code">Code</option>
                                        <option value="view">View</option>
                                        <option value="form">Form</option>
                                    </select>
                                )}
                                <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <button
                                    onClick={handleCopy}
                                    disabled={!output}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase transition-all disabled:opacity-20 flex items-center gap-2"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy Result
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900">
                            {outputJson && (mode === 'parse' || mode === 'format') ? (
                                <JsonEditorComponent
                                    json={outputJson}
                                    onChange={() => { }} // Read-only
                                    mode={mode === 'format' ? editorMode : 'code'}
                                    height="100%"
                                    readOnly={true}
                                />
                            ) : output ? (
                                <pre className="absolute inset-0 p-6 font-mono text-sm overflow-auto bg-slate-950 text-indigo-300 scrollbar-thin scrollbar-thumb-slate-800">
                                    <code className="language-json">{output}</code>
                                </pre>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50/10 gap-4">
                                    <FileJson size={48} className="opacity-10" />
                                    <span className="text-xs font-black uppercase tracking-widest opacity-30">Waiting for input...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}
            </main>
        </div>
    );
}
