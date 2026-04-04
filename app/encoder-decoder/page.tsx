'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { CustomSelect } from '@/components/CustomSelect';
import { AutoToggle } from '@/components/AutoToggle';
import {
    encodeBase64,
    decodeBase64,
    hashMD5,
    hashSHA1,
    hashSHA256,
    hashSHA512
} from '@/utils/encoderDecoder';
import { Copy, ArrowLeftRight, Trash2, Zap } from 'lucide-react';

type ToolMode = 'encode' | 'hash';
type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512';

export default function EncoderDecoderPage() {
    const { width } = useSidebar();
    const [mode, setMode] = useState<ToolMode>('encode');
    const [hashType, setHashType] = useState<HashType>('md5');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isEncoding, setIsEncoding] = useState(true);
    const [isAutoConvert, setIsAutoConvert] = useState(true);

    const handleEncodeDecode = useCallback(async (currentInput: string, currentMode: ToolMode, currentIsEncoding: boolean, currentHashType: HashType) => {
        if (!currentInput.trim()) {
            setOutput('');
            setError('');
            return;
        }

        setError('');
        try {
            let result = '';

            if (currentMode === 'encode') {
                if (currentIsEncoding) {
                    result = encodeBase64(currentInput);
                } else {
                    result = decodeBase64(currentInput);
                }
            } else {
                // Hash mode
                let hash = '';
                switch (currentHashType) {
                    case 'md5':
                        hash = hashMD5(currentInput);
                        break;
                    case 'sha1':
                        hash = await hashSHA1(currentInput);
                        break;
                    case 'sha256':
                        hash = await hashSHA256(currentInput);
                        break;
                    case 'sha512':
                        hash = await hashSHA512(currentInput);
                        break;
                }
                result = hash;
            }

            setOutput(result);
        } catch (err) {
            if (!isAutoConvert || currentInput.length > 5) {
                setError((err as Error).message);
            }
        }
    }, [isAutoConvert]);

    // Handle auto-conversion with debounce
    useEffect(() => {
        if (!isAutoConvert) return;

        const timer = setTimeout(() => {
            handleEncodeDecode(input, mode, isEncoding, hashType);
        }, 300);

        return () => clearTimeout(timer);
    }, [input, mode, isEncoding, hashType, isAutoConvert, handleEncodeDecode]);

    const handleSwap = () => {
        const oldInput = input;
        setInput(output);
        setOutput(oldInput);
        setIsEncoding(!isEncoding);
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
        setError('');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <main 
                className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
                style={{ marginLeft: width }}
            >
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Encoder/Decoder
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Base64 and Hash utilities with instant results.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <AutoToggle 
                           enabled={isAutoConvert} 
                           onChange={setIsAutoConvert} 
                           activeColorClass="bg-indigo-600" 
                           activeTextClass="text-yellow-500 fill-yellow-500" 
                        />
                        
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setMode('encode')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'encode'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Base64
                            </button>
                            <button
                                onClick={() => setMode('hash')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'hash'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                Hash
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-4">
                        {mode === 'encode' ? (
                            <div className="flex bg-indigo-50 dark:bg-indigo-900/20 p-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                <button
                                    onClick={() => setIsEncoding(true)}
                                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${isEncoding
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                        }`}
                                >
                                    Encode
                                </button>
                                <button
                                    onClick={() => setIsEncoding(false)}
                                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!isEncoding
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                        }`}
                                >
                                    Decode
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Algorithm:</label>
                                <div className="w-40 relative">
                                    <CustomSelect
                                        value={hashType}
                                        onChange={(val) => setHashType(val as HashType)}
                                        options={[
                                            { label: 'MD5', value: 'md5' },
                                            { label: 'SHA-1', value: 'sha1' },
                                            { label: 'SHA-256', value: 'sha256' },
                                            { label: 'SHA-512', value: 'sha512' }
                                        ]}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex-1" />

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleEncodeDecode(input, mode, isEncoding, hashType)}
                                className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                Process Now
                            </button>
                            <button
                                onClick={handleClear}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Clear all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Editor Grid */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
                        {/* Input */}
                        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Input Source</span>
                                <span className="text-[10px] font-mono text-slate-400">{input.length} characters</span>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'hash' ? 'Paste text to generate hash...' : 'Paste text to convert...'}
                                className="flex-1 w-full p-6 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-base focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            />
                        </div>

                        {/* Output */}
                        <div className="flex flex-col bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative group">
                            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Output Result</span>
                                <button
                                    onClick={handleCopy}
                                    disabled={!output}
                                    className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all disabled:opacity-20"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                </button>
                            </div>
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Waiting for processing..."
                                className="flex-1 w-full p-6 bg-transparent text-indigo-400 dark:text-indigo-300 font-mono text-base focus:outline-none resize-none"
                            />
                            
                            {mode === 'encode' && output && (
                                <button
                                    onClick={handleSwap}
                                    className="absolute top-1/2 -left-3 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 hover:scale-110 active:scale-90 transition-all z-20"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                {error}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
