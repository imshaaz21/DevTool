'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { AutoToggle } from '@/components/AutoToggle';
import {
  decompressScreenPermission,
  compressScreenPermission,
  SAMPLE_SCREEN_PERMISSION_JSON,
  SAMPLE_SCREEN_PERMISSION_BASE64_GZIP
} from '@/utils/screenPermission';
import {
  Copy,
  Check,
  Trash2,
  ArrowLeftRight,
  ShieldCheck,
  FileCode,
  Download,
  Sparkles,
  Info
} from 'lucide-react';

type OperationMode = 'decompress' | 'compress';
type ViewFormat = 'pretty' | 'raw';

export default function ScreenPermissionDecodePage() {
  const { width } = useSidebar();
  const [mode, setMode] = useState<OperationMode>('decompress');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAutoConvert, setIsAutoConvert] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('pretty');
  const [stats, setStats] = useState<{
    inputSize: number;
    outputSize: number;
    ratio?: string;
    isJson?: boolean;
  } | null>(null);

  const handleProcess = useCallback(
    (currentInput: string, currentMode: OperationMode, currentFormat: ViewFormat) => {
      if (!currentInput.trim()) {
        setOutput('');
        setError('');
        setStats(null);
        return;
      }

      setError('');
      if (currentMode === 'decompress') {
        const result = decompressScreenPermission(currentInput);
        if (result.success) {
          const displayOutput =
            currentFormat === 'pretty' && result.formattedJson
              ? result.formattedJson
              : result.decompressedText;
          setOutput(displayOutput);
          setStats({
            inputSize: result.inputSize,
            outputSize: result.outputSize,
            ratio: result.compressionRatio,
            isJson: result.isJson
          });
        } else {
          setError(result.error || 'Failed to decompress data.');
          setOutput('');
          setStats(null);
        }
      } else {
        // Compress mode
        const result = compressScreenPermission(currentInput);
        if (result.success) {
          setOutput(result.base64Gzip);
          setStats({
            inputSize: result.inputSize,
            outputSize: result.outputSize,
            ratio: result.compressionRatio,
            isJson: false
          });
        } else {
          setError(result.error || 'Failed to compress data.');
          setOutput('');
          setStats(null);
        }
      }
    },
    []
  );

  // Auto-convert with debounce
  useEffect(() => {
    if (!isAutoConvert) return;
    const timer = setTimeout(() => {
      handleProcess(input, mode, viewFormat);
    }, 250);
    return () => clearTimeout(timer);
  }, [input, mode, viewFormat, isAutoConvert, handleProcess]);

  const handleModeChange = (newMode: OperationMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setInput('');
    setOutput('');
    setError('');
    setStats(null);
  };

  const handleLoadSample = () => {
    if (mode === 'decompress') {
      setInput(SAMPLE_SCREEN_PERMISSION_BASE64_GZIP);
      handleProcess(SAMPLE_SCREEN_PERMISSION_BASE64_GZIP, 'decompress', viewFormat);
    } else {
      setInput(SAMPLE_SCREEN_PERMISSION_JSON);
      handleProcess(SAMPLE_SCREEN_PERMISSION_JSON, 'compress', viewFormat);
    }
  };

  const handleSwap = () => {
    if (!output) return;
    const nextMode: OperationMode = mode === 'decompress' ? 'compress' : 'decompress';
    const nextInput = output;
    setMode(nextMode);
    setInput(nextInput);
    handleProcess(nextInput, nextMode, viewFormat);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const filename =
      mode === 'decompress'
        ? stats?.isJson
          ? 'screen-permission.json'
          : 'screen-permission.txt'
        : 'screen-permission-gzip.txt';

    const mimeType =
      mode === 'decompress' && stats?.isJson ? 'application/json' : 'text/plain';

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setStats(null);
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
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Screen Permission Decode
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Gzip Online
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decompress and compress Gzip Base64 screen permission payloads with instant JSON formatting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AutoToggle
              enabled={isAutoConvert}
              onChange={setIsAutoConvert}
              activeColorClass="bg-teal-600"
              activeTextClass="text-teal-500 fill-teal-500"
            />

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleModeChange('decompress')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === 'decompress'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Decompress (Gzip → JSON)
              </button>
              <button
                onClick={() => handleModeChange('compress')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === 'compress'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Compress (JSON → Gzip)
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                Load Sample {mode === 'decompress' ? 'Base64 Gzip' : 'JSON'}
              </button>

              {mode === 'decompress' && stats?.isJson && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewFormat('pretty')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      viewFormat === 'pretty'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Pretty JSON
                  </button>
                  <button
                    onClick={() => setViewFormat('raw')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      viewFormat === 'raw'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Raw Text
                  </button>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="flex items-center gap-3 text-xs bg-white dark:bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Input: <strong className="text-slate-800 dark:text-slate-200">{stats.inputSize} B</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Output: <strong className="text-slate-800 dark:text-slate-200">{stats.outputSize} B</strong>
                </span>
                {stats.ratio && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">{stats.ratio}</span>
                  </>
                )}
                {stats.isJson && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <FileCode className="w-3.5 h-3.5" /> Valid JSON
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSwap}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                title="Swap Input & Output"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Swap
              </button>

              <button
                onClick={() => handleProcess(input, mode, viewFormat)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-teal-500/20"
              >
                {mode === 'decompress' ? 'Decompress Now' : 'Compress Now'}
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

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Editor Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[420px]">
            {/* Input Card */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {mode === 'decompress'
                    ? 'Input: Base64 Gzip (Screen Permission Payload)'
                    : 'Input: JSON or Text to Compress'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{input.length} characters</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'decompress'
                    ? 'Paste Base64-encoded Gzip screen permission payload here (e.g. H4sIAAAAA...)...'
                    : 'Paste screen permission JSON or plain text here...'
                }
                className="flex-1 w-full p-6 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs md:text-sm leading-relaxed focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>

            {/* Output Card */}
            <div className="flex flex-col bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative group">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {mode === 'decompress'
                    ? 'Output: Decompressed Screen Permission'
                    : 'Output: Base64 Gzip Payload'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={!output}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] font-semibold transition-all disabled:opacity-20"
                    title="Download output file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!output}
                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-[11px] font-semibold transition-all disabled:opacity-20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={output}
                placeholder={
                  mode === 'decompress'
                    ? 'Decompressed JSON / readable screen permission will appear here...'
                    : 'Compressed Base64 Gzip string will appear here...'
                }
                className="flex-1 w-full p-6 bg-transparent text-emerald-400 font-mono text-xs md:text-sm leading-relaxed focus:outline-none resize-none placeholder:text-slate-700 selection:bg-teal-500/30"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
