'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import {
    encodeBase64,
    decodeBase64,
    hashMD5,
    hashSHA1,
    hashSHA256,
    hashSHA512
} from '@/utils/encoderDecoder';
import { Copy, ArrowLeftRight, Trash2 } from 'lucide-react';

type ToolMode = 'encode' | 'hash';
type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512';

export default function EncoderDecoderPage() {
    const [mode, setMode] = useState<ToolMode>('encode');
    const [hashType, setHashType] = useState<HashType>('md5');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isEncoding, setIsEncoding] = useState(true);

    const handleEncodeDecode = () => {
        setError('');
        try {
            let result = '';

            if (mode === 'encode') {
                if (isEncoding) {
                    result = encodeBase64(input);
                } else {
                    result = decodeBase64(input);
                }
            } else {
                // Hash mode
                (async () => {
                    try {
                        let hash = '';
                        switch (hashType) {
                            case 'md5':
                                hash = hashMD5(input);
                                break;
                            case 'sha1':
                                hash = await hashSHA1(input);
                                break;
                            case 'sha256':
                                hash = await hashSHA256(input);
                                break;
                            case 'sha512':
                                hash = await hashSHA512(input);
                                break;
                        }
                        setOutput(hash);
                    } catch (err) {
                        setError((err as Error).message);
                    }
                })();
                return;
            }

            setOutput(result);
        } catch (err) {
            setError((err as Error).message);
            setOutput('');
        }
    };

    const handleSwap = () => {
        setInput(output);
        setOutput(input);
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
        <div className="flex">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen overflow-hidden">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Encoder/Decoder & Hash Generator
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Base64 encoding/decoding and hash generation (MD5, SHA-1, SHA-256, SHA-512).
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Mode Selector */}
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode:</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMode('encode')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'encode'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Base64 Encode/Decode
                                </button>
                                <button
                                    onClick={() => setMode('hash')}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'hash'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Hash
                                </button>
                            </div>

                            {mode === 'encode' && (
                                <>
                                    <div className="border-l border-slate-300 dark:border-slate-600 h-8 mx-2"></div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEncoding(true)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isEncoding
                                                ? 'bg-green-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            Encode
                                        </button>
                                        <button
                                            onClick={() => setIsEncoding(false)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!isEncoding
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            Decode
                                        </button>
                                    </div>
                                </>
                            )}

                            {mode === 'hash' && (
                                <>
                                    <div className="border-l border-slate-300 dark:border-slate-600 h-8 mx-2"></div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Algorithm:</label>
                                    <select
                                        value={hashType}
                                        onChange={(e) => setHashType(e.target.value as HashType)}
                                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
                                    >
                                        <option value="md5">MD5</option>
                                        <option value="sha1">SHA-1</option>
                                        <option value="sha256">SHA-256</option>
                                        <option value="sha512">SHA-512</option>
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input/Output Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Input */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {mode === 'encode' && isEncoding ? 'Plain Text' : mode === 'encode' ? 'Encoded Text' : 'Input Text'}
                                </h2>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'hash' ? 'Enter text to hash...' : 'Enter text to encode/decode...'}
                                className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>

                        {/* Output */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {mode === 'encode' && isEncoding ? 'Encoded Text' : mode === 'encode' ? 'Plain Text' : 'Hash Output'}
                                </h2>
                                <div className="flex gap-2">
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
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Output will appear here..."
                                className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEncodeDecode}
                            className="btn btn-primary"
                        >
                            {mode === 'encode' && isEncoding ? 'Encode' : mode === 'encode' ? 'Decode' : 'Generate Hash'}
                        </button>

                        {mode === 'encode' && (
                            <button
                                onClick={handleSwap}
                                disabled={!output}
                                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
                            >
                                <ArrowLeftRight className="w-4 h-4" />
                                Swap
                            </button>
                        )}

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
                            {error}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
