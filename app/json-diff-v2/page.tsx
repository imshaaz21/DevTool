'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  Binary,
  ArrowLeftRight,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileCode2,
  RefreshCw,
  Eye,
  Edit3,
} from 'lucide-react';
import {
  computeSemanticDiff,
  SemanticDiff,
  DiffSummary,
  DiffType,
} from '@/lib/semanticJsonDiff';

const SAMPLE_LEFT = {
  "Aidan Gillen": {
    "array": ["Game of Thron\"es", "The Wire"],
    "string": "some string",
    "int": 2,
    "aboolean": true,
    "boolean": true,
    "null": null,
    "a_null": null,
    "another_null": "null check",
    "object": {
      "foo": "bar",
      "object1": { "new prop1": "new prop value" },
      "object2": { "new prop1": "new prop value" },
      "object3": { "new prop1": "new prop value" },
      "object4": { "new prop1": "new prop value" }
    }
  },
  "Amy Ryan": { "one": "In Treatment", "two": "The Wire" },
  "Annie Fitzgerald": ["Big Love", "True Blood"],
  "Anwan Glover": ["Treme", "The Wire"],
  "Alexander Skarsgard": ["Generation Kill", "True Blood"],
  "Clarke Peters": null
};

const SAMPLE_RIGHT = {
  "Aidan Gillen": {
    "array": ["Game of Thrones", "The Wire"],
    "string": "some string",
    "int": "2",
    "otherint": 4,
    "aboolean": "true",
    "boolean": false,
    "null": null,
    "a_null": 88,
    "another_null": null,
    "object": { "foo": "bar" }
  },
  "Amy Ryan": ["In Treatment", "The Wire"],
  "Annie Fitzgerald": ["True Blood", "Big Love", "The Sopranos", "Oz"],
  "Anwan Glover": ["Treme", "The Wire"],
  "Alexander Skarsg?rd": ["Generation Kill", "True Blood"],
  "Alice Farmer": ["The Corner", "Oz", "The Wire"]
};

export default function JsonDiffV2Page() {
  const { isCollapsed } = useSidebar();

  // Raw text inputs (starts empty, no dummy data loaded by default)
  const [leftInput, setLeftInput] = useState<string>('');
  const [rightInput, setRightInput] = useState<string>('');

  // Parse errors
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  // Settings
  const [indentSize, setIndentSize] = useState<number>(2);

  // Comparison State
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);
  const [isDiffActive, setIsDiffActive] = useState<boolean>(false);
  const [currentDiffIndex, setCurrentDiffIndex] = useState<number>(0);

  // Filter toggles
  const [showMissing, setShowMissing] = useState<boolean>(true);
  const [showTypes, setShowTypes] = useState<boolean>(true);
  const [showEquality, setShowEquality] = useState<boolean>(true);

  // UI helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Scroll sync refs
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  // File upload refs
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  // Validate and perform compare
  const handleCompare = () => {
    let parsedLeft: any;
    let parsedRight: any;
    let hasError = false;

    if (!leftInput.trim()) {
      setLeftError('Please enter valid JSON for the left document.');
      hasError = true;
    } else {
      try {
        parsedLeft = JSON.parse(leftInput);
        setLeftError(null);
      } catch (e: any) {
        setLeftError(e.message);
        hasError = true;
      }
    }

    if (!rightInput.trim()) {
      setRightError('Please enter valid JSON for the right document.');
      hasError = true;
    } else {
      try {
        parsedRight = JSON.parse(rightInput);
        setRightError(null);
      } catch (e: any) {
        setRightError(e.message);
        hasError = true;
      }
    }

    if (hasError) return;

    const result = computeSemanticDiff(parsedLeft, parsedRight, indentSize);
    setDiffSummary(result);
    setIsDiffActive(true);
    setCurrentDiffIndex(0);
  };

  // Filtered diffs
  const visibleDiffs = useMemo(() => {
    if (!diffSummary) return [];
    return diffSummary.diffs.filter((d) => {
      if (d.type === 'missing' && !showMissing) return false;
      if (d.type === 'type' && !showTypes) return false;
      if (d.type === 'eq' && !showEquality) return false;
      return true;
    });
  }, [diffSummary, showMissing, showTypes, showEquality]);

  // Current active diff
  const activeDiff = visibleDiffs[currentDiffIndex] || null;

  // Jump to specific diff
  const jumpToDiff = (index: number) => {
    if (index < 0 || index >= visibleDiffs.length) return;
    setCurrentDiffIndex(index);
    const targetDiff = visibleDiffs[index];
    if (!targetDiff) return;

    // Scroll lines into view
    const leftLineEl = document.getElementById(`left-line-${targetDiff.path1.line}`);
    const rightLineEl = document.getElementById(`right-line-${targetDiff.path2.line}`);

    if (leftLineEl && leftPaneRef.current) {
      const offset = leftLineEl.offsetTop - leftPaneRef.current.offsetTop - 80;
      if (typeof leftPaneRef.current.scrollTo === 'function') {
        leftPaneRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      } else {
        leftPaneRef.current.scrollTop = Math.max(0, offset);
      }
    }
    if (rightLineEl && rightPaneRef.current) {
      const offset = rightLineEl.offsetTop - rightPaneRef.current.offsetTop - 80;
      if (typeof rightPaneRef.current.scrollTo === 'function') {
        rightPaneRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      } else {
        rightPaneRef.current.scrollTop = Math.max(0, offset);
      }
    }
  };

  const handlePrev = () => {
    if (currentDiffIndex > 0) {
      jumpToDiff(currentDiffIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentDiffIndex < visibleDiffs.length - 1) {
      jumpToDiff(currentDiffIndex + 1);
    }
  };

  // Synchronized scrolling
  const handleScroll = (source: 'left' | 'right') => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    const sourceEl = source === 'left' ? leftPaneRef.current : rightPaneRef.current;
    const targetEl = source === 'left' ? rightPaneRef.current : leftPaneRef.current;

    if (sourceEl && targetEl) {
      const percentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);
      targetEl.scrollTop = percentage * (targetEl.scrollHeight - targetEl.clientHeight);
    }

    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 40);
  };

  // Sample data loader
  const handleLoadSample = () => {
    const l = JSON.stringify(SAMPLE_LEFT, null, indentSize);
    const r = JSON.stringify(SAMPLE_RIGHT, null, indentSize);
    setLeftInput(l);
    setRightInput(r);
    setLeftError(null);
    setRightError(null);
    const result = computeSemanticDiff(SAMPLE_LEFT, SAMPLE_RIGHT, indentSize);
    setDiffSummary(result);
    setIsDiffActive(true);
    setCurrentDiffIndex(0);
  };

  // Swap Left & Right
  const handleSwap = () => {
    const temp = leftInput;
    setLeftInput(rightInput);
    setRightInput(temp);
    setLeftError(null);
    setRightError(null);
    try {
      const l = JSON.parse(rightInput);
      const r = JSON.parse(leftInput);
      const result = computeSemanticDiff(l, r, indentSize);
      setDiffSummary(result);
      setCurrentDiffIndex(0);
    } catch {
      // keep inputs
    }
  };

  // Clear inputs
  const handleClear = () => {
    setLeftInput('');
    setRightInput('');
    setLeftError(null);
    setRightError(null);
    setDiffSummary(null);
    setIsDiffActive(false);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (side === 'left') {
        setLeftInput(content);
        setLeftError(null);
      } else {
        setRightInput(content);
        setRightError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Format helper for textareas
  const handleBeautifyInput = (side: 'left' | 'right') => {
    try {
      if (side === 'left') {
        const obj = JSON.parse(leftInput);
        setLeftInput(JSON.stringify(obj, null, indentSize));
        setLeftError(null);
      } else {
        const obj = JSON.parse(rightInput);
        setRightInput(JSON.stringify(obj, null, indentSize));
        setRightError(null);
      }
    } catch (e: any) {
      if (side === 'left') setLeftError(e.message);
      else setRightError(e.message);
    }
  };

  // Line diff classification maps
  const leftLineDiffMap = useMemo(() => {
    const map = new Map<number, SemanticDiff[]>();
    if (!diffSummary) return map;
    diffSummary.diffs.forEach((d) => {
      const existing = map.get(d.path1.line) || [];
      existing.push(d);
      map.set(d.path1.line, existing);
    });
    return map;
  }, [diffSummary]);

  const rightLineDiffMap = useMemo(() => {
    const map = new Map<number, SemanticDiff[]>();
    if (!diffSummary) return map;
    diffSummary.diffs.forEach((d) => {
      const existing = map.get(d.path2.line) || [];
      existing.push(d);
      map.set(d.path2.line, existing);
    });
    return map;
  }, [diffSummary]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 select-none">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Binary}
          title="JSON Diff v2"
          description="Semantic JSON comparison matching jsondiff.com — compares values, types, and properties independent of key order."
          badge="Semantic Engine"
        >
          <button
            type="button"
            onClick={handleLoadSample}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Load sample JSON documents from jsondiff.com"
          >
            <Sparkles size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Sample Data</span>
          </button>
          <button
            type="button"
            onClick={handleSwap}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Swap Left and Right documents"
          >
            <ArrowLeftRight size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Swap</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDiffActive(!isDiffActive)}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title={isDiffActive ? 'Edit raw JSON inputs' : 'View semantic diff'}
          >
            {isDiffActive ? <Edit3 size={13} /> : <Eye size={13} />}
            <span>{isDiffActive ? 'Edit Inputs' : 'View Diff'}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear both JSON documents"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </PageHeader>

        <div className="flex-1 p-6 space-y-4 max-w-[1600px] w-full mx-auto flex flex-col">
          {/* Top Diff Report / Filter Bar (Visible in Diff Mode) */}
          {isDiffActive && diffSummary && (
            <section className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Result Title */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      diffSummary.diffs.length === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {diffSummary.diffs.length === 0
                      ? 'The two JSON documents are semantically identical.'
                      : `Found ${diffSummary.diffs.length} semantic difference${
                          diffSummary.diffs.length === 1 ? '' : 's'
                        }`}
                  </span>
                </div>

                {/* Filter Checkboxes */}
                {diffSummary.diffs.length > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      Filter:
                    </span>
                    {diffSummary.missingCount > 0 && (
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        <input
                          type="checkbox"
                          checked={showMissing}
                          onChange={(e) => setShowMissing(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-700 text-emerald-600 focus:ring-0"
                        />
                        <span>
                          {diffSummary.missingCount} missing propert
                          {diffSummary.missingCount === 1 ? 'y' : 'ies'}
                        </span>
                      </label>
                    )}

                    {diffSummary.typeCount > 0 && (
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
                        <input
                          type="checkbox"
                          checked={showTypes}
                          onChange={(e) => setShowTypes(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-700 text-rose-600 focus:ring-0"
                        />
                        <span>
                          {diffSummary.typeCount} type mismatch
                          {diffSummary.typeCount === 1 ? '' : 'es'}
                        </span>
                      </label>
                    )}

                    {diffSummary.eqCount > 0 && (
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60">
                        <input
                          type="checkbox"
                          checked={showEquality}
                          onChange={(e) => setShowEquality(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-700 text-sky-600 focus:ring-0"
                        />
                        <span>
                          {diffSummary.eqCount} unequal value
                          {diffSummary.eqCount === 1 ? '' : 's'}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              {visibleDiffs.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentDiffIndex === 0}
                      className="p-1 rounded hover:bg-white dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 transition-colors"
                      title="Previous difference (Left Arrow)"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-[11px] font-mono px-2 text-neutral-600 dark:text-neutral-300">
                      {currentDiffIndex + 1} of {visibleDiffs.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentDiffIndex >= visibleDiffs.length - 1}
                      className="p-1 rounded hover:bg-white dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 transition-colors"
                      title="Next difference (Right Arrow)"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* MODE 1: Raw JSON Edit Mode */}
          {!isDiffActive && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Input */}
                <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        Left JSON (Original)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBeautifyInput('left')}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
                        title="Beautify JSON"
                      >
                        <FileCode2 size={13} />
                        <span>Format</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => leftFileRef.current?.click()}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
                        title="Upload JSON file"
                      >
                        <Upload size={13} />
                        <span>Upload</span>
                      </button>
                      <input
                        type="file"
                        ref={leftFileRef}
                        accept=".json,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'left')}
                      />
                    </div>
                  </div>

                  <textarea
                    spellCheck={false}
                    value={leftInput}
                    onChange={(e) => {
                      setLeftInput(e.target.value);
                      setLeftError(null);
                    }}
                    placeholder="Enter left JSON to compare..."
                    className="w-full h-[520px] p-3 text-xs font-mono bg-transparent border-0 focus:ring-0 resize-y outline-none leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                  />

                  {leftError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-400 font-mono flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{leftError}</span>
                    </div>
                  )}
                </div>

                {/* Right Input */}
                <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        Right JSON (Modified)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBeautifyInput('right')}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
                        title="Beautify JSON"
                      >
                        <FileCode2 size={13} />
                        <span>Format</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rightFileRef.current?.click()}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
                        title="Upload JSON file"
                      >
                        <Upload size={13} />
                        <span>Upload</span>
                      </button>
                      <input
                        type="file"
                        ref={rightFileRef}
                        accept=".json,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'right')}
                      />
                    </div>
                  </div>

                  <textarea
                    spellCheck={false}
                    value={rightInput}
                    onChange={(e) => {
                      setRightInput(e.target.value);
                      setRightError(null);
                    }}
                    placeholder="Enter right JSON to compare..."
                    className="w-full h-[520px] p-3 text-xs font-mono bg-transparent border-0 focus:ring-0 resize-y outline-none leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                  />

                  {rightError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-400 font-mono flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{rightError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Compare Button Card */}
              <div className="flex items-center justify-center p-4 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={handleCompare}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm transition-colors"
                >
                  <Binary size={15} />
                  <span>Compare Semantic Diff</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: Semantic Diff Side-by-Side View */}
          {isDiffActive && diffSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left & Right Code Panes (9 cols on large screens) */}
              <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-3 shadow-xs">
                {/* Left Pane */}
                <div className="flex flex-col border border-neutral-200/80 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/60 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Left (Original)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(diffSummary.leftFormatted, 'copy-left')}
                      className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'copy-left' ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div
                    ref={leftPaneRef}
                    onScroll={() => handleScroll('left')}
                    className="h-[620px] overflow-auto font-mono text-xs leading-5 bg-[#ffffff] dark:bg-[#0a0a0c]"
                  >
                    {diffSummary.leftLines.map((lineStr, idx) => {
                      const lineNum = idx + 1;
                      const lineDiffs = leftLineDiffMap.get(lineNum) || [];
                      const activeLineDiff = lineDiffs.find((d) => {
                        if (d.type === 'missing' && !showMissing) return false;
                        if (d.type === 'type' && !showTypes) return false;
                        if (d.type === 'eq' && !showEquality) return false;
                        return true;
                      });

                      const isSelected = activeDiff?.path1.line === lineNum;

                      let bgClass = '';
                      if (isSelected) {
                        bgClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 font-semibold';
                      } else if (activeLineDiff) {
                        if (activeLineDiff.type === 'missing') {
                          bgClass = 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                        } else if (activeLineDiff.type === 'type') {
                          bgClass = 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                        } else if (activeLineDiff.type === 'eq') {
                          bgClass = 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
                        }
                      }

                      return (
                        <div
                          key={`left-l-${lineNum}`}
                          id={`left-line-${lineNum}`}
                          onClick={() => {
                            if (activeLineDiff) {
                              const diffIdx = visibleDiffs.findIndex((d) => d.id === activeLineDiff.id);
                              if (diffIdx !== -1) jumpToDiff(diffIdx);
                            }
                          }}
                          className={`flex items-stretch group cursor-pointer transition-colors ${bgClass} ${
                            !bgClass ? 'hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60' : ''
                          }`}
                        >
                          <span className="w-10 shrink-0 text-right pr-2 select-none text-[11px] text-neutral-400 dark:text-neutral-600 border-r border-neutral-100 dark:border-neutral-900/80">
                            {lineNum}
                          </span>
                          <span className="pl-3 pr-2 whitespace-pre min-w-0 select-text">
                            {lineStr || ' '}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Pane */}
                <div className="flex flex-col border border-neutral-200/80 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/60 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Right (Modified)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(diffSummary.rightFormatted, 'copy-right')}
                      className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'copy-right' ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div
                    ref={rightPaneRef}
                    onScroll={() => handleScroll('right')}
                    className="h-[620px] overflow-auto font-mono text-xs leading-5 bg-[#ffffff] dark:bg-[#0a0a0c]"
                  >
                    {diffSummary.rightLines.map((lineStr, idx) => {
                      const lineNum = idx + 1;
                      const lineDiffs = rightLineDiffMap.get(lineNum) || [];
                      const activeLineDiff = lineDiffs.find((d) => {
                        if (d.type === 'missing' && !showMissing) return false;
                        if (d.type === 'type' && !showTypes) return false;
                        if (d.type === 'eq' && !showEquality) return false;
                        return true;
                      });

                      const isSelected = activeDiff?.path2.line === lineNum;

                      let bgClass = '';
                      if (isSelected) {
                        bgClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 font-semibold';
                      } else if (activeLineDiff) {
                        if (activeLineDiff.type === 'missing') {
                          bgClass = 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                        } else if (activeLineDiff.type === 'type') {
                          bgClass = 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                        } else if (activeLineDiff.type === 'eq') {
                          bgClass = 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
                        }
                      }

                      return (
                        <div
                          key={`right-l-${lineNum}`}
                          id={`right-line-${lineNum}`}
                          onClick={() => {
                            if (activeLineDiff) {
                              const diffIdx = visibleDiffs.findIndex((d) => d.id === activeLineDiff.id);
                              if (diffIdx !== -1) jumpToDiff(diffIdx);
                            }
                          }}
                          className={`flex items-stretch group cursor-pointer transition-colors ${bgClass} ${
                            !bgClass ? 'hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60' : ''
                          }`}
                        >
                          <span className="w-10 shrink-0 text-right pr-2 select-none text-[11px] text-neutral-400 dark:text-neutral-600 border-r border-neutral-100 dark:border-neutral-900/80">
                            {lineNum}
                          </span>
                          <span className="pl-3 pr-2 whitespace-pre min-w-0 select-text">
                            {lineStr || ' '}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Difference Inspector Toolbar (3-4 cols) */}
              <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-3 shadow-xs space-y-3 sticky top-16">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                      Difference Inspector
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {visibleDiffs.length} total
                  </span>
                </div>

                {/* Diff explanation card list */}
                <div className="h-[560px] overflow-y-auto space-y-1.5 pr-1">
                  {visibleDiffs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                      No differences match current filters.
                    </div>
                  ) : (
                    visibleDiffs.map((diff, idx) => {
                      const isSelected = currentDiffIndex === idx;

                      let badgeColor = '';
                      if (diff.type === 'missing') {
                        badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
                      } else if (diff.type === 'type') {
                        badgeColor = 'text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
                      } else {
                        badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
                      }

                      return (
                        <div
                          key={diff.id}
                          onClick={() => jumpToDiff(idx)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-sm'
                              : 'bg-neutral-50/50 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[10px] font-semibold opacity-70">
                              #{idx + 1} • Left L{diff.path1.line} / Right L{diff.path2.line}
                            </span>
                            <span
                              className={`text-[9px] uppercase tracking-wider font-mono font-medium px-1.5 py-0.2 rounded border ${badgeColor}`}
                            >
                              {diff.type}
                            </span>
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                            dangerouslySetInnerHTML={{ __html: diff.msg }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
