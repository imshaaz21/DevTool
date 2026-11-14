'use client';

import { useState, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback } from '@/lib/clipboard';
import { checkUpload, ENV_UPLOAD_RULE } from '@/lib/fileGuards';
import {
  FileKey,
  Copy,
  Check,
  Upload,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  parseEnv,
  maskSecrets,
  isSecretKey,
  toJson,
  toShellExport,
  toDockerArgs,
  toYamlEnv,
} from '@/lib/envParser';

type OutputFormat = 'json' | 'shell' | 'docker' | 'yaml';

const FORMATS: Array<{ id: OutputFormat; label: string }> = [
  { id: 'json', label: 'JSON' },
  { id: 'shell', label: 'Shell' },
  { id: 'docker', label: 'Docker' },
  { id: 'yaml', label: 'YAML' },
];

const SAMPLE = `# Service configuration
NODE_ENV=production
PORT=3000
export API_URL=https://api.devtools.test
DB_PASSWORD="s3cr3t value"
JWT_SECRET='literal\\nnot-a-newline'
LOG_LEVEL=info # verbose in staging
FEATURE_FLAGS=a,b,c
`;

export default function EnvParserPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();
  const fileInput = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [format, setFormat] = useState<OutputFormat>('json');
  const [masked, setMasked] = useState(true);

  const parsed = useMemo(() => parseEnv(text), [text]);
  const entries = useMemo(
    () => (masked ? maskSecrets(parsed.entries) : parsed.entries),
    [masked, parsed.entries]
  );

  const output = useMemo(() => {
    if (entries.length === 0) return '';
    if (format === 'json') return toJson(entries);
    if (format === 'shell') return toShellExport(entries);
    if (format === 'docker') return toDockerArgs(entries);
    return toYamlEnv(entries);
  }, [entries, format]);

  const readFile = (file: File | undefined) => {
    if (!file) return;

    const guard = checkUpload(file, ENV_UPLOAD_RULE);
    if (!guard.ok) {
      toast.error(guard.error ?? 'That file cannot be read here.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.onerror = () => toast.error('That file could not be read.');
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={FileKey}
          title=".env Parser"
          description="Parse a dotenv file into structured values, spot duplicates and bad lines, and export it as JSON, shell, Docker or YAML."
          badge={`${parsed.entries.length} keys`}
        >
          <button
            onClick={() => setMasked((on) => !on)}
            aria-pressed={masked}
            className={`btn btn-sm ${masked ? 'btn-primary' : 'btn-secondary'}`}
            title={masked ? 'Secret values are hidden' : 'Secret values are shown'}
          >
            {masked ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{masked ? 'Masked' : 'Revealed'}</span>
          </button>

          <input
            ref={fileInput}
            type="file"
            accept=".env,.txt,.properties,.conf,.ini,text/plain"
            className="hidden"
            onChange={(event) => {
              readFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <button onClick={() => fileInput.current?.click()} className="btn btn-secondary btn-sm">
            <Upload size={13} />
            <span>Open file</span>
          </button>
          <button onClick={() => setText(SAMPLE)} className="btn btn-secondary btn-sm">
            Sample
          </button>
          <button
            onClick={() => setText('')}
            disabled={!text}
            className="btn btn-secondary btn-sm"
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div
                className="card p-0 flex flex-col overflow-hidden"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  readFile(event.dataTransfer.files?.[0]);
                }}
              >
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                    .env in
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    drop a file or paste
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="KEY=value"
                  aria-label="Dotenv file contents"
                  spellCheck={false}
                  className="w-full h-72 p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>

              <div className="card p-0 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-2">
                  <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                    {FORMATS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFormat(option.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          format === option.id
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCopy(output, 'output')}
                    disabled={!output}
                    className="btn btn-secondary btn-sm"
                  >
                    {copiedKey === 'output' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={output}
                  placeholder="Converted output will appear here..."
                  aria-label="Converted output"
                  spellCheck={false}
                  className="w-full h-72 p-4 bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
              </div>
            </div>

            {(parsed.problems.length > 0 || parsed.duplicates.length > 0) && (
              <div className="card p-4 space-y-2 border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={14} />
                  <span>Worth a look</span>
                </div>
                {parsed.duplicates.length > 0 && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    Defined more than once, so the last line wins:{' '}
                    <span className="font-mono">{parsed.duplicates.join(', ')}</span>
                  </p>
                )}
                {parsed.problems.map((problem) => (
                  <p key={`${problem.line}-${problem.reason}`} className="text-xs text-neutral-700 dark:text-neutral-300">
                    <span className="font-mono text-neutral-400">line {problem.line}</span>{' '}
                    {problem.reason}
                  </p>
                ))}
              </div>
            )}

            {parsed.entries.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                    Variables
                  </span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-96 overflow-auto">
                  {entries.map((entry) => (
                    <div
                      key={`${entry.key}-${entry.line}`}
                      className="px-4 py-2 flex items-center gap-3 text-xs"
                    >
                      <span className="font-mono text-[10px] text-neutral-400 w-8 text-right shrink-0">
                        {entry.line}
                      </span>
                      <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[14rem]">
                        {entry.key}
                      </span>
                      {isSecretKey(entry.key) && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 shrink-0">
                          secret
                        </span>
                      )}
                      {entry.exported && (
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">export</span>
                      )}
                      <span className="font-mono text-neutral-600 dark:text-neutral-400 truncate flex-1">
                        {entry.value === '' ? <em className="text-neutral-400">empty</em> : entry.value}
                      </span>
                      {entry.comment && (
                        <span className="text-[11px] text-neutral-400 truncate max-w-[12rem] hidden sm:inline">
                          # {entry.comment}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              Parsing happens in your browser and nothing is uploaded, but a real .env holds live
              credentials: secret looking keys are masked by default, and rotating anything you paste
              into any tool is still the safer habit.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
