'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback } from '@/lib/clipboard';
import {
  Regex as RegexIcon,
  AlertCircle,
  Copy,
  Check,
  Replace,
} from 'lucide-react';
import {
  testRegex,
  describeFlags,
  toHighlightSegments,
  SUPPORTED_FLAGS,
  MAX_MATCHES,
  REGEX_PRESETS,
  type RegexResult,
} from '@/lib/regexTester';

const EMPTY: RegexResult = { valid: true, matches: [], matchCount: 0, truncated: false };

const SAMPLE = `Contact ops@devtools.test or sre@devtools.test
Deployed 2026-11-14 to 10.0.0.8 and 10.0.0.9
Trace id 4f1d9c2a-8b3e-4a21-9f55-7d0e6a1c3b88`;

export default function RegexTesterPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();

  const [pattern, setPattern] = useState('[\\w.+-]+@[\\w-]+\\.[\\w.]+');
  const [flags, setFlags] = useState('g');
  const [subject, setSubject] = useState(SAMPLE);
  const [replacement, setReplacement] = useState('');
  const [replaceOn, setReplaceOn] = useState(false);
  const [result, setResult] = useState<RegexResult>(EMPTY);

  // Debounced: a pattern mid-typing can be pathological, and this tool is
  // pointed at exactly those. The lib also caps matches and wall clock time.
  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(testRegex(pattern, flags, subject, replaceOn ? replacement : undefined));
    }, 180);
    return () => clearTimeout(timer);
  }, [pattern, flags, subject, replacement, replaceOn]);

  const segments = useMemo(
    () => (result.valid ? toHighlightSegments(subject, result.matches) : []),
    [subject, result]
  );

  const toggleFlag = (flag: string) => {
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, '') : `${current}${flag}`
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={RegexIcon}
          title="Regex Tester"
          description="Test a JavaScript regular expression against a subject, inspect capture groups, and preview a replacement."
          badge={result.valid ? `${result.matchCount}${result.truncated ? '+' : ''} matches` : 'Invalid'}
          badgeVariant={result.valid ? 'default' : 'warning'}
        >
          <button
            onClick={() => setReplaceOn((on) => !on)}
            className={`btn btn-sm ${replaceOn ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Replace size={13} />
            <span>Replace</span>
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Pattern */}
            <div className="card p-4 space-y-3">
              <div className="flex items-stretch gap-2">
                <span className="flex items-center px-2 font-mono text-sm text-neutral-400 select-none">/</span>
                <input
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  placeholder="\\d{4}-\\d{2}-\\d{2}"
                  spellCheck={false}
                  aria-label="Regular expression pattern"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-neutral-100/10 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
                <span className="flex items-center px-1 font-mono text-sm text-neutral-400 select-none">/</span>
                <div className="flex items-center gap-1">
                  {SUPPORTED_FLAGS.map((flag) => (
                    <button
                      key={flag}
                      onClick={() => toggleFlag(flag)}
                      title={describeFlags(flag)[0]}
                      className={`w-7 h-7 rounded-lg border font-mono text-xs transition-colors ${
                        flags.includes(flag)
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                          : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {REGEX_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setPattern(preset.pattern);
                      setFlags(preset.flags);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {!result.valid && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-mono">{result.error}</span>
                </div>
              )}

              {describeFlags(flags).length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {describeFlags(flags).map((description) => (
                    <li key={description} className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {replaceOn && (
              <div className="card p-4 space-y-2">
                <label htmlFor="replacement" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Replacement
                </label>
                <input
                  id="replacement"
                  value={replacement}
                  onChange={(event) => setReplacement(event.target.value)}
                  placeholder="$1 or [redacted]"
                  spellCheck={false}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-neutral-100/10 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  $1 to $9 insert capture groups, $&amp; the whole match. Without the g flag only the
                  first match is replaced.
                </p>
                {result.replaced !== undefined && (
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                      {result.replaced}
                    </pre>
                    <button
                      onClick={() => handleCopy(result.replaced ?? '', 'replaced')}
                      className="absolute top-2 right-2 btn btn-secondary btn-sm"
                    >
                      {copiedKey === 'replaced' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>Copy</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subject and matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-0 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                    Subject
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {subject.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Paste the text to match against..."
                  aria-label="Subject text"
                  spellCheck={false}
                  className="w-full h-48 p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                />
                <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-950/50 max-h-48 overflow-auto">
                  <div className="text-[10px] font-mono text-neutral-400 mb-1.5">Highlighted</div>
                  <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-neutral-700 dark:text-neutral-300">
                    {segments.map((segment, index) =>
                      segment.isMatch ? (
                        <mark
                          key={index}
                          className="bg-amber-200 dark:bg-amber-500/30 text-neutral-900 dark:text-amber-100 rounded px-0.5"
                        >
                          {segment.text}
                        </mark>
                      ) : (
                        <span key={index}>{segment.text}</span>
                      )
                    )}
                  </p>
                </div>
              </div>

              <div className="card p-0 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                    Matches
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {result.matchCount}
                    {result.truncated ? ` (capped at ${MAX_MATCHES})` : ''}
                  </span>
                </div>

                {result.matches.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    {result.valid ? 'No matches yet.' : 'Fix the pattern to see matches.'}
                  </div>
                ) : (
                  <ol className="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-auto max-h-[25rem]">
                    {result.matches.map((match, index) => (
                      <li key={`${match.index}-${index}`} className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-400 w-8 shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate select-all">
                            {match.value === '' ? '(empty match)' : match.value}
                          </span>
                          <span className="ml-auto font-mono text-[10px] text-neutral-400 shrink-0">
                            @{match.index}
                          </span>
                        </div>

                        {match.groups.length > 0 && (
                          <div className="pl-10 space-y-0.5">
                            {match.groups.map((group, groupIndex) => (
                              <div key={groupIndex} className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span className="text-neutral-400">${groupIndex + 1}</span>{' '}
                                {group === undefined ? <em>did not participate</em> : group}
                              </div>
                            ))}
                          </div>
                        )}

                        {Object.keys(match.named).length > 0 && (
                          <div className="pl-10 space-y-0.5">
                            {Object.entries(match.named).map(([name, value]) => (
                              <div key={name} className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span className="text-neutral-400">{name}</span>{' '}
                                {value === undefined ? <em>did not participate</em> : value}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              Matching runs in your browser with the engine your browser ships, so what you see here
              is what your JavaScript code will do. The search stops after {MAX_MATCHES} matches or
              three quarters of a second, which keeps a catastrophically backtracking pattern from
              freezing the tab.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
