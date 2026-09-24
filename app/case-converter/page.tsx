'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { CustomSelect } from '@/components/CustomSelect';
import {
  CaseSensitive,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Download,
  ArrowRight,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Filter,
  CheckCheck,
  Code2,
  FileText,
  Replace,
  Settings2,
} from 'lucide-react';
import {
  CASE_OPTIONS,
  CaseType,
  convertCase,
  replaceSpacesWith,
  removeAllSpaces,
  collapseWhitespace,
  replaceUnderscoresWithSpaces,
  replaceHyphensWithSpaces,
  removeSpecialChars,
  trimLines,
  removeEmptyLines,
  removeDuplicateLines,
  sortLines,
  batchConvert,
  getTextStats,
} from '@/lib/caseConverter';

const SAMPLE_SINGLE = 'user_account_profile_settings';
const SAMPLE_MULTILINE = `user_id
first_name
last_name
email_address
phone_number
created_at
is_account_active`;

const SAMPLE_ENV_VARS = `DATABASE_URL
REDIS_CACHE_HOST
AUTH_JWT_SECRET_KEY
MAX_RETRY_ATTEMPTS
API_TIMEOUT_SECONDS`;

type ViewMode = 'matrix' | 'batch' | 'cleaner';

export default function CaseConverterPage() {
  const { isCollapsed } = useSidebar();

  // Navigation mode
  const [activeMode, setActiveMode] = useState<ViewMode>('matrix');

  // Single Input state (Matrix mode)
  const [singleInput, setSingleInput] = useState<string>(SAMPLE_SINGLE);
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [caseSearch, setCaseSearch] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Batch Mode states
  const [batchInput, setBatchInput] = useState<string>(SAMPLE_MULTILINE);
  const [targetCase, setTargetCase] = useState<CaseType | 'none'>('camelCase');
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [quoteStyle, setQuoteStyle] = useState<'none' | 'single' | 'double' | 'backtick'>('none');
  const [delimiter, setDelimiter] = useState<'newline' | 'comma' | 'comma-space' | 'semicolon' | 'pipe'>('newline');
  const [wrapper, setWrapper] = useState<'none' | 'array' | 'sql' | 'curly'>('none');
  const [autoTrim, setAutoTrim] = useState<boolean>(true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(true);
  const [deduplicate, setDeduplicate] = useState<boolean>(false);
  const [batchSort, setBatchSort] = useState<'none' | 'asc' | 'desc'>('none');

  // Cleaner / Replace tool states
  const [cleanerInput, setCleanerInput] = useState<string>(SAMPLE_MULTILINE);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(true);

  // Copy handler
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Download handler
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered case cards for Matrix view
  const filteredCases = useMemo(() => {
    return CASE_OPTIONS.filter((opt) => {
      if (caseFilter !== 'all' && opt.category !== caseFilter) return false;
      if (caseSearch.trim()) {
        const q = caseSearch.toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          opt.badge.toLowerCase().includes(q) ||
          opt.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [caseFilter, caseSearch]);

  // Batch output calculation
  const batchOutput = useMemo(() => {
    let raw = batchInput;
    if (batchSort !== 'none') {
      raw = sortLines(raw, batchSort);
    }
    return batchConvert(raw, {
      caseType: targetCase,
      prefix,
      suffix,
      quote: quoteStyle,
      delimiter,
      wrapper,
      removeEmpty,
      trim: autoTrim,
      deduplicate,
    });
  }, [
    batchInput,
    targetCase,
    prefix,
    suffix,
    quoteStyle,
    delimiter,
    wrapper,
    removeEmpty,
    autoTrim,
    deduplicate,
    batchSort,
  ]);

  // Statistics
  const singleStats = useMemo(() => getTextStats(singleInput), [singleInput]);
  const batchInputStats = useMemo(() => getTextStats(batchInput), [batchInput]);
  const batchOutputStats = useMemo(() => getTextStats(batchOutput), [batchOutput]);
  const cleanerStats = useMemo(() => getTextStats(cleanerInput), [cleanerInput]);

  // Quick single transforms
  const applySingleTransform = (type: string) => {
    switch (type) {
      case 'spaces_to_underscores':
        setSingleInput((prev) => replaceSpacesWith(prev, '_'));
        break;
      case 'spaces_to_hyphens':
        setSingleInput((prev) => replaceSpacesWith(prev, '-'));
        break;
      case 'underscores_to_spaces':
        setSingleInput((prev) => replaceUnderscoresWithSpaces(prev));
        break;
      case 'hyphens_to_spaces':
        setSingleInput((prev) => replaceHyphensWithSpaces(prev));
        break;
      case 'remove_spaces':
        setSingleInput((prev) => removeAllSpaces(prev));
        break;
      case 'collapse_spaces':
        setSingleInput((prev) => collapseWhitespace(prev));
        break;
      case 'clean_special':
        setSingleInput((prev) => removeSpecialChars(prev, true));
        break;
      case 'upper':
        setSingleInput((prev) => prev.toUpperCase());
        break;
      case 'lower':
        setSingleInput((prev) => prev.toLowerCase());
        break;
      default:
        break;
    }
  };

  // Cleaner apply find & replace
  const handleApplyFindReplace = () => {
    if (!findText) return;
    try {
      const flags = isCaseSensitive ? 'g' : 'gi';
      const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, flags);
      setCleanerInput((prev) => prev.replace(regex, replaceText));
    } catch {
      // Fallback simple replace
      setCleanerInput((prev) => prev.split(findText).join(replaceText));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={CaseSensitive}
          title="Text & Case Studio"
          description="Convert programming cases (camelCase, snake_case, CONSTANT_CASE), manipulate spaces and delimiters, and batch format text."
          badge="Developer Utilities"
        >
          {activeMode === 'matrix' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSingleInput(SAMPLE_SINGLE)}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
                title="Load sample variable"
              >
                <Sparkles size={13} className="text-neutral-500 dark:text-neutral-400" />
                <span>Sample</span>
              </button>
              <button
                onClick={() => setSingleInput('')}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                title="Clear input"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          )}

          {activeMode === 'batch' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBatchInput(SAMPLE_MULTILINE)}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
                title="Load DB columns"
              >
                <Sparkles size={13} className="text-neutral-500" />
                <span>DB Columns</span>
              </button>
              <button
                onClick={() => setBatchInput(SAMPLE_ENV_VARS)}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
                title="Load Env Vars"
              >
                <Code2 size={13} className="text-neutral-500" />
                <span>Env Vars</span>
              </button>
              <button
                onClick={() => handleCopy(batchOutput, 'batch_all')}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                title="Copy batch output"
              >
                {copiedKey === 'batch_all' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'batch_all' ? 'Copied!' : 'Copy Result'}</span>
              </button>
            </div>
          )}
        </PageHeader>

        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Mode Navigation Tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
              <button
                onClick={() => setActiveMode('matrix')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  activeMode === 'matrix'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <CaseSensitive size={14} />
                <span>All Cases Matrix</span>
              </button>

              <button
                onClick={() => setActiveMode('batch')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  activeMode === 'batch'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <FileText size={14} />
                <span>Batch & Multi-Line</span>
              </button>

              <button
                onClick={() => setActiveMode('cleaner')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  activeMode === 'cleaner'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Replace size={14} />
                <span>Delimiters & Cleaner</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              {activeMode === 'matrix' && (
                <span>
                  {singleStats.characters} chars • {singleStats.words} words
                </span>
              )}
              {activeMode === 'batch' && (
                <span>
                  {batchInputStats.lines} lines in • {batchOutputStats.lines} lines out
                </span>
              )}
            </div>
          </div>

          {/* TAB 1: ALL CASES MATRIX */}
          {activeMode === 'matrix' && (
            <div className="space-y-6">
              {/* Input Card with live action toolbar */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <span>Input Text / Identifier</span>
                  </label>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Live Auto-Transforming across {CASE_OPTIONS.length} case conventions
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    placeholder="Enter any text, variable, database column, or sentence..."
                    rows={2}
                    className="w-full text-sm font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-none transition-colors"
                  />
                  {singleInput && (
                    <button
                      onClick={() => setSingleInput('')}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                      title="Clear input"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Quick Transformation Badges/Buttons */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-neutral-400 mr-1">Quick Actions:</span>
                  <button
                    onClick={() => applySingleTransform('spaces_to_underscores')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Spaces ➔ _
                  </button>
                  <button
                    onClick={() => applySingleTransform('spaces_to_hyphens')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Spaces ➔ -
                  </button>
                  <button
                    onClick={() => applySingleTransform('underscores_to_spaces')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    _ ➔ Spaces
                  </button>
                  <button
                    onClick={() => applySingleTransform('hyphens_to_spaces')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    - ➔ Spaces
                  </button>
                  <button
                    onClick={() => applySingleTransform('remove_spaces')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Remove Spaces
                  </button>
                  <button
                    onClick={() => applySingleTransform('collapse_spaces')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Collapse Spaces
                  </button>
                  <button
                    onClick={() => applySingleTransform('clean_special')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Strip Symbols
                  </button>
                  <button
                    onClick={() => applySingleTransform('upper')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    UPPERCASE
                  </button>
                  <button
                    onClick={() => applySingleTransform('lower')}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    lowercase
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs w-full sm:w-auto">
                  {(['all', 'code', 'separator', 'text', 'special'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCaseFilter(cat)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                        caseFilter === cat
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Search cases..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                </div>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCases.map((opt) => {
                  const transformed = convertCase(singleInput, opt.id);
                  const isCopied = copiedKey === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleCopy(transformed, opt.id)}
                      className="group bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl p-3.5 shadow-xs transition-all cursor-pointer relative flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {opt.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
                            {opt.badge}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(transformed, opt.id);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isCopied
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                          title={`Copy ${opt.label}`}
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Transformed Output */}
                      <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-100 break-all select-all min-h-[42px] flex items-center">
                        {transformed || <span className="text-neutral-400 dark:text-neutral-600 italic">Empty output</span>}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                        <span className="truncate">{opt.description}</span>
                        <span className="font-mono text-[10px] shrink-0 ml-2">{transformed.length} chars</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BATCH & MULTI-LINE */}
          {activeMode === 'batch' && (
            <div className="space-y-4">
              {/* Batch Options Bar */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Batch Transformation Configuration
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Format lists of SQL columns, DTOs, or Enums
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  {/* Target Case Selector */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Target Case</label>
                    <CustomSelect
                      value={targetCase}
                      onChange={(val) => setTargetCase(val as CaseType | 'none')}
                      options={[
                        { label: 'camelCase (JS/TS)', value: 'camelCase' },
                        { label: 'PascalCase (React/Classes)', value: 'pascalCase' },
                        { label: 'snake_case (Python/DB)', value: 'snakeCase' },
                        { label: 'CONSTANT_CASE (Env/Enum)', value: 'constantCase' },
                        { label: 'kebab-case (CSS/URLs)', value: 'kebabCase' },
                        { label: 'SCREAMING-KEBAB', value: 'screamingKebabCase' },
                        { label: 'dot.case (Properties)', value: 'dotCase' },
                        { label: 'path/case (Files)', value: 'pathCase' },
                        { label: 'Title Case (Headers)', value: 'titleCase' },
                        { label: 'Sentence case', value: 'sentenceCase' },
                        { label: 'UPPERCASE', value: 'upperCase' },
                        { label: 'lowercase', value: 'lowerCase' },
                        { label: 'URL slug', value: 'slug' },
                        { label: 'None (Keep Original Case)', value: 'none' },
                      ]}
                    />
                  </div>

                  {/* Prefix */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Prefix</label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="e.g. is_, get, I"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                    />
                  </div>

                  {/* Suffix */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Suffix</label>
                    <input
                      type="text"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="e.g. DTO, _id, ;"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                    />
                  </div>

                  {/* Quote Style */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Quotes</label>
                    <CustomSelect
                      value={quoteStyle}
                      onChange={(val) => setQuoteStyle(val as any)}
                      options={[
                        { label: 'None', value: 'none' },
                        { label: "Single Quote ('val')", value: 'single' },
                        { label: 'Double Quote ("val")', value: 'double' },
                        { label: 'Backtick (`val`)', value: 'backtick' },
                      ]}
                    />
                  </div>

                  {/* Delimiter */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Delimiter</label>
                    <CustomSelect
                      value={delimiter}
                      onChange={(val) => setDelimiter(val as any)}
                      options={[
                        { label: 'Newline (\\n)', value: 'newline' },
                        { label: 'Comma (,)', value: 'comma' },
                        { label: 'Comma + Space (, )', value: 'comma-space' },
                        { label: 'Semicolon (;)', value: 'semicolon' },
                        { label: 'Pipe ( | )', value: 'pipe' },
                      ]}
                    />
                  </div>
                </div>

                {/* Toggles row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={autoTrim}
                        onChange={(e) => setAutoTrim(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                      />
                      <span>Trim lines</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={removeEmpty}
                        onChange={(e) => setRemoveEmpty(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                      />
                      <span>Remove empty</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={deduplicate}
                        onChange={(e) => setDeduplicate(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                      />
                      <span>Deduplicate</span>
                    </label>

                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-neutral-400">Wrapper:</span>
                      {(['none', 'array', 'sql', 'curly'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWrapper(w)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            wrapper === w
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                          }`}
                        >
                          {w === 'none' ? 'None' : w === 'array' ? '[ ]' : w === 'sql' ? '( )' : '{ }'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Sort:</span>
                    {(['none', 'asc', 'desc'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBatchSort(s)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          batchSort === s
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        {s === 'none' ? 'Off' : s === 'asc' ? 'A ➔ Z' : 'Z ➔ A'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Batch Input and Output */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Input Panel */}
                <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Input Lines
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {batchInputStats.lines} lines • {batchInputStats.words} words
                    </span>
                  </div>

                  <textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder="Paste database columns, variables, or words here (one per line)..."
                    rows={16}
                    className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-y transition-colors leading-relaxed"
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => setBatchInput('')}
                      className="text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Clear Input</span>
                    </button>
                    <button
                      onClick={() => setBatchInput(SAMPLE_MULTILINE)}
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles size={13} />
                      <span>Reset Sample</span>
                    </button>
                  </div>
                </div>

                {/* Output Panel */}
                <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Formatted Output
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-400">
                        {batchOutputStats.lines} lines • {batchOutputStats.characters} chars
                      </span>
                    </div>
                  </div>

                  <textarea
                    readOnly
                    value={batchOutput}
                    placeholder="Transformed results will appear here..."
                    rows={16}
                    className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 focus:outline-none resize-y leading-relaxed select-all"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDownload(batchOutput, 'transformed-text.txt')}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <Download size={13} />
                      <span>Download .txt</span>
                    </button>

                    <button
                      onClick={() => handleCopy(batchOutput, 'batch_panel')}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition-opacity"
                    >
                      {copiedKey === 'batch_panel' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'batch_panel' ? 'Copied Output!' : 'Copy Transformed'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DELIMITERS & CLEANER */}
          {activeMode === 'cleaner' && (
            <div className="space-y-4">
              {/* Find & Replace Bar */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Replace size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Find & Replace / Delimiter Rewriter
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Replace custom characters, strip whitespace, or clean symbols
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end">
                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Find text / character</label>
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="e.g. _ or space or foo"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-neutral-600 dark:text-neutral-400">Replace with</label>
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="e.g. - or space or bar"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                    />
                  </div>

                  <div className="flex items-center gap-2 h-9">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={isCaseSensitive}
                        onChange={(e) => setIsCaseSensitive(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                      />
                      <span>Case Sensitive</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyFindReplace}
                      disabled={!findText}
                      className="w-full h-9 flex items-center justify-center gap-1.5 px-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Replace size={13} />
                      <span>Replace All</span>
                    </button>
                  </div>
                </div>

                {/* Instant Transformation Buttons */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-neutral-400 mr-1">One-Click Transforms:</span>
                  <button
                    onClick={() => setCleanerInput((prev) => replaceSpacesWith(prev, '_'))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Spaces ➔ _ (Underscore)
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => replaceSpacesWith(prev, '-'))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Spaces ➔ - (Hyphen)
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => replaceUnderscoresWithSpaces(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    _ ➔ Spaces
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => replaceHyphensWithSpaces(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    - ➔ Spaces
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => removeAllSpaces(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Strip All Spaces
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => collapseWhitespace(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Collapse Extra Spaces
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => trimLines(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Trim Line Spaces
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => removeEmptyLines(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Remove Empty Lines
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => removeDuplicateLines(prev))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Remove Duplicates
                  </button>
                  <button
                    onClick={() => setCleanerInput((prev) => removeSpecialChars(prev, true))}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    Strip Special Characters
                  </button>
                </div>
              </div>

              {/* Editor area */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Text Canvas
                  </label>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {cleanerStats.lines} lines • {cleanerStats.characters} characters • {cleanerStats.words} words
                  </span>
                </div>

                <textarea
                  value={cleanerInput}
                  onChange={(e) => setCleanerInput(e.target.value)}
                  placeholder="Paste or type text to clean, format, and replace..."
                  rows={16}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-y leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCleanerInput('')}
                      className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Clear Canvas</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(cleanerInput, 'cleaned-text.txt')}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleCopy(cleanerInput, 'cleaner_copy')}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition-opacity"
                    >
                      {copiedKey === 'cleaner_copy' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'cleaner_copy' ? 'Copied Canvas!' : 'Copy Canvas'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
