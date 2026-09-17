'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { CustomSelect } from '@/components/CustomSelect';
import {
  GitCompare,
  Copy,
  Check,
  Trash2,
  ArrowLeftRight,
  Download,
  Filter,
  Sparkles,
  Search,
  Layers,
  AlertCircle,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';
import {
  parseList,
  analyzeList,
  compareLists,
  formatListOutput,
  QuoteOption,
  WrapperOption,
  SortOption,
  DelimiterOption,
} from '@/lib/listCompare';

const SAMPLE_LIST_A = `INV-S2026082369196656919665
INV-S2026082770727072704
INV-S2026082569839346983934
INV-S2026081165646936564693
INV-S2026082369196656919665`;

const SAMPLE_LIST_B = `INV-S2026080262608796260879
INV-S2026081165646936564693
INV-S2026081165647156564715
INV-S2026082569839346983934
INV-S2026081065269676526967
INV-S2026080262798366279836
INV-S2026083071488547148854
INV-S2026081165643866564386
INV-S2026082971190407119040
INV-S2026082570040307004030
INV-S2026082870974027097402
INV-S2026083071791137179113
INV-S2026082971175547117554`;

type ResultTab = 'common' | 'onlyA' | 'onlyB' | 'union' | 'symmetricDiff' | 'dupesA' | 'dupesB';

export default function ListComparePage() {
  const { isCollapsed } = useSidebar();

  // Input states
  const [listAText, setListAText] = useState('');
  const [listBText, setListBText] = useState('');

  // Parsing & options
  const [inputDelimiter, setInputDelimiter] = useState<DelimiterOption>('auto');
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [stripQuotes, setStripQuotes] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('none');

  // Output formatting options
  const [quoteStyle, setQuoteStyle] = useState<QuoteOption>('single');
  const [outputDelimiter, setOutputDelimiter] = useState<string>(', ');
  const [wrapper, setWrapper] = useState<WrapperOption>('none');

  // Active view tab & search filter
  const [activeTab, setActiveTab] = useState<ResultTab>('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Parse inputs
  const parsedA = useMemo(() => {
    return parseList(listAText, {
      delimiter: inputDelimiter,
      trim: trimWhitespace,
      stripQuotes,
      ignoreEmpty: true,
    });
  }, [listAText, inputDelimiter, trimWhitespace, stripQuotes]);

  const parsedB = useMemo(() => {
    return parseList(listBText, {
      delimiter: inputDelimiter,
      trim: trimWhitespace,
      stripQuotes,
      ignoreEmpty: true,
    });
  }, [listBText, inputDelimiter, trimWhitespace, stripQuotes]);

  // Analyze inputs (total, unique, duplicates)
  const analysisA = useMemo(() => analyzeList(parsedA, caseSensitive), [parsedA, caseSensitive]);
  const analysisB = useMemo(() => analyzeList(parsedB, caseSensitive), [parsedB, caseSensitive]);

  // Compare results
  const compareResult = useMemo(() => {
    return compareLists(parsedA, parsedB, {
      caseSensitive,
      sort: sortOption,
    });
  }, [parsedA, parsedB, caseSensitive, sortOption]);

  // Determine items for current tab
  const currentTabItems = useMemo(() => {
    switch (activeTab) {
      case 'common':
        return compareResult.common;
      case 'onlyA':
        return compareResult.onlyA;
      case 'onlyB':
        return compareResult.onlyB;
      case 'union':
        return compareResult.union;
      case 'symmetricDiff':
        return compareResult.symmetricDiff;
      case 'dupesA':
        return analysisA.duplicates.map((d) => `${d.value} (${d.count}x)`);
      case 'dupesB':
        return analysisB.duplicates.map((d) => `${d.value} (${d.count}x)`);
      default:
        return [];
    }
  }, [activeTab, compareResult, analysisA, analysisB]);

  // Filter items in current tab
  const filteredTabItems = useMemo(() => {
    if (!searchQuery.trim()) return currentTabItems;
    const q = searchQuery.toLowerCase();
    return currentTabItems.filter((item) => item.toLowerCase().includes(q));
  }, [currentTabItems, searchQuery]);

  // Formatted output text for current tab
  const formattedOutput = useMemo(() => {
    // For duplicates tabs, format raw values without occurrence counter if requested
    const itemsToFormat =
      activeTab === 'dupesA'
        ? analysisA.duplicates.map((d) => d.value)
        : activeTab === 'dupesB'
        ? analysisB.duplicates.map((d) => d.value)
        : currentTabItems;

    return formatListOutput(itemsToFormat, {
      quote: quoteStyle,
      delimiter: outputDelimiter,
      wrapper,
    });
  }, [activeTab, currentTabItems, analysisA, analysisB, quoteStyle, outputDelimiter, wrapper]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Download file helper
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

  // Quick action: load sample
  const handleLoadSample = () => {
    setListAText(SAMPLE_LIST_A);
    setListBText(SAMPLE_LIST_B);
  };

  // Quick action: clear all
  const handleClearAll = () => {
    setListAText('');
    setListBText('');
    setSearchQuery('');
  };

  // Quick action: swap lists
  const handleSwapLists = () => {
    const temp = listAText;
    setListAText(listBText);
    setListBText(temp);
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
          icon={GitCompare}
          title="List Compare & Formatter"
          description="Diff two lists, deduplicate, find common values, and format with single/double quotes for SQL, JSON & code."
          badge="Set Operations"
        >
          <button
            onClick={handleLoadSample}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Load sample invoice IDs from test suite"
          >
            <Sparkles size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={handleSwapLists}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Swap List A and List B"
          >
            <ArrowLeftRight size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Swap Lists</span>
          </button>
          <button
            onClick={handleClearAll}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear both lists"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </PageHeader>

        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Options & Formatting Control Bar */}
          <section className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Formatting & Parsing Configuration
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                A: {analysisA.unique.length} unique • B: {analysisB.unique.length} unique
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Quote Style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  Quote Style
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuoteStyle('none')}
                    className={`py-1 rounded font-mono text-[11px] transition-colors ${
                      quoteStyle === 'none'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    title="No quotes (plain text)"
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteStyle('single')}
                    className={`py-1 rounded font-mono text-[11px] transition-colors ${
                      quoteStyle === 'single'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    title="Single quotes ('val') - ideal for SQL IN clauses"
                  >
                    ' '
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteStyle('double')}
                    className={`py-1 rounded font-mono text-[11px] transition-colors ${
                      quoteStyle === 'double'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    title='Double quotes ("val") - ideal for JSON & code'
                  >
                    " "
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteStyle('backtick')}
                    className={`py-1 rounded font-mono text-[11px] transition-colors ${
                      quoteStyle === 'backtick'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    title="Backtick quotes (`val`)"
                  >
                    ` `
                  </button>
                </div>
              </div>

              {/* Output Delimiter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Delimiter
                </label>
                <CustomSelect
                  value={outputDelimiter}
                  onChange={(val) => setOutputDelimiter(val)}
                  options={[
                    { label: 'Comma + Space ( ,  )', value: ', ' },
                    { label: 'Comma Only ( , )', value: ',' },
                    { label: 'Newline ( \\n )', value: '\n' },
                    { label: 'Semicolon ( ;  )', value: '; ' },
                    { label: 'Pipe ( | )', value: ' | ' },
                    { label: 'Space (   )', value: ' ' },
                  ]}
                />
              </div>

              {/* Wrapper / SQL IN clause */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Enclosure Wrapper
                </label>
                <CustomSelect
                  value={wrapper}
                  onChange={(val) => setWrapper(val as WrapperOption)}
                  options={[
                    { label: 'None (Plain)', value: 'none' },
                    { label: 'SQL IN ( ... )', value: 'sql' },
                    { label: 'JSON Array [ ... ]', value: 'array' },
                    { label: 'Set Braces { ... }', value: 'braces' },
                  ]}
                />
              </div>

              {/* Sorting */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Sorting
                </label>
                <CustomSelect
                  value={sortOption}
                  onChange={(val) => setSortOption(val as SortOption)}
                  options={[
                    { label: 'Preserve Input Order', value: 'none' },
                    { label: 'Alphabetical (A → Z)', value: 'asc' },
                    { label: 'Reverse (Z → A)', value: 'desc' },
                    { label: 'Numeric Sort', value: 'numeric' },
                  ]}
                />
              </div>

              {/* Options & Flags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Comparison Settings
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      caseSensitive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Toggle case-sensitive comparison (e.g. ABC vs abc)"
                  >
                    {caseSensitive ? 'Case: Sensitive' : 'Case: Insensitive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStripQuotes(!stripQuotes)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      stripQuotes
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Automatically strip quotes from inputs when pasting"
                  >
                    Strip Input Quotes
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Two Input Lists Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List A (Source) */}
            <div className="flex flex-col bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    List A (Source)
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {analysisA.total} items
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {analysisA.unique.length} unique
                    </span>
                    {analysisA.duplicates.length > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 cursor-pointer"
                        onClick={() => setActiveTab('dupesA')}
                        title="Click to view duplicate items in List A"
                      >
                        <AlertCircle size={10} />
                        {analysisA.duplicates.length} dupes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(listAText, 'copy-input-a')}
                    disabled={!listAText}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 disabled:opacity-40 transition-colors"
                    title="Copy List A"
                  >
                    {copiedKey === 'copy-input-a' ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    onClick={() => setListAText('')}
                    disabled={!listAText}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-red-500 disabled:opacity-40 transition-colors"
                    title="Clear List A"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <textarea
                value={listAText}
                onChange={(e) => setListAText(e.target.value)}
                placeholder="Paste items (one per line, comma-separated, or raw text)...&#10;e.g.&#10;INV-001&#10;INV-002&#10;INV-003"
                className="w-full h-56 p-3 text-xs font-mono bg-transparent border-0 focus:ring-0 resize-y outline-none leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                spellCheck={false}
              />
            </div>

            {/* List B (Target) */}
            <div className="flex flex-col bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    List B (Target)
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {analysisB.total} items
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {analysisB.unique.length} unique
                    </span>
                    {analysisB.duplicates.length > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 cursor-pointer"
                        onClick={() => setActiveTab('dupesB')}
                        title="Click to view duplicate items in List B"
                      >
                        <AlertCircle size={10} />
                        {analysisB.duplicates.length} dupes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(listBText, 'copy-input-b')}
                    disabled={!listBText}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 disabled:opacity-40 transition-colors"
                    title="Copy List B"
                  >
                    {copiedKey === 'copy-input-b' ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    onClick={() => setListBText('')}
                    disabled={!listBText}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-red-500 disabled:opacity-40 transition-colors"
                    title="Clear List B"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <textarea
                value={listBText}
                onChange={(e) => setListBText(e.target.value)}
                placeholder="Paste items (one per line, comma-separated, or raw text)...&#10;e.g.&#10;INV-002&#10;INV-003&#10;INV-004"
                className="w-full h-56 p-3 text-xs font-mono bg-transparent border-0 focus:ring-0 resize-y outline-none leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Set Operations / Results Section */}
          <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Interactive Tab Badges */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50/60 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
              {/* Common (A ∩ B) */}
              <button
                type="button"
                onClick={() => setActiveTab('common')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'common'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>Common in Both (A ∩ B)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {compareResult.common.length}
                </span>
              </button>

              {/* Only in List A (A - B) */}
              <button
                type="button"
                onClick={() => setActiveTab('onlyA')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'onlyA'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>Only in List A (A \ B)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {compareResult.onlyA.length}
                </span>
              </button>

              {/* Only in List B (B - A) */}
              <button
                type="button"
                onClick={() => setActiveTab('onlyB')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'onlyB'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>Only in List B (B \ A)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {compareResult.onlyB.length}
                </span>
              </button>

              {/* Union (A ∪ B) */}
              <button
                type="button"
                onClick={() => setActiveTab('union')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'union'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>All Unique (A ∪ B)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {compareResult.union.length}
                </span>
              </button>

              {/* Symmetric Diff */}
              <button
                type="button"
                onClick={() => setActiveTab('symmetricDiff')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'symmetricDiff'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>Only in Either (A △ B)</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {compareResult.symmetricDiff.length}
                </span>
              </button>

              {/* Duplicates in A Tab */}
              {analysisA.duplicates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dupesA')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'dupesA'
                      ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs font-semibold border border-amber-300 dark:border-amber-800'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <span>Dupes in A</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold">
                    {analysisA.duplicates.length}
                  </span>
                </button>
              )}

              {/* Duplicates in B Tab */}
              {analysisB.duplicates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dupesB')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'dupesB'
                      ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs font-semibold border border-amber-300 dark:border-amber-800'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <span>Dupes in B</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold">
                    {analysisB.duplicates.length}
                  </span>
                </button>
              )}
            </div>

            {/* Tab Body: Formatted Box + Table Inspector */}
            <div className="p-4 space-y-4">
              {/* Action Toolbar for Current Tab */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      placeholder="Filter items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                    />
                  </div>
                  <span className="text-xs text-neutral-500 font-mono">
                    Showing {filteredTabItems.length} of {currentTabItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick SQL Copy Shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      const sql = formatListOutput(currentTabItems, {
                        quote: 'single',
                        delimiter: ', ',
                        wrapper: 'sql',
                      });
                      handleCopy(sql, 'copy-sql');
                    }}
                    disabled={currentTabItems.length === 0}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium disabled:opacity-40"
                    title="Quick copy formatted as SQL IN ('val1', 'val2')"
                  >
                    <FileCode size={13} className="text-neutral-500" />
                    <span>{copiedKey === 'copy-sql' ? 'Copied SQL!' : 'Copy SQL IN (...) '}</span>
                  </button>

                  {/* Copy Formatted Output */}
                  <button
                    type="button"
                    onClick={() => handleCopy(formattedOutput, 'copy-formatted')}
                    disabled={currentTabItems.length === 0}
                    className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40"
                    title="Copy formatted result"
                  >
                    {copiedKey === 'copy-formatted' ? (
                      <>
                        <Check size={13} className="text-emerald-400 dark:text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Formatted</span>
                      </>
                    )}
                  </button>

                  {/* Download Result */}
                  <button
                    type="button"
                    onClick={() => handleDownload(formattedOutput, `${activeTab}-output.txt`)}
                    disabled={currentTabItems.length === 0}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium disabled:opacity-40"
                    title="Download as .txt"
                  >
                    <Download size={13} />
                    <span>.txt</span>
                  </button>
                </div>
              </div>

              {/* Formatted Output Preview Box */}
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                    {quoteStyle === 'single' ? "'single'" : quoteStyle === 'double' ? '"double"' : 'plain'}{' '}
                    • {outputDelimiter === ', ' ? 'comma' : outputDelimiter === '\n' ? 'newline' : 'sep'}
                  </span>
                </div>
                <textarea
                  readOnly
                  value={formattedOutput}
                  placeholder="Formatted output will appear here..."
                  className="w-full h-24 p-3 text-xs font-mono bg-neutral-50 dark:bg-[#070709] border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none resize-y text-neutral-800 dark:text-neutral-200 focus:border-neutral-400 dark:focus:border-neutral-600 leading-relaxed"
                />
              </div>

              {/* Table List of Items */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left modern-table">
                    <thead className="bg-neutral-100/70 dark:bg-neutral-900 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 w-16 text-center">#</th>
                        <th className="py-2 px-3">Item Value</th>
                        <th className="py-2 px-3 w-20 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                      {filteredTabItems.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-neutral-400 font-mono text-xs">
                            {currentTabItems.length === 0
                              ? 'No items found for this comparison filter.'
                              : 'No items match your search filter.'}
                          </td>
                        </tr>
                      ) : (
                        filteredTabItems.map((item, idx) => (
                          <tr
                            key={`${item}-${idx}`}
                            className="group hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors"
                          >
                            <td className="py-2 px-3 text-center font-mono text-[11px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white select-all">
                              {item}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleCopy(item, `item-${idx}`)}
                                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                                title="Copy single item"
                              >
                                {copiedKey === `item-${idx}` ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
