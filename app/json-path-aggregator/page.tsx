'use client';

import { useState, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  Calculator,
  Search,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Layers,
  Table as TableIcon,
  Code2,
  ListOrdered,
  Download,
  AlertCircle,
  FileJson,
  Wand2,
  Sigma,
  Filter,
} from 'lucide-react';
import {
  aggregateJson,
  discoverFields,
  formatExtractedValues,
  ExtractedItem,
} from '@/lib/jsonAggregator';
import { cleanAndParseJsonString, unwrapNestedStrings } from '@/utils/jsonFormatter';

const SAMPLE_HEALTHCARE_JSON = `[
  {
    "payerId": 1001,
    "payerContractId": 2001,
    "payerPolicyId": 2001,
    "policyNumber": "123",
    "hospitalId": 151,
    "hospitalGroupId": 58,
    "clinicId": 37813,
    "doctorId": 75721,
    "appointmentId": 5591729,
    "invoiceVisitId": 325621345,
    "encounterType": "OPD",
    "pomrId": 9330919,
    "batchRefNo": "CLM-S2026013022882632288263",
    "status": "ACTIVE",
    "invoiceDate": "2026-01-30 14:35:17",
    "claimType": "OPD",
    "patientId": 893416,
    "services": [
      {
        "lineItemNo": 1,
        "servicePrimaryId": 76087574,
        "serviceType": "PROCEDURE",
        "serviceCode": "03035003901",
        "standardCode": "we3",
        "serviceQuantity": 1,
        "serviceReferenceNumber": "INV-S2026013022882622288262",
        "grossAmount": 96.0,
        "netAmount": 96.0,
        "discountPercentage": 0.0,
        "discountAmount": 0.0,
        "patientSharePercentage": 0.0,
        "companySharePercentage": 100.0,
        "patientShareAmount": 0.0,
        "companyShareAmount": 96.0,
        "companyTax": 14.4,
        "patientTax": 0.0,
        "encounterType": "OPD",
        "serviceDiscountPct": 0.0,
        "serviceDiscountAmount": 0.0,
        "serviceDeductibleAmount": 0.0,
        "serviceReimbursementAmount": 96.0,
        "orderId": 240385082,
        "patientOrderId": 23466974,
        "categoryId": 66,
        "categoryCode": 3,
        "groupId": 527317,
        "subGroupId": 259,
        "isInterCompanyOrder": false,
        "isDental": false,
        "chiSbsCode": "58100-00-00",
        "packageDetails": []
      },
      {
        "lineItemNo": 2,
        "servicePrimaryId": 76087575,
        "serviceType": "PROCEDURE",
        "serviceCode": "03035004138",
        "standardCode": "we3",
        "serviceQuantity": 1,
        "serviceReferenceNumber": "INV-S2026013022882622288262",
        "grossAmount": 229.6,
        "netAmount": 229.6,
        "discountPercentage": 0.0,
        "discountAmount": 0.0,
        "patientSharePercentage": 0.0,
        "companySharePercentage": 100.0,
        "patientShareAmount": 0.0,
        "companyShareAmount": 229.6,
        "companyTax": 34.44,
        "patientTax": 0.0,
        "encounterType": "OPD",
        "serviceDiscountPct": 0.0,
        "serviceDiscountAmount": 0.0,
        "serviceDeductibleAmount": 0.0,
        "serviceReimbursementAmount": 229.6,
        "orderId": 240385082,
        "patientOrderId": 23466975,
        "categoryId": 66,
        "categoryCode": 3,
        "groupId": 527317,
        "subGroupId": 259,
        "isInterCompanyOrder": false,
        "isDental": false,
        "chiSbsCode": "57945-00-00",
        "packageDetails": []
      }
    ],
    "invoiceNo": "INV-S2026013022882622288262",
    "invoiceStatus": "ACTIVE",
    "isInterCompanyInvoice": false,
    "isDischargeMedication": false,
    "isMohClaim": false
  }
]`;

type ViewMode = 'table' | 'json' | 'newline' | 'csv';

export default function JsonPathAggregatorPage() {
  const { isCollapsed } = useSidebar();

  // Inputs & options
  const [rawInput, setRawInput] = useState(SAMPLE_HEALTHCARE_JSON);
  const [patternQuery, setPatternQuery] = useState('services.*.companyShareAmount');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [parseNumericStrings, setParseNumericStrings] = useState(true);
  const [partialKeyMatch, setPartialKeyMatch] = useState(true);

  // View & UI state
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Parsed JSON state
  const parsedJson = useMemo(() => {
    if (!rawInput.trim()) return null;
    try {
      return JSON.parse(rawInput.trim());
    } catch {
      const fallback = cleanAndParseJsonString(rawInput);
      return fallback;
    }
  }, [rawInput]);

  const jsonError = useMemo(() => {
    if (!rawInput.trim()) return null;
    if (parsedJson !== null) return null;
    try {
      JSON.parse(rawInput.trim());
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Invalid JSON format';
    }
  }, [rawInput, parsedJson]);

  // Discover all fields for suggestions
  const discoveredFields = useMemo(() => {
    if (!parsedJson) return [];
    try {
      return discoverFields(parsedJson);
    } catch {
      return [];
    }
  }, [parsedJson]);

  // Aggregation results
  const aggregationResult = useMemo(() => {
    if (!parsedJson || !patternQuery.trim()) {
      return {
        items: [] as ExtractedItem[],
        stats: {
          matchCount: 0,
          numericCount: 0,
          sum: 0,
          avg: 0,
          min: null,
          max: null,
          median: null,
          allValues: [],
          numericValues: [],
          arrayLengthSum: 0,
        },
      };
    }

    try {
      return aggregateJson(parsedJson, patternQuery, {
        caseSensitive,
        parseNumericStrings,
        partialKeyMatch,
      });
    } catch {
      return {
        items: [] as ExtractedItem[],
        stats: {
          matchCount: 0,
          numericCount: 0,
          sum: 0,
          avg: 0,
          min: null,
          max: null,
          median: null,
          allValues: [],
          numericValues: [],
          arrayLengthSum: 0,
        },
      };
    }
  }, [parsedJson, patternQuery, caseSensitive, parseNumericStrings, partialKeyMatch]);

  // Filtered discovered fields for chip display
  const filteredDiscoveredFields = useMemo(() => {
    if (!fieldFilter.trim()) return discoveredFields;
    const q = fieldFilter.toLowerCase();
    return discoveredFields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.simplifiedPath.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
    );
  }, [discoveredFields, fieldFilter]);

  // Filtered items in table
  const displayedItems = useMemo(() => {
    if (!tableSearch.trim()) return aggregationResult.items;
    const q = tableSearch.toLowerCase();
    return aggregationResult.items.filter(
      (item) =>
        item.path.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        String(item.value).toLowerCase().includes(q)
    );
  }, [aggregationResult.items, tableSearch]);

  // Copy helper
  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }, []);

  // Format JSON input
  const handleFormatJson = useCallback(() => {
    if (!parsedJson) return;
    try {
      setRawInput(JSON.stringify(parsedJson, null, 2));
    } catch {
      // Ignore
    }
  }, [parsedJson]);

  // Deep unwrap stringified JSON
  const handleUnwrapStrings = useCallback(() => {
    if (!parsedJson) return;
    try {
      const unwrapped = unwrapNestedStrings(parsedJson);
      setRawInput(JSON.stringify(unwrapped, null, 2));
    } catch {
      // Ignore
    }
  }, [parsedJson]);

  // Load sample data
  const handleLoadSample = useCallback(() => {
    setRawInput(SAMPLE_HEALTHCARE_JSON);
    setPatternQuery('services.*.companyShareAmount');
  }, []);

  // Clear all
  const handleClearAll = useCallback(() => {
    setRawInput('');
    setPatternQuery('');
  }, []);

  // Download exported data
  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const formattedOutput = useMemo(() => {
    if (activeView === 'table') return '';
    return formatExtractedValues(aggregationResult.items, activeView);
  }, [aggregationResult.items, activeView]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Calculator}
          title="JSON Path & Aggregator"
          description="Extract list items, filter properties, and calculate sum, average, min, max from nested arrays with wildcard patterns."
          badge="Path Matching & Sum"
        >
          <button
            onClick={handleLoadSample}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
            title="Load healthcare claim / invoice sample"
          >
            <Sparkles size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={handleFormatJson}
            disabled={!parsedJson}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium disabled:opacity-50"
            title="Format JSON with standard 2-space indentation"
          >
            <FileJson size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Format</span>
          </button>
          <button
            onClick={handleUnwrapStrings}
            disabled={!parsedJson}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium disabled:opacity-50"
            title="Recursively unwrap any inner stringified JSON strings"
          >
            <Wand2 size={13} className="text-neutral-500 dark:text-neutral-400" />
            <span>Unwrap Strings</span>
          </button>
          <button
            onClick={handleClearAll}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear input"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </PageHeader>

        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Main Grid: JSON Input (Left) & Aggregator Controls (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: JSON Input (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Source JSON
                  </span>
                  {parsedJson && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Valid JSON
                    </span>
                  )}
                  {jsonError && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Syntax Error
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {rawInput.length.toLocaleString()} chars
                </span>
              </div>

              <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Paste JSON array or object here..."
                  className="w-full h-[460px] p-3.5 font-mono text-xs bg-transparent border-0 resize-y focus:outline-none text-neutral-800 dark:text-neutral-200 leading-relaxed placeholder:text-neutral-400"
                  spellCheck={false}
                />
              </div>

              {jsonError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="break-all">{jsonError}</span>
                </div>
              )}
            </div>

            {/* Right Column: Query Pattern, Discovered Fields & Metrics (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Query & Pattern Search Box */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Search size={14} className="text-neutral-500" />
                    Path or Pattern Matcher
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Supports <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">services.*.field</code>, <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">services.field</code>, or key name
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={patternQuery}
                    onChange={(e) => setPatternQuery(e.target.value)}
                    placeholder="e.g. services.*.companyShareAmount or companyShareAmount"
                    className="w-full text-xs font-mono py-2.5 pl-3 pr-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 text-neutral-900 dark:text-neutral-100"
                  />
                  {patternQuery && (
                    <button
                      onClick={() => setPatternQuery('')}
                      className="absolute right-2 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Option Toggles */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100">
                    <input
                      type="checkbox"
                      checked={partialKeyMatch}
                      onChange={(e) => setPartialKeyMatch(e.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                    />
                    <span>Partial Key Match (<code className="font-mono text-[11px]">companyShare</code>)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100">
                    <input
                      type="checkbox"
                      checked={parseNumericStrings}
                      onChange={(e) => setParseNumericStrings(e.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                    />
                    <span>Parse Numeric Strings</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                    />
                    <span>Case Sensitive</span>
                  </label>
                </div>
              </div>

              {/* Detected Fields Pill Bar (Clickable Shortcuts) */}
              {discoveredFields.length > 0 && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] p-3.5 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                        <Layers size={13} />
                        Auto-Detected Fields ({discoveredFields.length})
                      </span>
                      <span className="text-[11px] text-neutral-400">Click any field to calculate</span>
                    </div>

                    {discoveredFields.length > 8 && (
                      <div className="relative w-36">
                        <input
                          type="text"
                          value={fieldFilter}
                          onChange={(e) => setFieldFilter(e.target.value)}
                          placeholder="Filter fields..."
                          className="w-full text-[11px] py-1 px-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {filteredDiscoveredFields.slice(0, 30).map((field) => {
                      const isSelected = patternQuery === field.simplifiedPath || patternQuery === field.key;
                      return (
                        <button
                          key={field.simplifiedPath}
                          onClick={() => setPatternQuery(field.simplifiedPath)}
                          className={`group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm'
                              : 'bg-neutral-50 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600'
                          }`}
                          title={`Path: ${field.simplifiedPath} | Count: ${field.count}${field.sum !== undefined ? ` | Sum: ${field.sum}` : ''}`}
                        >
                          <span>{field.simplifiedPath}</span>
                          {field.numericCount > 0 && field.sum !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                isSelected
                                  ? 'bg-neutral-700 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              Σ {field.sum.toLocaleString()}
                            </span>
                          )}
                          {field.isArrayField && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              array
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aggregation Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* SUM CARD (High-emphasis) */}
                <div className="col-span-2 rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sigma size={14} />
                      Total Sum
                    </span>
                    <button
                      onClick={() => handleCopy(String(aggregationResult.stats.sum), 'sum')}
                      className="text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium px-2 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300/40 dark:border-emerald-800/40"
                    >
                      {copiedKey === 'sum' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'sum' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-950 dark:text-emerald-100 tracking-tight">
                    {aggregationResult.stats.numericCount > 0
                      ? aggregationResult.stats.sum.toLocaleString(undefined, { maximumFractionDigits: 6 })
                      : '0'}
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                    Summed from {aggregationResult.stats.numericCount} numeric {aggregationResult.stats.numericCount === 1 ? 'value' : 'values'}
                  </div>
                </div>

                {/* COUNT CARD */}
                <div className="rounded-xl p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                    Matches
                  </span>
                  <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {aggregationResult.stats.matchCount}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {aggregationResult.stats.numericCount} numeric
                  </div>
                </div>

                {/* AVERAGE CARD */}
                <div className="rounded-xl p-3.5 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Average
                    </span>
                    {aggregationResult.stats.numericCount > 0 && (
                      <button
                        onClick={() => handleCopy(String(aggregationResult.stats.avg), 'avg')}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Copy Average"
                      >
                        {copiedKey === 'avg' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {aggregationResult.stats.numericCount > 0
                      ? aggregationResult.stats.avg.toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : '0'}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Median: {aggregationResult.stats.median ?? 'N/A'}
                  </div>
                </div>

                {/* MIN / MAX CARD */}
                <div className="col-span-2 sm:col-span-4 rounded-xl p-3 bg-neutral-100/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-neutral-400 uppercase text-[10px] tracking-wider block">Min</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {aggregationResult.stats.min !== null ? aggregationResult.stats.min : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 uppercase text-[10px] tracking-wider block">Max</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {aggregationResult.stats.max !== null ? aggregationResult.stats.max : '—'}
                      </span>
                    </div>
                    {aggregationResult.stats.arrayLengthSum > 0 && (
                      <div>
                        <span className="text-neutral-400 uppercase text-[10px] tracking-wider block">Total Sub-items</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {aggregationResult.stats.arrayLengthSum} items
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-neutral-400 text-[11px]">
                    Matched pattern: <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">{patternQuery || 'none'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Values Viewer (Table, JSON, Lines, CSV) */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] shadow-sm overflow-hidden">
            {/* Viewer Header */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Extracted Items ({aggregationResult.items.length})
                </span>

                {/* View Tabs */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => setActiveView('table')}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeView === 'table'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <TableIcon size={12} />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeView === 'json'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Code2 size={12} />
                    <span>JSON Array</span>
                  </button>
                  <button
                    onClick={() => setActiveView('newline')}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeView === 'newline'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <ListOrdered size={12} />
                    <span>Values List</span>
                  </button>
                  <button
                    onClick={() => setActiveView('csv')}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      activeView === 'csv'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Download size={12} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Right Controls: Filter table or Copy */}
              <div className="flex items-center gap-2">
                {activeView === 'table' && (
                  <div className="relative w-44">
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Filter results..."
                      className="w-full text-xs py-1.5 pl-7 pr-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                    />
                    <Filter size={12} className="absolute left-2.5 top-2.5 text-neutral-400" />
                  </div>
                )}

                <button
                  onClick={() => {
                    const text = activeView === 'table'
                      ? formatExtractedValues(aggregationResult.items, 'newline')
                      : formattedOutput;
                    handleCopy(text, 'viewContent');
                  }}
                  disabled={aggregationResult.items.length === 0}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium disabled:opacity-50 text-neutral-700 dark:text-neutral-300"
                >
                  {copiedKey === 'viewContent' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedKey === 'viewContent' ? 'Copied' : 'Copy All'}</span>
                </button>

                <button
                  onClick={() => {
                    const text = formatExtractedValues(aggregationResult.items, activeView === 'table' ? 'csv' : activeView);
                    const ext = activeView === 'json' ? 'json' : activeView === 'csv' || activeView === 'table' ? 'csv' : 'txt';
                    handleDownload(text, `extracted-values.${ext}`);
                  }}
                  disabled={aggregationResult.items.length === 0}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium disabled:opacity-50 text-neutral-700 dark:text-neutral-300"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="p-0 max-h-[420px] overflow-y-auto">
              {aggregationResult.items.length === 0 ? (
                <div className="py-12 px-4 text-center text-neutral-400 dark:text-neutral-500">
                  <Calculator size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No matching fields found for query &ldquo;{patternQuery}&rdquo;.</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Try clicking one of the auto-detected fields above or typing a key name.</p>
                </div>
              ) : activeView === 'table' ? (
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 z-10 text-neutral-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">JSON Path</th>
                      <th className="py-2.5 px-4">Parent Context</th>
                      <th className="py-2.5 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                    {displayedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                      >
                        <td className="py-2 px-4 text-center text-neutral-400">{item.index}</td>
                        <td className="py-2 px-4 text-neutral-600 dark:text-neutral-400 break-all">
                          {item.path}
                        </td>
                        <td className="py-2 px-4 text-[11px] text-neutral-500">
                          {item.parentContext ? (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(item.parentContext).slice(0, 3).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-sans"
                                >
                                  {k}: <strong className="font-mono">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-700">—</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded ${
                              item.isNumeric
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {Array.isArray(item.value)
                              ? `Array(${item.value.length})`
                              : typeof item.value === 'object' && item.value !== null
                              ? '{...}'
                              : String(item.value)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre className="p-4 text-xs font-mono text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {formattedOutput}
                </pre>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
