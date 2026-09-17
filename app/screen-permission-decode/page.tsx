'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
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

  useEffect(() => {
    if (!isAutoConvert) return;
    const timer = setTimeout(() => {
      handleProcess(input, mode, viewFormat);
    }, 200);
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
      toast.success('Loaded sample Base64 Gzip payload');
    } else {
      setInput(SAMPLE_SCREEN_PERMISSION_JSON);
      handleProcess(SAMPLE_SCREEN_PERMISSION_JSON, 'compress', viewFormat);
      toast.success('Loaded sample screen permission JSON');
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
      toast.success('Copied output to clipboard');
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
    linkClick(a);
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const linkClick = (element: HTMLAnchorElement) => {
    element.click();
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setStats(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={ShieldCheck}
          title="Screen Permission Decode"
          description="Decompress and compress Gzip Base64 screen permission payloads with instant JSON formatting."
          badge="Gzip Online"
        >
          <AutoToggle
            enabled={isAutoConvert}
            onChange={setIsAutoConvert}
          />

          {/* Mode Switcher */}
          <div className="flex p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            <button
              onClick={() => handleModeChange('decompress')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'decompress'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Decompress (Gzip → JSON)
            </button>
            <button
              onClick={() => handleModeChange('compress')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'compress'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Compress (JSON → Gzip)
            </button>
          </div>
        </PageHeader>

        {/* Toolbar & Controls */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className="btn btn-secondary btn-sm"
              >
                <Sparkles size={13} className="text-zinc-400" />
                <span>Load Sample {mode === 'decompress' ? 'Base64 Gzip' : 'JSON'}</span>
              </button>

              {mode === 'decompress' && stats?.isJson && (
                <div className="flex p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                  <button
                    onClick={() => setViewFormat('pretty')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewFormat === 'pretty'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Pretty JSON
                  </button>
                  <button
                    onClick={() => setViewFormat('raw')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewFormat === 'raw'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Raw Text
                  </button>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="flex items-center gap-2.5 text-xs bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono">
                <span className="text-zinc-500">
                  In: <strong className="text-zinc-800 dark:text-zinc-200">{stats.inputSize} B</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <span className="text-zinc-500">
                  Out: <strong className="text-zinc-800 dark:text-zinc-200">{stats.outputSize} B</strong>
                </span>
                {stats.ratio && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {stats.ratio} compression savings
                    </span>
                  </>
                )}
                {stats.isJson && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <FileCode size={12} /> Valid JSON
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSwap}
                disabled={!output}
                className="btn btn-secondary btn-sm"
                title="Swap Input & Output"
              >
                <ArrowLeftRight size={13} />
                <span>Swap</span>
              </button>

              <button
                onClick={() => handleProcess(input, mode, viewFormat)}
                className="btn btn-primary"
              >
                {mode === 'decompress' ? 'Decompress Now' : 'Compress Now'}
              </button>

              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="btn btn-secondary btn-sm"
                title="Clear all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2 shrink-0">
              <Info size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dual Editors */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Card */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">
                  {mode === 'decompress'
                    ? 'Input: Base64 Gzip'
                    : 'Input: JSON / Text to Compress'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {input.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'decompress'
                    ? 'Paste Base64-encoded Gzip screen permission payload here (e.g. H4sIAAAAA...)...'
                    : 'Paste screen permission JSON or plain text here...'
                }
                className="flex-1 w-full p-4 bg-transparent text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                spellCheck={false}
              />
            </div>

            {/* Output Card */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">
                  {mode === 'decompress'
                    ? 'Output: Decompressed Result'
                    : 'Output: Base64 Gzip'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownload}
                    disabled={!output}
                    className="btn btn-secondary btn-sm"
                    title="Download output file"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!output}
                    className="btn btn-secondary btn-sm"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={output}
                placeholder={
                  mode === 'decompress'
                    ? 'Decompressed JSON or readable screen permission will appear here...'
                    : 'Compressed Base64 Gzip string will appear here...'
                }
                className="flex-1 w-full p-4 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
