'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
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
import {
  Copy,
  ArrowLeftRight,
  Trash2,
  Binary,
  Check,
  AlertCircle
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const handleEncodeDecode = useCallback(async (
    currentInput: string,
    currentMode: ToolMode,
    currentIsEncoding: boolean,
    currentHashType: HashType
  ) => {
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

  useEffect(() => {
    if (!isAutoConvert) return;

    const timer = setTimeout(() => {
      handleEncodeDecode(input, mode, isEncoding, hashType);
    }, 200);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied output to clipboard');
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
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Binary}
          title="Encoder / Decoder & Hash"
          description="Instant Base64 encoding/decoding and cryptographic hash checksum generation."
          badge={mode === 'encode' ? 'Base64' : hashType.toUpperCase()}
        >
          <AutoToggle
            enabled={isAutoConvert}
            onChange={setIsAutoConvert}
          />

          <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <button
              onClick={() => setMode('encode')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'encode'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Base64
            </button>
            <button
              onClick={() => setMode('hash')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'hash'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Hash Checksum
            </button>
          </div>
        </PageHeader>

        {/* Toolbar & Controls */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3">
              {mode === 'encode' ? (
                <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <button
                    onClick={() => setIsEncoding(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      isEncoding
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    Encode
                  </button>
                  <button
                    onClick={() => setIsEncoding(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      !isEncoding
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    Decode
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-500">Algorithm:</span>
                  <div className="w-32">
                    <CustomSelect
                      value={hashType}
                      onChange={(val) => setHashType(val as HashType)}
                      options={[
                        { label: 'MD5', value: 'md5' },
                        { label: 'SHA-1', value: 'sha1' },
                        { label: 'SHA-256', value: 'sha256' },
                        { label: 'SHA-512', value: 'sha512' }
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {mode === 'encode' && output && (
                <button
                  onClick={handleSwap}
                  className="btn btn-secondary btn-sm"
                  title="Swap Input & Output"
                >
                  <ArrowLeftRight size={13} />
                  <span>Swap</span>
                </button>
              )}

              <button
                onClick={() => handleEncodeDecode(input, mode, isEncoding, hashType)}
                className="btn btn-primary"
              >
                Process Now
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

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2 shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Editors Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Card */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  Input Source
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {input.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'hash' ? 'Paste text to generate cryptographic hash...' : 'Paste text to convert...'}
                className="flex-1 w-full p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                spellCheck={false}
              />
            </div>

            {/* Output Card */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  Output Result
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={output}
                placeholder="Result will appear here..."
                className="flex-1 w-full p-4 bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
