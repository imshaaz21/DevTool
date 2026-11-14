/**
 * Epoch and timestamp conversion.
 *
 * Unix timestamps turn up in four different units depending on the system that
 * produced them, and getting that wrong silently shifts a date by years. The
 * unit is detected from magnitude, and always shown so the guess is visible.
 */
export type EpochUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';

export const EPOCH_UNITS: EpochUnit[] = ['seconds', 'milliseconds', 'microseconds', 'nanoseconds'];

export interface EpochBreakdown {
  valid: boolean;
  error?: string;
  /** The unit the input was read as. */
  unit: EpochUnit;
  /** True when the unit was inferred rather than given. */
  detected: boolean;
  epochSeconds: number;
  epochMillis: number;
  iso: string;
  utc: string;
  dayOfWeek: string;
  relative: string;
}

const DIVISOR: Record<EpochUnit, number> = {
  seconds: 1e-3,
  milliseconds: 1,
  microseconds: 1e3,
  nanoseconds: 1e6,
};

/** Rough ceiling for a date this century, used to tell the units apart. */
const SECONDS_CEILING = 1e11;
const MILLIS_CEILING = 1e14;
const MICROS_CEILING = 1e17;

export function detectEpochUnit(value: number): EpochUnit {
  const magnitude = Math.abs(value);
  if (magnitude < SECONDS_CEILING) return 'seconds';
  if (magnitude < MILLIS_CEILING) return 'milliseconds';
  if (magnitude < MICROS_CEILING) return 'microseconds';
  return 'nanoseconds';
}

export function toMillis(value: number, unit: EpochUnit): number {
  return value / DIVISOR[unit];
}

export function formatRelative(millis: number, now: number = Date.now()): string {
  const deltaSeconds = Math.round((millis - now) / 1000);
  // The present instant reads as past, so an unchanged timestamp says "just now".
  const past = deltaSeconds <= 0;
  const remaining = Math.abs(deltaSeconds);

  if (remaining < 45) return past ? 'just now' : 'in a moment';

  const units: Array<[string, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [name, size] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      const label = `${count} ${name}${count === 1 ? '' : 's'}`;
      return past ? `${label} ago` : `in ${label}`;
    }
  }

  return past ? `${remaining} seconds ago` : `in ${remaining} seconds`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function invalid(error: string, unit: EpochUnit = 'seconds'): EpochBreakdown {
  return {
    valid: false,
    error,
    unit,
    detected: false,
    epochSeconds: 0,
    epochMillis: 0,
    iso: '',
    utc: '',
    dayOfWeek: '',
    relative: '',
  };
}

/**
 * Reads a timestamp. `unit` forces the interpretation; leaving it out infers
 * the unit from the magnitude.
 */
export function fromEpoch(raw: string, unit?: EpochUnit, now: number = Date.now()): EpochBreakdown {
  const trimmed = raw.trim();
  if (!trimmed) return invalid('Enter a timestamp.');

  // Tolerate separators people paste from logs and spreadsheets.
  const cleaned = trimmed.replace(/[_,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return invalid('That is not a number. Use the date side to convert a date.');
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return invalid('That number is out of range.');

  const resolved = unit ?? detectEpochUnit(value);
  const millis = toMillis(value, resolved);
  const date = new Date(millis);

  if (Number.isNaN(date.getTime())) {
    return invalid('That timestamp is outside the range of a date.', resolved);
  }

  return {
    valid: true,
    unit: resolved,
    detected: unit === undefined,
    epochSeconds: Math.floor(millis / 1000),
    epochMillis: millis,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    dayOfWeek: DAY_NAMES[date.getUTCDay()],
    relative: formatRelative(millis, now),
  };
}

export interface DateToEpochResult {
  valid: boolean;
  error?: string;
  epochSeconds: number;
  epochMillis: number;
  iso: string;
}

/** Reads an ISO 8601 date, or anything else `Date` accepts, as a timestamp. */
export function fromDateString(raw: string): DateToEpochResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Enter a date.', epochSeconds: 0, epochMillis: 0, iso: '' };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return {
      valid: false,
      error: 'That is not a date this browser recognises. ISO 8601 always works.',
      epochSeconds: 0,
      epochMillis: 0,
      iso: '',
    };
  }

  return {
    valid: true,
    epochSeconds: Math.floor(parsed.getTime() / 1000),
    epochMillis: parsed.getTime(),
    iso: parsed.toISOString(),
  };
}
