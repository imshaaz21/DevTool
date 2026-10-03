'use client';

import React, { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { StyledJsonInput } from '@/components/StyledJsonInput';
import { EditorSkeleton } from '@/components/EditorSkeleton';
import {
  Binary,
  ArrowLeftRight,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CheckCircle2,
  Eye,
  Edit3,
} from 'lucide-react';
import {
  computeSemanticDiff,
  SemanticDiff,
  DiffSummary,
} from '@/lib/semanticJsonDiff';

const JsonEditorComponent = dynamic(
  () => import('@/components/JsonEditorComponent').then((mod) => ({ default: mod.JsonEditorComponent })),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

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
  const indentSize = 2;

  // Comparison State
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);
  const [isDiffActive, setIsDiffActive] = useState<boolean>(false);
  const [currentDiffIndex, setCurrentDiffIndex] = useState<number>(0);
  const [diffTab, setDiffTab] = useState<'visual' | 'keys' | 'values' | 'summary'>('visual');
  const [inputEditorMode, setInputEditorMode] = useState<'text' | 'rich'>('text');

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

  // Parsed JSON objects for Rich Editor
  const parsedLeftJson = useMemo(() => {
    try {
      return leftInput.trim() ? JSON.parse(leftInput) : {};
    } catch {
      return null;
    }
  }, [leftInput]);

  const parsedRightJson = useMemo(() => {
    try {
      return rightInput.trim() ? JSON.parse(rightInput) : {};
    } catch {
      return null;
    }
  }, [rightInput]);

  // Categorized diffs for Keys tab
  const missingDiffs = useMemo(() => {
    if (!diffSummary) return { inLeftOnly: [], inRightOnly: [] };
    const inLeftOnly: SemanticDiff[] = [];
    const inRightOnly: SemanticDiff[] = [];
    diffSummary.diffs.forEach((d) => {
      if (d.type === 'missing') {
        if (d.rawMsg.toLowerCase().includes('right side')) {
          inLeftOnly.push(d);
        } else {
          inRightOnly.push(d);
        }
      }
    });
    return { inLeftOnly, inRightOnly };
  }, [diffSummary]);

  // Value & Type diffs
  const valueAndTypeDiffs = useMemo(() => {
    if (!diffSummary) return [];
    return diffSummary.diffs.filter((d) => d.type === 'eq' || d.type === 'type');
  }, [diffSummary]);

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
    setDiffTab('visual');
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

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
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
          description="Semantic JSON comparison matching jsondiff.com - compares values, types, and properties independent of key order."
          badge="Semantic Engine"
        >
          {isDiffActive && diffSummary && (
            <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 mr-2">
              <button
                type="button"
                onClick={() => setDiffTab('visual')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  diffTab === 'visual'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Visual Diff
              </button>
              <button
                type="button"
                onClick={() => setDiffTab('keys')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  diffTab === 'keys'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Key Diffs
              </button>
              <button
                type="button"
                onClick={() => setDiffTab('values')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  diffTab === 'values'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Values & Types
              </button>
              <button
                type="button"
                onClick={() => setDiffTab('summary')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  diffTab === 'summary'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Summary
              </button>
            </div>
          )}

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
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-500">Edit or paste JSON documents</span>
                <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <button
                    type="button"
                    onClick={() => setInputEditorMode('text')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      inputEditorMode === 'text'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Raw Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputEditorMode('rich')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      inputEditorMode === 'rich'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Rich Code Editor
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Input */}
                {inputEditorMode === 'text' ? (
                  <StyledJsonInput
                    title="Left JSON (Original)"
                    value={leftInput}
                    onChange={(val) => {
                      setLeftInput(val);
                      setLeftError(null);
                    }}
                    placeholder="Enter left JSON to compare..."
                    error={leftError}
                    height="520px"
                  />
                ) : (
                  <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
                    <div className="px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                      Left JSON (Rich Editor)
                    </div>
                    <div className="h-[520px] p-1">
                      <JsonEditorComponent
                        json={parsedLeftJson !== null ? parsedLeftJson : {}}
                        onChange={(updated) => {
                          setLeftInput(JSON.stringify(updated, null, indentSize));
                          setLeftError(null);
                        }}
                        mode="code"
                        height="100%"
                      />
                    </div>
                  </div>
                )}

                {/* Right Input */}
                {inputEditorMode === 'text' ? (
                  <StyledJsonInput
                    title="Right JSON (Modified)"
                    value={rightInput}
                    onChange={(val) => {
                      setRightInput(val);
                      setRightError(null);
                    }}
                    placeholder="Enter right JSON to compare..."
                    error={rightError}
                    height="520px"
                  />
                ) : (
                  <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
                    <div className="px-4 py-2.5 bg-neutral-50/60 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                      Right JSON (Rich Editor)
                    </div>
                    <div className="h-[520px] p-1">
                      <JsonEditorComponent
                        json={parsedRightJson !== null ? parsedRightJson : {}}
                        onChange={(updated) => {
                          setRightInput(JSON.stringify(updated, null, indentSize));
                          setRightError(null);
                        }}
                        mode="code"
                        height="100%"
                      />
                    </div>
                  </div>
                )}
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

          {/* MODE 2: Semantic Diff Multi-View */}
          {isDiffActive && diffSummary && (
            <>
              {/* TAB 1: Visual Side-by-Side Diff */}
              {diffTab === 'visual' && (
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
                              {diff.dotPath && (
                                <div className="flex items-center justify-between gap-1 mb-1.5 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px]">
                                  <span className="truncate opacity-80">{diff.dotPath}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(diff.dotPath || '', `path-${diff.id}`);
                                    }}
                                    className="shrink-0 p-0.5 opacity-70 hover:opacity-100 transition-opacity"
                                    title="Copy dot-notation path"
                                  >
                                    {copiedKey === `path-${diff.id}` ? (
                                      <Check size={10} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                </div>
                              )}
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

              {/* TAB 2: Categorized Key Differences */}
              {diffTab === 'keys' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Missing in Right (Original Left Only) */}
                  <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          Missing in Right (Original Left Only)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-semibold">
                        {missingDiffs.inLeftOnly.length}
                      </span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1">
                      {missingDiffs.inLeftOnly.length === 0 ? (
                        <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                          No keys missing from right document.
                        </div>
                      ) : (
                        missingDiffs.inLeftOnly.map((d) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {d.dotPath}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(d.dotPath || '', `k-${d.id}`)}
                                className="p-1 rounded hover:bg-white dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors shrink-0"
                                title="Copy dot path"
                              >
                                {copiedKey === `k-${d.id}` ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                              Left Line {d.path1.line} • {d.rawMsg}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing in Left (Modified Right Only) */}
                  <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          Missing in Left (Modified Right Only)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold">
                        {missingDiffs.inRightOnly.length}
                      </span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1">
                      {missingDiffs.inRightOnly.length === 0 ? (
                        <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                          No keys missing from left document.
                        </div>
                      ) : (
                        missingDiffs.inRightOnly.map((d) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {d.dotPath}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(d.dotPath || '', `k-${d.id}`)}
                                className="p-1 rounded hover:bg-white dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors shrink-0"
                                title="Copy dot path"
                              >
                                {copiedKey === `k-${d.id}` ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                              Right Line {d.path2.line} • {d.rawMsg}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Value & Type Differences */}
              {diffTab === 'values' && (
                <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Value & Type Differences
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {valueAndTypeDiffs.length} total
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[650px] pr-1">
                    {valueAndTypeDiffs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                        No value or type differences found.
                      </div>
                    ) : (
                      valueAndTypeDiffs.map((d) => (
                        <div
                          key={d.id}
                          className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                {d.dotPath}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(d.dotPath || '', `val-${d.id}`)}
                                className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                title="Copy path"
                              >
                                {copiedKey === `val-${d.id}` ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-400">
                                Left L{d.path1.line} / Right L{d.path2.line}
                              </span>
                              <span
                                className={`text-[9px] uppercase tracking-wider font-mono font-medium px-1.5 py-0.2 rounded border ${
                                  d.type === 'type'
                                    ? 'text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                                    : 'text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {d.type === 'type' ? 'Type Mismatch' : 'Unequal Value'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="p-2.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80">
                              <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Left (Original)</div>
                              <pre className="font-mono text-xs text-rose-700 dark:text-rose-400 whitespace-pre-wrap break-all">
                                {diffSummary.leftLines[d.path1.line - 1]?.trim() || '(empty)'}
                              </pre>
                            </div>
                            <div className="p-2.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80">
                              <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Right (Modified)</div>
                              <pre className="font-mono text-xs text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap break-all">
                                {diffSummary.rightLines[d.path2.line - 1]?.trim() || '(empty)'}
                              </pre>
                            </div>
                          </div>

                          <div
                            className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: d.msg }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Summary & Metrics */}
              {diffTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1">Total Diffs</div>
                      <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{diffSummary.diffs.length}</div>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 mb-1">Missing Keys</div>
                      <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{diffSummary.missingCount}</div>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 mb-1">Type Mismatches</div>
                      <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{diffSummary.typeCount}</div>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 mb-1">Unequal Values</div>
                      <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{diffSummary.eqCount}</div>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1">Keys in Left</div>
                      <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{diffSummary.totalKeysLeft ?? 0}</div>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs">
                      <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1">Keys in Right</div>
                      <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{diffSummary.totalKeysRight ?? 0}</div>
                    </div>
                  </div>

                  <div className="p-8 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {diffSummary.diffs.length === 0 ? (
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      ) : (
                        <Binary size={24} className="text-neutral-600 dark:text-neutral-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                        {diffSummary.diffs.length === 0
                          ? 'Documents are Semantically Identical'
                          : `Identified ${diffSummary.diffs.length} Semantic Difference${diffSummary.diffs.length === 1 ? '' : 's'}`}
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-md">
                        {diffSummary.diffs.length === 0
                          ? 'Both JSON structures, types, and values match completely regardless of property order.'
                          : 'Comparison verified property existence, array ordering, data types, and value equality.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `# JSON Diff v2 Summary Report
- Status: ${diffSummary.diffs.length === 0 ? 'Semantically Identical' : `${diffSummary.diffs.length} Differences Found`}
- Missing Properties: ${diffSummary.missingCount}
- Type Mismatches: ${diffSummary.typeCount}
- Unequal Values: ${diffSummary.eqCount}
- Total Keys in Left: ${diffSummary.totalKeysLeft ?? 0}
- Total Keys in Right: ${diffSummary.totalKeysRight ?? 0}
`;
                        handleCopy(text, 'summary-report');
                      }}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
                    >
                      {copiedKey === 'summary-report' ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                      <span>{copiedKey === 'summary-report' ? 'Copied Report' : 'Copy Summary Report'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
