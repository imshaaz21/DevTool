/**
 * SQL Date & Timestamp Range Generator
 * Generates accurate WHERE clauses for Oracle and PostgreSQL.
 * Supports Timezone selection (Default: Saudi Arabia AST / UTC+3) with automatic conversion to UTC for databases.
 */

export type DatabaseDialect = 'oracle' | 'postgres';

export type DatePreset =
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thisYear'
  | 'lastNdays'
  | 'custom';

export type OperatorType = 'between' | 'gte_lte' | 'gte' | 'lte';

export type ClausePrefix = 'AND' | 'WHERE' | 'none';

export type PrecisionType = 'seconds' | 'milliseconds';

export type TimezoneOption = 'Asia/Riyadh' | 'UTC' | 'Asia/Colombo' | 'local';

export const TIMEZONE_OPTIONS: { id: TimezoneOption; label: string; offsetLabel: string }[] = [
  { id: 'Asia/Riyadh', label: 'Saudi Arabia (AST)', offsetLabel: 'UTC+3' },
  { id: 'UTC', label: 'UTC / GMT', offsetLabel: 'UTC+0' },
  { id: 'Asia/Colombo', label: 'Sri Lanka / India (IST)', offsetLabel: 'UTC+5:30' },
  { id: 'local', label: 'Browser Local', offsetLabel: 'Local' },
];

export interface SqlDateFilterOptions {
  columnName: string;
  dialect?: DatabaseDialect;
  operator: OperatorType;
  preset: DatePreset;
  startDate?: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm:ss
  endDate?: string;
  lastN?: number; // for 'lastNdays'
  prefix?: ClausePrefix;
  precision?: PrecisionType;
  inputTimezone?: TimezoneOption; // Default: 'Asia/Riyadh'
  convertToUtc?: boolean; // Default: true
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Gets current date/time components in a specific timezone
 */
export function getNowInTimezone(tz: TimezoneOption): {
  year: number;
  month: number; // 1-indexed
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz === 'local' ? undefined : tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => {
    const p = parts.find((pt) => pt.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hours: get('hour') === 24 ? 0 : get('hour'),
    minutes: get('minute'),
    seconds: get('second'),
  };
}

/**
 * Parses a date-time string interpreted in a specific timezone into a standard Date object
 */
export function parseDateTimeInTz(dtStr: string, tz: TimezoneOption): Date {
  const cleaned = dtStr.replace(' ', 'T');
  const [datePart, timePart = '00:00:00'] = cleaned.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const timePieces = timePart.split(':');
  const hour = Number(timePieces[0] || 0);
  const minute = Number(timePieces[1] || 0);
  const secPieces = (timePieces[2] || '0').split('.');
  const second = Number(secPieces[0] || 0);
  const millisecond = Number(secPieces[1] || 0);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const isoBase = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}`;

  if (tz === 'UTC') {
    return new Date(`${isoBase}Z`);
  }
  if (tz === 'Asia/Riyadh') {
    return new Date(`${isoBase}+03:00`);
  }
  if (tz === 'Asia/Colombo') {
    return new Date(`${isoBase}+05:30`);
  }
  // Local browser
  return new Date(year, month - 1, day, hour, minute, second, millisecond);
}

/**
 * Formats a Date object in UTC (YYYY-MM-DD HH:mm:ss or .SSS)
 */
export function formatUtcDateString(date: Date, includeMillis = false): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  if (includeMillis) {
    const millis = pad(date.getUTCMilliseconds(), 3);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Helper to format a Date into local/system YYYY-MM-DD HH:mm:ss or with .SSS
 */
export function formatDateString(date: Date, includeMillis = false): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  if (includeMillis) {
    const millis = pad(date.getMilliseconds(), 3);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Calculates start and end Date objects for a given preset in a specified timezone
 */
export function getPresetDateRange(
  preset: DatePreset,
  referenceDate = new Date(),
  lastN = 30,
  tz: TimezoneOption = 'Asia/Riyadh'
): DateRange {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const nowTz = getNowInTimezone(tz);

  switch (preset) {
    case 'today': {
      const startStr = `${nowTz.year}-${pad(nowTz.month)}-${pad(nowTz.day)}T00:00:00.000`;
      const endStr = `${nowTz.year}-${pad(nowTz.month)}-${pad(nowTz.day)}T23:59:59.999`;
      return {
        start: parseDateTimeInTz(startStr, tz),
        end: parseDateTimeInTz(endStr, tz),
      };
    }
    case 'yesterday': {
      const yesterday = new Date(Date.UTC(nowTz.year, nowTz.month - 1, nowTz.day - 1));
      const yYear = yesterday.getUTCFullYear();
      const yMonth = yesterday.getUTCMonth() + 1;
      const yDay = yesterday.getUTCDate();

      const startStr = `${yYear}-${pad(yMonth)}-${pad(yDay)}T00:00:00.000`;
      const endStr = `${yYear}-${pad(yMonth)}-${pad(yDay)}T23:59:59.999`;
      return {
        start: parseDateTimeInTz(startStr, tz),
        end: parseDateTimeInTz(endStr, tz),
      };
    }
    case 'last7days': {
      const nowMs = parseDateTimeInTz(
        `${nowTz.year}-${pad(nowTz.month)}-${pad(nowTz.day)}T${pad(nowTz.hours)}:${pad(nowTz.minutes)}:${pad(nowTz.seconds)}.000`,
        tz
      ).getTime();
      return {
        start: new Date(nowMs - 7 * 24 * 60 * 60 * 1000),
        end: new Date(nowMs),
      };
    }
    case 'last30days': {
      const nowMs = parseDateTimeInTz(
        `${nowTz.year}-${pad(nowTz.month)}-${pad(nowTz.day)}T${pad(nowTz.hours)}:${pad(nowTz.minutes)}:${pad(nowTz.seconds)}.000`,
        tz
      ).getTime();
      return {
        start: new Date(nowMs - 30 * 24 * 60 * 60 * 1000),
        end: new Date(nowMs),
      };
    }
    case 'lastNdays': {
      const n = Math.max(1, lastN);
      const nowMs = parseDateTimeInTz(
        `${nowTz.year}-${pad(nowTz.month)}-${pad(nowTz.day)}T${pad(nowTz.hours)}:${pad(nowTz.minutes)}:${pad(nowTz.seconds)}.000`,
        tz
      ).getTime();
      return {
        start: new Date(nowMs - n * 24 * 60 * 60 * 1000),
        end: new Date(nowMs),
      };
    }
    case 'thisMonth': {
      const lastDay = new Date(Date.UTC(nowTz.year, nowTz.month, 0)).getUTCDate();
      const startStr = `${nowTz.year}-${pad(nowTz.month)}-01T00:00:00.000`;
      const endStr = `${nowTz.year}-${pad(nowTz.month)}-${pad(lastDay)}T23:59:59.999`;
      return {
        start: parseDateTimeInTz(startStr, tz),
        end: parseDateTimeInTz(endStr, tz),
      };
    }
    case 'lastMonth': {
      const prevMonthDate = new Date(Date.UTC(nowTz.year, nowTz.month - 2, 1));
      const lmYear = prevMonthDate.getUTCFullYear();
      const lmMonth = prevMonthDate.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(lmYear, lmMonth, 0)).getUTCDate();

      const startStr = `${lmYear}-${pad(lmMonth)}-01T00:00:00.000`;
      const endStr = `${lmYear}-${pad(lmMonth)}-${pad(lastDay)}T23:59:59.999`;
      return {
        start: parseDateTimeInTz(startStr, tz),
        end: parseDateTimeInTz(endStr, tz),
      };
    }
    case 'thisYear': {
      const startStr = `${nowTz.year}-01-01T00:00:00.000`;
      const endStr = `${nowTz.year}-12-31T23:59:59.999`;
      return {
        start: parseDateTimeInTz(startStr, tz),
        end: parseDateTimeInTz(endStr, tz),
      };
    }
    case 'custom':
    default: {
      const ref = new Date(referenceDate);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(ref);
      return { start, end };
    }
  }
}

/**
 * Generates Oracle SQL date clause
 */
export function generateOracleClause(
  column: string,
  startStr: string,
  endStr: string,
  operator: OperatorType,
  precision: PrecisionType,
  prefix: string
): string {
  const isMillis = precision === 'milliseconds';
  const func = isMillis ? 'TO_TIMESTAMP' : 'TO_DATE';
  const formatMask = isMillis ? `'YYYY-MM-DD HH24:MI:SS.FF3'` : `'YYYY-MM-DD HH24:MI:SS'`;

  const sVal = `${func}('${startStr}', ${formatMask})`;
  const eVal = `${func}('${endStr}', ${formatMask})`;

  let expr = '';
  switch (operator) {
    case 'between':
      expr = `${column} BETWEEN ${sVal} AND ${eVal}`;
      break;
    case 'gte_lte':
      expr = `${column} >= ${sVal} AND ${column} <= ${eVal}`;
      break;
    case 'gte':
      expr = `${column} >= ${sVal}`;
      break;
    case 'lte':
      expr = `${column} <= ${eVal}`;
      break;
  }

  return prefix ? `${prefix} ${expr}` : expr;
}

/**
 * Generates dynamic relative Oracle clause (e.g. SYSDATE)
 */
export function generateOracleDynamic(
  column: string,
  preset: DatePreset,
  prefix: string,
  lastN = 30
): string {
  let expr = '';
  switch (preset) {
    case 'today':
      expr = `${column} >= TRUNC(SYSDATE) AND ${column} < TRUNC(SYSDATE) + 1`;
      break;
    case 'yesterday':
      expr = `${column} >= TRUNC(SYSDATE) - 1 AND ${column} < TRUNC(SYSDATE)`;
      break;
    case 'last7days':
      expr = `${column} >= SYSDATE - 7`;
      break;
    case 'last30days':
      expr = `${column} >= SYSDATE - 30`;
      break;
    case 'lastNdays':
      expr = `${column} >= SYSDATE - ${Math.max(1, lastN)}`;
      break;
    case 'thisMonth':
      expr = `${column} >= TRUNC(SYSDATE, 'MM') AND ${column} < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)`;
      break;
    case 'lastMonth':
      expr = `${column} >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1) AND ${column} < TRUNC(SYSDATE, 'MM')`;
      break;
    case 'thisYear':
      expr = `${column} >= TRUNC(SYSDATE, 'YYYY') AND ${column} < ADD_MONTHS(TRUNC(SYSDATE, 'YYYY'), 12)`;
      break;
    default:
      return '';
  }

  return prefix ? `${prefix} ${expr}` : expr;
}

/**
 * Generates PostgreSQL SQL date clause
 */
export function generatePostgresClause(
  column: string,
  startStr: string,
  endStr: string,
  operator: OperatorType,
  prefix: string,
  castType: 'literal' | 'cast' = 'literal'
): string {
  const sVal = castType === 'cast' ? `'${startStr}'::timestamp` : `'${startStr}'`;
  const eVal = castType === 'cast' ? `'${endStr}'::timestamp` : `'${endStr}'`;

  let expr = '';
  switch (operator) {
    case 'between':
      expr = `${column} BETWEEN ${sVal} AND ${eVal}`;
      break;
    case 'gte_lte':
      expr = `${column} >= ${sVal} AND ${column} <= ${eVal}`;
      break;
    case 'gte':
      expr = `${column} >= ${sVal}`;
      break;
    case 'lte':
      expr = `${column} <= ${eVal}`;
      break;
  }

  return prefix ? `${prefix} ${expr}` : expr;
}

/**
 * Generates dynamic relative PostgreSQL clause (e.g. NOW(), DATE_TRUNC)
 */
export function generatePostgresDynamic(
  column: string,
  preset: DatePreset,
  prefix: string,
  lastN = 30
): string {
  let expr = '';
  switch (preset) {
    case 'today':
      expr = `${column} >= CURRENT_DATE AND ${column} < CURRENT_DATE + INTERVAL '1 day'`;
      break;
    case 'yesterday':
      expr = `${column} >= CURRENT_DATE - INTERVAL '1 day' AND ${column} < CURRENT_DATE`;
      break;
    case 'last7days':
      expr = `${column} >= NOW() - INTERVAL '7 days'`;
      break;
    case 'last30days':
      expr = `${column} >= NOW() - INTERVAL '30 days'`;
      break;
    case 'lastNdays':
      expr = `${column} >= NOW() - INTERVAL '${Math.max(1, lastN)} days'`;
      break;
    case 'thisMonth':
      expr = `${column} >= DATE_TRUNC('month', CURRENT_DATE) AND ${column} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`;
      break;
    case 'lastMonth':
      expr = `${column} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND ${column} < DATE_TRUNC('month', CURRENT_DATE)`;
      break;
    case 'thisYear':
      expr = `${column} >= DATE_TRUNC('year', CURRENT_DATE) AND ${column} < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'`;
      break;
    default:
      return '';
  }

  return prefix ? `${prefix} ${expr}` : expr;
}

export interface DialectQueryResults {
  oracleStandard: string;
  oracleTimestamp: string;
  oracleDynamic?: string;
  postgresStandard: string;
  postgresCast: string;
  postgresDynamic?: string;
  startDateFormatted: string;
  endDateFormatted: string;
  inputStartDateFormatted: string;
  inputEndDateFormatted: string;
  timezoneLabel: string;
  isConvertedToUtc: boolean;
}

/**
 * Main coordinator function to generate queries across Oracle & PostgreSQL with timezone support
 */
export function generateAllSqlDateClauses(
  options: SqlDateFilterOptions,
  referenceDate = new Date()
): DialectQueryResults {
  const {
    columnName = 'BI.CREATED_DATE',
    operator = 'between',
    preset = 'last30days',
    precision = 'seconds',
    prefix = 'AND',
    lastN = 30,
    inputTimezone = 'Asia/Riyadh',
    convertToUtc = true,
  } = options;

  let start: Date;
  let end: Date;

  if (preset === 'custom' && options.startDate && options.endDate) {
    start = parseDateTimeInTz(options.startDate, inputTimezone);
    end = parseDateTimeInTz(options.endDate, inputTimezone);
    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date();
  } else {
    const range = getPresetDateRange(preset, referenceDate, lastN, inputTimezone);
    start = range.start;
    end = range.end;
  }

  const isMillis = precision === 'milliseconds';

  // Format strings for SQL: Either converted to UTC (default) or kept in local time
  const startSec = convertToUtc ? formatUtcDateString(start, false) : formatDateString(start, false);
  const endSec = convertToUtc ? formatUtcDateString(end, false) : formatDateString(end, false);
  const startMillis = convertToUtc ? formatUtcDateString(start, true) : formatDateString(start, true);
  const endMillis = convertToUtc ? formatUtcDateString(end, true) : formatDateString(end, true);

  const prefixStr = prefix === 'none' ? '' : prefix;

  // Oracle
  const oracleStandard = generateOracleClause(columnName, startSec, endSec, operator, 'seconds', prefixStr);
  const oracleTimestamp = generateOracleClause(columnName, startMillis, endMillis, operator, 'milliseconds', prefixStr);
  const oracleDynamic = generateOracleDynamic(columnName, preset, prefixStr, lastN);

  // Postgres
  const chosenStart = isMillis ? startMillis : startSec;
  const chosenEnd = isMillis ? endMillis : endSec;
  const postgresStandard = generatePostgresClause(columnName, chosenStart, chosenEnd, operator, prefixStr, 'literal');
  const postgresCast = generatePostgresClause(columnName, chosenStart, chosenEnd, operator, prefixStr, 'cast');
  const postgresDynamic = generatePostgresDynamic(columnName, preset, prefixStr, lastN);

  // Display strings for the UI input values
  const inputStartDateFormatted = formatDateString(start, isMillis);
  const inputEndDateFormatted = formatDateString(end, isMillis);

  const tzObj = TIMEZONE_OPTIONS.find((t) => t.id === inputTimezone) || TIMEZONE_OPTIONS[0];

  return {
    oracleStandard,
    oracleTimestamp,
    oracleDynamic: oracleDynamic || undefined,
    postgresStandard,
    postgresCast,
    postgresDynamic: postgresDynamic || undefined,
    startDateFormatted: chosenStart,
    endDateFormatted: chosenEnd,
    inputStartDateFormatted,
    inputEndDateFormatted,
    timezoneLabel: tzObj.label,
    isConvertedToUtc: convertToUtc,
  };
}
