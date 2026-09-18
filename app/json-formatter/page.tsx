'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { AutoToggle } from '@/components/AutoToggle';
import { CustomSelect } from '@/components/CustomSelect';
const JsonEditorComponent = dynamic(
  () => import('@/components/JsonEditorComponent').then((mod) => ({ default: mod.JsonEditorComponent })),
  { ssr: false }
);
import {
  parseStringifiedJSON,
  formatJSON,
  minifyJSON,
  FormatterResult,
} from '@/utils/jsonFormatter';
import {
  Copy,
  Wand2,
  FileJson,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

type ActionMode = 'format' | 'parse' | 'minify';
type EditorMode = 'tree' | 'code' | 'view' | 'form' | 'text';

const SAMPLE_STRINGIFIED_JSON = `{\n  "event": "order_dispatched",\n  "timestamp": 1726650000,\n  "payload": "{\\"orderId\\":\\"ORD-88219\\",\\"customer\\":\\"{\\\\\\"id\\\\\\":\\\\\\"CUST-99\\\\\\",\\\\\\"name\\\\\\":\\\\\\"Khalid Mansoor\\\\\\"}\\",\\"items\\":\\"[{\\\\\\"sku\\\\\\":\\\\\\"SKU-A1\\\\\\",\\\\\\"qty\\\\\\":2},{\\\\\\"sku\\\\\\":\\\\\\"SKU-B4\\\\\\",\\\\\\"qty\\\\\\":1}]\\"}",\n  "meta": "{\\"service\\":\\"warehouse-edge\\",\\"region\\":\\"me-central-1\\"}"\n}`;

export default function JsonFormatterPage() {
  const { width } = useSidebar();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputJson, setOutputJson] = useState<any>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<ActionMode>('format');
  const [unwrapInner, setUnwrapInner] = useState<boolean>(true);
  const [unwrappedCount, setUnwrappedCount] = useState<number>(0);
  const [iterations, setIterations] = useState<number | undefined>();
  const [indentSize, setIndentSize] = useState(2);
  const [editorMode, setEditorMode] = useState<EditorMode>('code');
  const [isAutoFormat, setIsAutoFormat] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleAction = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setOutputJson(null);
      setError('');
      setIterations(undefined);
      setUnwrappedCount(0);
      return;
    }

    setError('');
    setIterations(undefined);
    setUnwrappedCount(0);

    let result: FormatterResult;

    switch (mode) {
      case 'parse':
        result = parseStringifiedJSON(input, unwrapInner, indentSize);
        break;
      case 'format':
        result = formatJSON(input, indentSize, unwrapInner);
        break;
      case 'minify':
        result = minifyJSON(input, unwrapInner);
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
      if (result.unwrappedCount) {
        setUnwrappedCount(result.unwrappedCount);
      }
    } else {
      setError(result.error || 'An error occurred');
      setOutput('');
      setOutputJson(null);
    }
  }, [input, mode, indentSize, unwrapInner]);

  useEffect(() => {
    if (!isAutoFormat) return;
    const timer = setTimeout(() => {
      handleAction();
    }, 250);
    return () => clearTimeout(timer);
  }, [input, mode, isAutoFormat, unwrapInner, handleAction]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied JSON to clipboard');
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
    setUnwrappedCount(0);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_STRINGIFIED_JSON);
  };

  const getActionButtonText = () => {
    switch (mode) {
      case 'parse':
        return 'Unescape & Parse';
      case 'format':
        return 'Format JSON';
      case 'minify':
        return 'Minify JSON';
      default:
        return 'Process';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={FileJson}
          title="JSON Formatter & Parser"
          description="Beautify, unescape stringified objects, and unpack inner nested JSON."
          badge="JSON 2.0"
        >
          {/* Sample Loader */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Load sample JSON with multiple inner stringified JSON fields"
          >
            <Sparkles size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Sample Inner JSON</span>
          </button>

          {/* Auto Format Toggle */}
          <AutoToggle enabled={isAutoFormat} onChange={setIsAutoFormat} />

          {/* Unwrap Inner JSON Toggle */}
          <button
            type="button"
            onClick={() => setUnwrapInner(!unwrapInner)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              unwrapInner
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Recursively unpack and format nested stringified JSON fields inside objects and arrays"
          >
            <Wand2
              size={13}
              className={unwrapInner ? 'text-amber-400 dark:text-amber-600' : 'text-neutral-400'}
            />
            <span>Unwrap Inner JSON</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setMode('format')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'format'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Format
            </button>
            <button
              type="button"
              onClick={() => setMode('parse')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'parse'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Stringified
            </button>
            <button
              type="button"
              onClick={() => setMode('minify')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'minify'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Minify
            </button>
          </div>

          {!isAutoFormat && (
            <button
              onClick={handleAction}
              disabled={!input.trim()}
              className="btn btn-primary"
            >
              {getActionButtonText()}
            </button>
          )}

          <button
            onClick={handleClear}
            disabled={!input && !output}
            className="btn btn-secondary btn-sm"
            title="Clear all"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </PageHeader>

        {/* Editors Layout */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Input Editor */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  Input JSON
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {input.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste or type raw, minified, or stringified JSON here (including fields with inner stringified JSON)..."
                className="flex-1 w-full p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                spellCheck={false}
              />
            </div>

            {/* Output Editor */}
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                    Formatted Result
                  </span>
                  {unwrappedCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1">
                      <Check size={11} className="text-emerald-500" />
                      <span>
                        {unwrappedCount} inner JSON{unwrappedCount === 1 ? '' : 's'} unpacked
                      </span>
                    </span>
                  )}
                  {iterations && iterations > 1 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      {iterations}x unescaped
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {outputJson && mode === 'format' && (
                    <div className="w-24">
                      <CustomSelect
                        value={editorMode}
                        onChange={(val) => setEditorMode(val as EditorMode)}
                        options={[
                          { label: 'Code', value: 'code' },
                          { label: 'Tree', value: 'tree' },
                          { label: 'View', value: 'view' },
                          { label: 'Form', value: 'form' },
                        ]}
                      />
                    </div>
                  )}
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

              <div className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-950">
                {outputJson && (mode === 'parse' || mode === 'format') ? (
                  <div className="h-full p-1">
                    <JsonEditorComponent
                      json={outputJson}
                      onChange={() => {}}
                      mode={mode === 'format' ? editorMode : 'code'}
                      height="100%"
                      readOnly={true}
                    />
                  </div>
                ) : output ? (
                  <pre className="absolute inset-0 p-4 font-mono text-xs leading-relaxed overflow-auto bg-neutral-900 text-neutral-100 dark:bg-neutral-950 dark:text-neutral-200">
                    <code>{output}</code>
                  </pre>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 gap-2 p-4">
                    <FileJson size={32} className="text-neutral-300 dark:text-neutral-700" />
                    <span className="text-xs text-neutral-400">
                      Waiting for valid JSON input...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
