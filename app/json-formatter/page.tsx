'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
const JsonEditorComponent = dynamic(() => import('@/components/JsonEditorComponent').then(mod => ({ default: mod.JsonEditorComponent })), { ssr: false });
import {
    parseStringifiedJSON,
    formatJSON,
    minifyJSON,
    FormatterResult
} from '@/utils/jsonFormatter';
import { Copy, Wand2, Minimize2, FileJson, Trash2 } from 'lucide-react';

type ActionMode = 'parse' | 'format' | 'minify';
type EditorMode = 'tree' | 'code' | 'view' | 'form' | 'text';

export default function JsonFormatterPage() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [outputJson, setOutputJson] = useState<any>(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<ActionMode>('parse');
    const [iterations, setIterations] = useState<number | undefined>();
    const [indentSize, setIndentSize] = useState(2);
    const [editorMode, setEditorMode] = useState<EditorMode>('code');

    // Automatically trigger action when mode changes if input exists
    useEffect(() => {
        if (input.trim()) {
            handleAction();
        } else {
            // Clear output if no input
            setOutput('');
            setOutputJson(null);
            setError('');
            setIterations(undefined);
        }
    }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAction = () => {
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
                // Convert the formatted string to JSON object for the editor
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
            // Clear output on error
            setOutput('');
            setOutputJson(null);
        }
    };

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
            case 'parse':
                return 'Parse & Format';
            case 'format':
                return 'Format';
            case 'minify':
                return 'Minify';
            default:
                return 'Process';
        }
    };

    const getActionIcon = () => {
        switch (mode) {
            case 'parse':
                return <Wand2 className="w-4 h-4" />;
            case 'format':
                return <FileJson className="w-4 h-4" />;
            case 'minify':
                return <Minimize2 className="w-4 h-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        JSON Formatter
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Parse stringified JSON, format, minify, or escape JSON strings. Handles nested stringified values automatically.
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Mode Selector */}
                    <div className="card">
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode:</label>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setMode('parse')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'parse'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Parse Stringified
                                </button>
                                <button
                                    onClick={() => setMode('format')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'format'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Format
                                </button>
                                <button
                                    onClick={() => setMode('minify')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'minify'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Minify
                                </button>
                            </div>

                            {mode === 'format' && (
                                <>
                                    <div className="border-l border-slate-300 dark:border-slate-600 h-8 mx-2"></div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">View:</label>
                                    <select
                                        value={editorMode}
                                        onChange={(e) => setEditorMode(e.target.value as EditorMode)}
                                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
                                    >
                                        <option value="tree">Tree</option>
                                        <option value="code">Code</option>
                                        <option value="view">View</option>
                                        <option value="form">Form</option>
                                        <option value="text">Text</option>
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            {mode === 'parse' && 'Parse Stringified JSON'}
                            {mode === 'format' && 'Format JSON'}
                            {mode === 'minify' && 'Minify JSON'}
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {mode === 'parse' && 'Automatically parses stringified JSON, including nested stringified values. Perfect for when you have JSON stored as a string multiple times.'}
                            {mode === 'format' && 'Formats valid JSON with proper indentation and line breaks for better readability.'}
                            {mode === 'minify' && 'Removes all unnecessary whitespace from JSON to reduce size.'}
                        </p>
                    </div>

                    {/* Input/Output Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Input */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Input
                                </h2>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {input.length.toLocaleString()} characters
                                </div>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder='Paste your JSON here...'
                                className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                spellCheck={false}
                            />
                        </div>

                        {/* Output */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Output
                                    {iterations && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                            ({iterations} iteration{iterations > 1 ? 's' : ''})
                                        </span>
                                    )}
                                </h2>
                                <div className="flex gap-2">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                                        {output.length.toLocaleString()} characters
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        disabled={!output}
                                        className="btn btn-sm btn-secondary flex items-center gap-1 disabled:opacity-50"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                </div>
                            </div>
                            {outputJson && (mode === 'parse' || mode === 'format') ? (
                                <JsonEditorComponent
                                    json={outputJson}
                                    onChange={() => { }} // Read-only
                                    mode={mode === 'format' ? editorMode : 'code'}
                                    height="400px"
                                    readOnly={true}
                                />
                            ) : output ? (
                                <pre className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-900 text-slate-100 font-mono text-sm overflow-auto">
                                    <code className="language-json">{output}</code>
                                </pre>
                            ) : (
                                <div className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                    Formatted output will appear here...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAction}
                            disabled={!input.trim()}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            {getActionIcon()}
                            {getActionButtonText()}
                        </button>

                        <button
                            onClick={handleClear}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
