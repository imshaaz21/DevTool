'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback, downloadTextFile } from '@/lib/clipboard';
import {
  Braces,
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  yamlToJson,
  jsonToYaml,
  isProbablyYaml,
  YAML_SAMPLE,
  type ConversionResult,
} from '@/lib/yamlConverter';

type Direction = 'yaml-to-json' | 'json-to-yaml';

const IDLE: ConversionResult = { ok: true, output: '' };

export default function YamlJsonPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();

  const [direction, setDirection] = useState<Direction>('yaml-to-json');
  const [input, setInput] = useState('');
  const [sortKeys, setSortKeys] = useState(false);
  const [indent, setIndent] = useState(2);
  const [result, setResult] = useState<ConversionResult>(IDLE);

  // Debounced: js-yaml parses the whole document on every keystroke otherwise.
  useEffect(() => {
    if (!input.trim()) {
      setResult(IDLE);
      return;
    }

    const timer = setTimeout(() => {
      setResult(
        direction === 'yaml-to-json'
          ? yamlToJson(input, indent)
          : jsonToYaml(input, { indent, sortKeys })
      );
    }, 200);

    return () => clearTimeout(timer);
  }, [input, direction, indent, sortKeys]);

  // Offered, never applied automatically: silently flipping the direction while
  // someone is mid-paste is worse than a wrong-looking error.
  const mismatch = useMemo(() => {
    if (!input.trim() || result.ok) return false;
    return direction === 'yaml-to-json' ? !isProbablyYaml(input) : isProbablyYaml(input);
  }, [input, result.ok, direction]);

  const swapDirection = () => {
    const nextDirection: Direction = direction === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json';
    // A successful conversion becomes the input of the reverse one.
    if (result.ok && result.output) setInput(result.output);
    setDirection(nextDirection);
  };

  const sourceLabel = direction === 'yaml-to-json' ? 'YAML' : 'JSON';
  const targetLabel = direction === 'yaml-to-json' ? 'JSON' : 'YAML';
  const extension = direction === 'yaml-to-json' ? 'json' : 'yaml';

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={Braces}
          title="YAML and JSON Converter"
          description="Convert YAML to JSON and back, with anchors expanded and custom tags refused."
          badge={`${sourceLabel} to ${targetLabel}`}
        >
          <button onClick={swapDirection} className="btn btn-secondary btn-sm" title="Swap direction">
            <ArrowLeftRight size={13} />
            <span>Swap</span>
          </button>
          <button
            onClick={() => {
              setDirection('yaml-to-json');
              setInput(YAML_SAMPLE);
            }}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={13} />
            <span>Sample</span>
          </button>
          <button
            onClick={() => setInput('')}
            disabled={!input}
            className="btn btn-secondary btn-sm"
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
        </PageHeader>

        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Indent</span>
              <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setIndent(size)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      indent === size
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {direction === 'json-to-yaml' && (
              <button
                onClick={() => setSortKeys((on) => !on)}
                aria-pressed={sortKeys}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                  sortKeys
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-medium'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Sort keys
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleCopy(result.output, 'output')}
                disabled={!result.ok || !result.output}
                className="btn btn-secondary btn-sm"
              >
                {copiedKey === 'output' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>Copy {targetLabel}</span>
              </button>
              <button
                onClick={() => downloadTextFile(result.output, `converted.${extension}`)}
                disabled={!result.ok || !result.output}
                className="btn btn-secondary btn-sm"
              >
                <Download size={12} />
                <span>.{extension}</span>
              </button>
            </div>
          </div>

          {!result.ok && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2 shrink-0">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-mono">
                  {result.error}
                  {result.errorLine !== undefined ? ` (line ${result.errorLine})` : ''}
                </p>
                {mismatch && (
                  <button onClick={() => setDirection(direction === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json')} className="underline font-medium">
                    That input looks like {targetLabel}. Convert the other way instead.
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  {sourceLabel} in
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {input.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={direction === 'yaml-to-json' ? 'name: payments-api\nreplicas: 3' : '{ "name": "payments-api" }'}
                aria-label={`${sourceLabel} input`}
                spellCheck={false}
                className="flex-1 w-full min-h-[18rem] p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>

            <div className="card p-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  {targetLabel} out
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {result.output ? `${result.output.split('\n').length} lines` : ''}
                </span>
              </div>
              <textarea
                readOnly
                value={result.ok ? result.output : ''}
                placeholder="Result will appear here..."
                aria-label={`${targetLabel} output`}
                spellCheck={false}
                className="flex-1 w-full min-h-[18rem] p-4 bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1 shrink-0">
            Parsed with the JSON schema, so only plain data is built: a tag such as !!js/function is
            refused rather than evaluated. Comments are not part of the data model and are dropped by
            the conversion.
          </p>
        </div>
      </main>
    </div>
  );
}
