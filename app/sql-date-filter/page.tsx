'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { CustomSelect } from '@/components/CustomSelect';
import {
  CalendarRange,
  Copy,
  Check,
  RotateCcw,
  Database,
  SlidersHorizontal,
  Terminal,
  Globe,
  ArrowRight,
} from 'lucide-react';
import {
  DatePreset,
  OperatorType,
  ClausePrefix,
  PrecisionType,
  TimezoneOption,
  TIMEZONE_OPTIONS,
  generateAllSqlDateClauses,
  getPresetDateRange,
  formatForDatetimeInput,
} from '@/lib/sqlDateFilter';
import { useCopyFeedback } from '@/lib/clipboard';

const SAMPLE_COLUMNS = [
  'BI.CREATED_DATE',
  'created_at',
  'ORDER_TIMESTAMP',
  'PAYMENT_DATE',
  'updated_at',
  'TXN_DATETIME',
];

export default function SqlDateFilterPage() {
  const { isCollapsed } = useSidebar();

  // Filter configuration states
  const [columnName, setColumnName] = useState<string>('BI.CREATED_DATE');
  const [preset, setPreset] = useState<DatePreset>('last30days');
  const [operator, setOperator] = useState<OperatorType>('between');
  const [prefix, setPrefix] = useState<ClausePrefix>('AND');
  const [precision, setPrecision] = useState<PrecisionType>('seconds');
  const [lastN, setLastN] = useState<number>(30);
  const [inputTimezone, setInputTimezone] = useState<TimezoneOption>('Asia/Riyadh');
  const [convertToUtc, setConvertToUtc] = useState<boolean>(true);

  // Custom date range state (in datetime-local format: YYYY-MM-DDTHH:mm)
  const defaultDates = useMemo(() => {
    const { start, end } = getPresetDateRange('last30days', new Date(), 30, 'Asia/Riyadh');
    return {
      start: formatForDatetimeInput(start, 'Asia/Riyadh'),
      end: formatForDatetimeInput(end, 'Asia/Riyadh'),
    };
  }, []);

  const [customStart, setCustomStart] = useState<string>(defaultDates.start);
  const [customEnd, setCustomEnd] = useState<string>(defaultDates.end);

  // Custom Full Query simulation
  const [baseTable, setBaseTable] = useState<string>('BANK_INVOICE BI');

  // Copy handler
  const { copiedKey, handleCopy } = useCopyFeedback();

  // When preset changes, update custom inputs for easy tweaking
  const handlePresetSelect = (newPreset: DatePreset, tz = inputTimezone) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const { start, end } = getPresetDateRange(newPreset, new Date(), lastN, tz);
      setCustomStart(formatForDatetimeInput(start, tz));
      setCustomEnd(formatForDatetimeInput(end, tz));
    }
  };

  const handleLastNChange = (value: string) => {
    const n = Math.max(1, parseInt(value, 10) || 1);
    setLastN(n);
    const { start, end } = getPresetDateRange('lastNdays', new Date(), n, inputTimezone);
    setCustomStart(formatForDatetimeInput(start, inputTimezone));
    setCustomEnd(formatForDatetimeInput(end, inputTimezone));
  };

  const handleTimezoneChange = (newTz: TimezoneOption) => {
    setInputTimezone(newTz);
    handlePresetSelect(preset, newTz);
  };

  // Generate all SQL output results
  const queryResults = useMemo(() => {
    return generateAllSqlDateClauses({
      columnName: columnName.trim() || 'BI.CREATED_DATE',
      operator,
      preset,
      startDate: customStart,
      endDate: customEnd,
      precision,
      prefix,
      lastN,
      inputTimezone,
      convertToUtc,
    });
  }, [columnName, operator, preset, customStart, customEnd, precision, prefix, lastN, inputTimezone, convertToUtc]);

  // Simulated full query
  const fullOracleQuery = useMemo(() => {
    return `SELECT *\nFROM ${baseTable || 'MY_TABLE T'}\nWHERE 1=1\n  ${queryResults.oracleStandard};`;
  }, [baseTable, queryResults.oracleStandard]);

  const fullPostgresQuery = useMemo(() => {
    return `SELECT *\nFROM ${baseTable || 'my_table t'}\nWHERE 1=1\n  ${queryResults.postgresStandard};`;
  }, [baseTable, queryResults.postgresStandard]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={CalendarRange}
          title="SQL Date & Timestamp Range Generator"
          description="Generate accurate WHERE clause filters for Oracle (TO_DATE, TO_TIMESTAMP) and PostgreSQL with automatic conversion to UTC."
          badge="Oracle & PostgreSQL"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setColumnName('BI.CREATED_DATE');
                setInputTimezone('Asia/Riyadh');
                setConvertToUtc(true);
                handlePresetSelect('last30days', 'Asia/Riyadh');
                setOperator('between');
                setPrecision('seconds');
                setPrefix('AND');
              }}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
              title="Reset to default (Saudi AST ➔ UTC, Last 1 Month)"
            >
              <RotateCcw size={13} className="text-neutral-500" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => handleCopy(queryResults.oracleStandard, 'header_oracle')}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
              title="Copy Oracle WHERE clause"
            >
              {copiedKey === 'header_oracle' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey === 'header_oracle' ? 'Copied Oracle!' : 'Copy Oracle'}</span>
            </button>
          </div>
        </PageHeader>

        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Main Controls Panel */}
          <section className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-4">
            {/* Header with live conversion banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Filter Configuration (Oracle & PostgreSQL)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 rounded-md">
                <Globe size={12} className="text-emerald-500 shrink-0" />
                <span>Input: {queryResults.timezoneLabel}</span>
                {convertToUtc && (
                  <>
                    <ArrowRight size={10} className="text-neutral-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SQL: UTC</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Date Range Presets
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'last30days', label: 'Last 1 Month (30 Days)' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'lastMonth', label: 'Last Month (Calendar)' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last7days', label: 'Last 7 Days' },
                  { id: 'lastNdays', label: 'Last N Days' },
                  { id: 'thisYear', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePresetSelect(item.id as DatePreset)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      preset === item.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {preset === 'lastNdays' && (
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Number of days (N)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={lastN}
                    onChange={(e) => handleLastNChange(e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                </div>
              )}
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
              {/* Column Name */}
              <div className="space-y-1.5 xl:col-span-2">
                <label className="font-medium text-neutral-600 dark:text-neutral-400">
                  Target Column / Expression
                </label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g. BI.CREATED_DATE"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {SAMPLE_COLUMNS.slice(0, 3).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColumnName(col)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span>Input Time Zone</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Default: Saudi</span>
                </label>
                <CustomSelect
                  value={inputTimezone}
                  onChange={(val) => handleTimezoneChange(val as TimezoneOption)}
                  options={TIMEZONE_OPTIONS.map((t) => ({
                    label: `${t.label} (${t.offsetLabel})`,
                    value: t.id,
                  }))}
                />
              </div>

              {/* Operator */}
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-600 dark:text-neutral-400">SQL Operator</label>
                <CustomSelect
                  value={operator}
                  onChange={(val) => setOperator(val as OperatorType)}
                  options={[
                    { label: 'BETWEEN ... AND ...', value: 'between' },
                    { label: '>= start AND <= end', value: 'gte_lte' },
                    { label: '>= start (Greater or Equal)', value: 'gte' },
                    { label: '<= end (Less or Equal)', value: 'lte' },
                  ]}
                />
              </div>

              {/* Clause Prefix */}
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-600 dark:text-neutral-400">Clause Prefix</label>
                <CustomSelect
                  value={prefix}
                  onChange={(val) => setPrefix(val as ClausePrefix)}
                  options={[
                    { label: 'AND (Filter appending)', value: 'AND' },
                    { label: 'WHERE (Beginning of filter)', value: 'WHERE' },
                    { label: 'None (Plain condition)', value: 'none' },
                  ]}
                />
              </div>

              {/* Precision */}
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-600 dark:text-neutral-400">Time Precision</label>
                <CustomSelect
                  value={precision}
                  onChange={(val) => setPrecision(val as PrecisionType)}
                  options={[
                    { label: 'Seconds (HH:mm:ss)', value: 'seconds' },
                    { label: 'Milliseconds (.SSS / .FF3)', value: 'milliseconds' },
                  ]}
                />
              </div>
            </div>

            {/* Custom Datetime Pickers and UTC Conversion Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs items-center">
              <div className="space-y-1.5 lg:col-span-4">
                <label className="font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span>Start Date & Time</span>
                  <span className="text-[10px] text-neutral-400">{queryResults.timezoneLabel}</span>
                </label>
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <div className="space-y-1.5 lg:col-span-4">
                <label className="font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span>End Date & Time</span>
                  <span className="text-[10px] text-neutral-400">{queryResults.timezoneLabel}</span>
                </label>
                <input
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              {/* UTC Toggle Checkbox */}
              <div className="lg:col-span-4 flex items-center gap-2 pt-4 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-800 dark:text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={convertToUtc}
                    onChange={(e) => setConvertToUtc(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                  />
                  <span>Convert to UTC in SQL (Recommended for DBs)</span>
                </label>
              </div>
            </div>

            {/* Timezone Translation Live Banner */}
            <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">Input ({queryResults.timezoneLabel}):</span>
                <span>{queryResults.inputStartDateFormatted} ➔ {queryResults.inputEndDateFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">Output in SQL:</span>
                <span>
                  {convertToUtc ? (
                    <strong>{queryResults.startDateFormatted} ➔ {queryResults.endDateFormatted} (UTC)</strong>
                  ) : (
                    <span>{queryResults.startDateFormatted} ➔ {queryResults.endDateFormatted} (Direct)</span>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Dialect Result Cards Grid (Only Oracle & PostgreSQL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Oracle Card */}
            <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={15} className="text-red-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Oracle Database
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                      TO_DATE / TO_TIMESTAMP
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(precision === 'seconds' ? queryResults.oracleStandard : queryResults.oracleTimestamp, 'oracle_std')}
                    className="btn-secondary flex items-center gap-1 text-[11px] py-1 px-2 rounded-md font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
                  >
                    {copiedKey === 'oracle_std' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'oracle_std' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Standard TO_DATE / TO_TIMESTAMP clause with light & dark high contrast */}
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {precision === 'seconds' ? queryResults.oracleStandard : queryResults.oracleTimestamp}
                </div>

                {/* Oracle Dynamic Expression (if available) */}
                {queryResults.oracleDynamic && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Dynamic Relative Expression (SYSDATE):</span>
                      <button
                        onClick={() => handleCopy(queryResults.oracleDynamic!, 'oracle_dyn')}
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
                      >
                        {copiedKey === 'oracle_dyn' ? <Check size={11} /> : <Copy size={11} />}
                        <span>Copy Dynamic</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-200 overflow-x-auto select-all">
                      {queryResults.oracleDynamic}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-neutral-400 pt-2">
                Ideal for Oracle PL/SQL, SQL*Plus, and SQL Developer queries.
              </div>
            </div>

            {/* PostgreSQL Card */}
            <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={15} className="text-blue-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      PostgreSQL
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                      Literal / ::timestamp
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(queryResults.postgresStandard, 'pg_std')}
                    className="btn-secondary flex items-center gap-1 text-[11px] py-1 px-2 rounded-md font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
                  >
                    {copiedKey === 'pg_std' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'pg_std' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Standard PostgreSQL literal clause with light & dark high contrast */}
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {queryResults.postgresStandard}
                </div>

                {/* Explicit Cast ::timestamp */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span>With Explicit Type Cast (::timestamp):</span>
                    <button
                      onClick={() => handleCopy(queryResults.postgresCast, 'pg_cast')}
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
                    >
                      {copiedKey === 'pg_cast' ? <Check size={11} /> : <Copy size={11} />}
                      <span>Copy Cast</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-200 overflow-x-auto select-all">
                    {queryResults.postgresCast}
                  </div>
                </div>

                {/* PostgreSQL Dynamic Interval (if available) */}
                {queryResults.postgresDynamic && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Dynamic Relative Expression (NOW() / INTERVAL):</span>
                      <button
                        onClick={() => handleCopy(queryResults.postgresDynamic!, 'pg_dyn')}
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
                      >
                        {copiedKey === 'pg_dyn' ? <Check size={11} /> : <Copy size={11} />}
                        <span>Copy Dynamic</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-neutral-200 overflow-x-auto select-all">
                      {queryResults.postgresDynamic}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-neutral-400 pt-2">
                Compatible with PostgreSQL 10+ and Supabase / RDS Postgres.
              </div>
            </div>
          </div>

          {/* Full Query Simulation Box */}
          <section className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Full Query Preview
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-neutral-400">Table & Alias:</label>
                <input
                  type="text"
                  value={baseTable}
                  onChange={(e) => setBaseTable(e.target.value)}
                  placeholder="e.g. BANK_INVOICE BI"
                  className="px-2.5 py-1 text-xs font-mono rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
                  <span>Oracle Query</span>
                  <button
                    onClick={() => handleCopy(fullOracleQuery, 'full_oracle')}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
                  >
                    {copiedKey === 'full_oracle' ? <Check size={11} /> : <Copy size={11} />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto leading-relaxed select-all">
                  {fullOracleQuery}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
                  <span>PostgreSQL Query</span>
                  <button
                    onClick={() => handleCopy(fullPostgresQuery, 'full_pg')}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
                  >
                    {copiedKey === 'full_pg' ? <Check size={11} /> : <Copy size={11} />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto leading-relaxed select-all">
                  {fullPostgresQuery}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
