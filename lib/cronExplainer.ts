/**
 * Cron expression parsing and explanation.
 *
 * Supports the common 5 field form (minute hour day-of-month month day-of-week)
 * and the 6 field form with leading seconds, plus `*`, ranges, lists, steps and
 * three letter month and weekday names. Vendor extensions such as `L`, `W` and
 * `#` are rejected explicitly rather than silently mis-parsed.
 */
export interface CronFieldSpec {
  name: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

export interface ParsedField {
  spec: CronFieldSpec;
  raw: string;
  values: number[];
  /** True when the field matches every value, which reads better in a summary. */
  isWildcard: boolean;
}

export interface CronParseResult {
  valid: boolean;
  error?: string;
  /** 5 or 6, depending on whether seconds were given. */
  fieldCount: number;
  fields: ParsedField[];
  description: string;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DAY_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const SECOND_SPEC: CronFieldSpec = { name: 'second', min: 0, max: 59 };

const FIVE_FIELD_SPECS: CronFieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTH_NAMES },
  { name: 'day of week', min: 0, max: 6, names: DAY_NAMES },
];

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// `#` and `?` cannot appear in a month or weekday name, so they are safe to
// reject on sight. `L` and `W` are rejected only after name lookup fails,
// because JUL and WED contain them.
const UNSUPPORTED_SYMBOL = /[#?]/;
const UNSUPPORTED_LETTER = /[LW]/i;

function vendorExtension(token: string): Error {
  return new Error(
    `"${token}" uses a vendor extension (L, W, # or ?) that this parser does not support.`
  );
}

function parseTerm(term: string, spec: CronFieldSpec): number[] {
  if (UNSUPPORTED_SYMBOL.test(term)) throw vendorExtension(term);

  const [rangePart, stepPart] = term.split('/');
  let step = 1;
  if (stepPart !== undefined) {
    if (!/^\d+$/.test(stepPart)) throw new Error(`"${term}" has a step that is not a number.`);
    step = Number(stepPart);
    if (step === 0) throw new Error(`"${term}" has a step of zero.`);
  }

  let start: number;
  let end: number;

  if (rangePart === '*' || rangePart === '') {
    start = spec.min;
    end = spec.max;
  } else if (rangePart.includes('-')) {
    const [from, to] = rangePart.split('-');
    start = toNumber(from, spec);
    end = toNumber(to, spec);
    if (start > end) throw new Error(`"${term}" counts down, which cron does not allow.`);
  } else {
    start = toNumber(rangePart, spec);
    end = stepPart === undefined ? start : spec.max;
  }

  const values: number[] = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
}

function toNumber(token: string, spec: CronFieldSpec): number {
  const upper = token.toUpperCase();
  const named = spec.names?.[upper];
  if (named === undefined && UNSUPPORTED_LETTER.test(token)) throw vendorExtension(token);
  const value = named ?? Number(token);

  if (!Number.isInteger(value)) {
    throw new Error(`"${token}" is not a valid ${spec.name}.`);
  }
  // Cron accepts 7 for Sunday as well as 0.
  const normalised = spec.name === 'day of week' && value === 7 ? 0 : value;
  if (normalised < spec.min || normalised > spec.max) {
    throw new Error(`"${token}" is outside ${spec.min}-${spec.max} for ${spec.name}.`);
  }
  return normalised;
}

function parseField(raw: string, spec: CronFieldSpec): ParsedField {
  if (!raw) throw new Error(`Missing ${spec.name}.`);

  const values = new Set<number>();
  for (const term of raw.split(',')) {
    for (const value of parseTerm(term.trim(), spec)) values.add(value);
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  const isWildcard = sorted.length === spec.max - spec.min + 1;
  return { spec, raw, values: sorted, isWildcard };
}

function listToText(values: number[], labels: string[]): string {
  const names = values.map((value) => labels[value]);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function describeTime(fields: Record<string, ParsedField>): string {
  const minute = fields.minute;
  const hour = fields.hour;
  const second = fields.second;

  const secondPrefix = second && !second.isWildcard && second.values.length === 1
    ? `:${pad(second.values[0])}`
    : '';

  if (minute.isWildcard && hour.isWildcard) return 'Every minute';
  if (minute.values.length === 1 && hour.values.length === 1) {
    return `At ${pad(hour.values[0])}:${pad(minute.values[0])}${secondPrefix}`;
  }
  if (hour.isWildcard && minute.values.length === 1) {
    return `At minute ${minute.values[0]} of every hour`;
  }
  if (minute.isWildcard && hour.values.length === 1) {
    return `Every minute of the ${pad(hour.values[0])} hour`;
  }

  const minuteText = minute.isWildcard ? 'every minute' : `minute ${minute.values.join(', ')}`;
  const hourText = hour.isWildcard ? 'every hour' : `hour ${hour.values.join(', ')}`;
  return `At ${minuteText} past ${hourText}`;
}

export function parseCron(expression: string): CronParseResult {
  const tokens = expression.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { valid: false, error: 'Enter a cron expression.', fieldCount: 0, fields: [], description: '' };
  }
  if (tokens.length !== 5 && tokens.length !== 6) {
    return {
      valid: false,
      error: `Expected 5 fields, or 6 with seconds. Got ${tokens.length}.`,
      fieldCount: tokens.length,
      fields: [],
      description: '',
    };
  }

  const hasSeconds = tokens.length === 6;
  const specs = hasSeconds ? [SECOND_SPEC, ...FIVE_FIELD_SPECS] : FIVE_FIELD_SPECS;

  const fields: ParsedField[] = [];
  try {
    for (let i = 0; i < specs.length; i += 1) {
      fields.push(parseField(tokens[i], specs[i]));
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Could not parse that expression.',
      fieldCount: tokens.length,
      fields: [],
      description: '',
    };
  }

  const byName: Record<string, ParsedField> = {};
  for (const field of fields) byName[field.spec.name.replace(/ /g, '')] = field;
  byName.minute = fields[hasSeconds ? 1 : 0];
  byName.hour = fields[hasSeconds ? 2 : 1];
  if (hasSeconds) byName.second = fields[0];

  const dayOfMonth = fields[hasSeconds ? 3 : 2];
  const month = fields[hasSeconds ? 4 : 3];
  const dayOfWeek = fields[hasSeconds ? 5 : 4];

  const parts: string[] = [describeTime(byName)];

  if (!dayOfWeek.isWildcard) {
    parts.push(`on ${listToText(dayOfWeek.values, DAY_LABELS)}`);
  }
  if (!dayOfMonth.isWildcard) {
    parts.push(`on day ${dayOfMonth.values.join(', ')} of the month`);
  }
  if (!month.isWildcard) {
    parts.push(`in ${listToText(month.values.map((m) => m - 1), MONTH_LABELS)}`);
  }
  if (dayOfWeek.isWildcard && dayOfMonth.isWildcard && month.isWildcard) {
    parts.push('every day');
  }

  return {
    valid: true,
    fieldCount: tokens.length,
    fields,
    description: `${parts.join(', ')}.`,
  };
}

/** Upper bound on the minutes searched when looking for the next run. */
const SEARCH_MINUTES = 366 * 24 * 60;

/**
 * Next run times, in UTC. Walks forward a minute at a time, which is simple and
 * fast enough for a year of search, and stops rather than looping forever on an
 * expression that can never fire (29 February on a non leap year, for example).
 */
export function nextRuns(expression: string, from: Date, count = 5): Date[] {
  const parsed = parseCron(expression);
  if (!parsed.valid) return [];

  const hasSeconds = parsed.fieldCount === 6;
  const minute = parsed.fields[hasSeconds ? 1 : 0];
  const hour = parsed.fields[hasSeconds ? 2 : 1];
  const dayOfMonth = parsed.fields[hasSeconds ? 3 : 2];
  const month = parsed.fields[hasSeconds ? 4 : 3];
  const dayOfWeek = parsed.fields[hasSeconds ? 5 : 4];

  const runs: Date[] = [];
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  for (let step = 0; step < SEARCH_MINUTES && runs.length < count; step += 1) {
    const matchesDayOfMonth = dayOfMonth.values.includes(cursor.getUTCDate());
    const matchesDayOfWeek = dayOfWeek.values.includes(cursor.getUTCDay());

    // Cron ORs the two day fields unless both are restricted to everything.
    const dayMatches =
      dayOfMonth.isWildcard && dayOfWeek.isWildcard
        ? true
        : dayOfMonth.isWildcard
          ? matchesDayOfWeek
          : dayOfWeek.isWildcard
            ? matchesDayOfMonth
            : matchesDayOfMonth || matchesDayOfWeek;

    if (
      minute.values.includes(cursor.getUTCMinutes()) &&
      hour.values.includes(cursor.getUTCHours()) &&
      month.values.includes(cursor.getUTCMonth() + 1) &&
      dayMatches
    ) {
      runs.push(new Date(cursor.getTime()));
    }

    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }

  return runs;
}

export const CRON_PRESETS: Array<{ label: string; expression: string }> = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Weekdays at 09:00', expression: '0 9 * * MON-FRI' },
  { label: 'Every Sunday 03:30', expression: '30 3 * * SUN' },
  { label: 'First of the month', expression: '0 0 1 * *' },
  { label: 'Quarterly', expression: '0 0 1 JAN,APR,JUL,OCT *' },
];
