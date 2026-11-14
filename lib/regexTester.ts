/**
 * Regular expression testing.
 *
 * Runs the pattern against the subject with a hard cap on matches and a wall
 * clock budget, because a pattern that backtracks catastrophically would
 * otherwise freeze the tab, and this tool exists to be pointed at exactly those.
 */
export const MAX_MATCHES = 1000;
export const TIME_BUDGET_MS = 750;

export interface RegexMatch {
  index: number;
  length: number;
  value: string;
  /** Capture groups by position. A group that did not participate is undefined. */
  groups: Array<string | undefined>;
  /** Named capture groups. Kept separate: JavaScript exposes no index to name map. */
  named: Record<string, string | undefined>;
}

export interface RegexResult {
  valid: boolean;
  error?: string;
  matches: RegexMatch[];
  matchCount: number;
  /** True when the cap or the time budget stopped the search early. */
  truncated: boolean;
  /** Set when a replacement was requested. */
  replaced?: string;
}

export const SUPPORTED_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;
export type RegexFlag = (typeof SUPPORTED_FLAGS)[number];

export const FLAG_DESCRIPTIONS: Record<RegexFlag, string> = {
  g: 'global - find every match, not just the first',
  i: 'ignore case',
  m: 'multiline - ^ and $ match at line breaks',
  s: 'dotall - . also matches a newline',
  u: 'unicode - treat the pattern as unicode code points',
  y: 'sticky - match only from lastIndex',
};

function failure(error: string): RegexResult {
  return { valid: false, error, matches: [], matchCount: 0, truncated: false };
}

export function compileRegex(pattern: string, flags: string): RegExp | string {
  const unknown = flags.split('').filter((flag) => !SUPPORTED_FLAGS.includes(flag as RegexFlag));
  if (unknown.length > 0) return `Unknown flag${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`;
  if (new Set(flags.split('')).size !== flags.length) return 'That flag is repeated.';

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    return error instanceof Error ? error.message : 'That pattern is not valid.';
  }
}

function toMatch(execResult: RegExpExecArray): RegexMatch {
  return {
    index: execResult.index,
    length: execResult[0].length,
    value: execResult[0],
    groups: execResult.slice(1) as Array<string | undefined>,
    named: { ...(execResult.groups ?? {}) },
  };
}

export function testRegex(
  pattern: string,
  flags: string,
  subject: string,
  replacement?: string
): RegexResult {
  if (!pattern) return failure('Enter a pattern.');

  const compiled = compileRegex(pattern, flags);
  if (typeof compiled === 'string') return failure(compiled);

  const matches: RegexMatch[] = [];
  let truncated = false;

  // Without /g, exec returns the first match only, so there is nothing to loop.
  if (!flags.includes('g')) {
    const single = compiled.exec(subject);
    if (single) matches.push(toMatch(single));
  } else {
    const startedAt = Date.now();
    const global = new RegExp(compiled.source, compiled.flags);
    let execResult = global.exec(subject);

    while (execResult !== null) {
      matches.push(toMatch(execResult));

      if (matches.length >= MAX_MATCHES || Date.now() - startedAt > TIME_BUDGET_MS) {
        truncated = true;
        break;
      }

      // A zero width match would otherwise spin on the same index forever.
      if (execResult[0] === '') global.lastIndex += 1;
      execResult = global.exec(subject);
    }
  }

  const result: RegexResult = {
    valid: true,
    matches,
    matchCount: matches.length,
    truncated,
  };

  if (replacement !== undefined) {
    try {
      result.replaced = subject.replace(new RegExp(compiled.source, compiled.flags), replacement);
    } catch {
      result.replaced = subject;
    }
  }

  return result;
}

/** Escapes a literal so it can be dropped into a pattern safely. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function describeFlags(flags: string): string[] {
  return flags
    .split('')
    .filter((flag): flag is RegexFlag => SUPPORTED_FLAGS.includes(flag as RegexFlag))
    .map((flag) => `${flag}: ${FLAG_DESCRIPTIONS[flag]}`);
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/** Splits the subject into alternating plain and matched segments for display. */
export function toHighlightSegments(subject: string, matches: RegexMatch[]): HighlightSegment[] {
  if (matches.length === 0) return subject ? [{ text: subject, isMatch: false }] : [];

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.index > cursor) {
      segments.push({ text: subject.slice(cursor, match.index), isMatch: false });
    }
    if (match.length > 0) {
      segments.push({ text: subject.slice(match.index, match.index + match.length), isMatch: true });
    }
    cursor = Math.max(cursor, match.index + match.length);
  }

  if (cursor < subject.length) {
    segments.push({ text: subject.slice(cursor), isMatch: false });
  }

  return segments;
}

export const REGEX_PRESETS: Array<{ label: string; pattern: string; flags: string }> = [
  { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', flags: 'g' },
  { label: 'URL', pattern: 'https?://[^\\s"<>]+', flags: 'g' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi' },
  { label: 'ISO date', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { label: 'Hex colour', pattern: '#(?:[0-9a-f]{3}|[0-9a-f]{6})\\b', flags: 'gi' },
];
