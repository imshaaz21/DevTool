/**
 * .env file parsing.
 *
 * Follows the shape dotenv accepts: KEY=value, optional `export` prefix, single
 * or double quoted values, `#` comments, and blank lines. Escapes are expanded
 * only inside double quotes, which is what dotenv does.
 */
export type QuoteStyle = 'none' | 'single' | 'double';

export interface EnvEntry {
  key: string;
  value: string;
  /** Line number in the source, 1 based. */
  line: number;
  exported: boolean;
  quote: QuoteStyle;
  /** Trailing comment, if any. */
  comment?: string;
}

export interface EnvProblem {
  line: number;
  raw: string;
  reason: string;
}

export interface EnvParseResult {
  entries: EnvEntry[];
  /** Keys defined more than once. The last definition wins, as in dotenv. */
  duplicates: string[];
  problems: EnvProblem[];
}

/** Keys whose values are masked by default: anything that looks like a secret. */
const SECRET_PATTERN = /(SECRET|PASSWORD|PASSWD|TOKEN|API_?KEY|PRIVATE|CREDENTIAL|AUTH|SALT|CERT|SIGNATURE)/i;

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

function expandDoubleQuoted(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

interface ValueParts {
  value: string;
  quote: QuoteStyle;
  comment?: string;
}

function readValue(rawValue: string): ValueParts {
  const trimmed = rawValue.trim();

  if (trimmed.startsWith('"')) {
    const end = findClosingQuote(trimmed, '"');
    if (end > 0) {
      return {
        value: expandDoubleQuoted(trimmed.slice(1, end)),
        quote: 'double',
        comment: readTrailingComment(trimmed.slice(end + 1)),
      };
    }
  }

  if (trimmed.startsWith("'")) {
    const end = findClosingQuote(trimmed, "'");
    if (end > 0) {
      return {
        // Single quotes are literal in dotenv: no escape expansion.
        value: trimmed.slice(1, end),
        quote: 'single',
        comment: readTrailingComment(trimmed.slice(end + 1)),
      };
    }
  }

  // Unquoted: a # starts a comment, so only the text before it is the value.
  const hashIndex = trimmed.indexOf(' #');
  if (hashIndex >= 0) {
    return {
      value: trimmed.slice(0, hashIndex).trim(),
      quote: 'none',
      comment: trimmed.slice(hashIndex + 2).trim() || undefined,
    };
  }

  return { value: trimmed, quote: 'none' };
}

function findClosingQuote(text: string, quote: string): number {
  for (let i = 1; i < text.length; i += 1) {
    if (text[i] === '\\') {
      i += 1;
      continue;
    }
    if (text[i] === quote) return i;
  }
  return -1;
}

function readTrailingComment(rest: string): string | undefined {
  const trimmed = rest.trim();
  if (!trimmed.startsWith('#')) return undefined;
  return trimmed.slice(1).trim() || undefined;
}

export function parseEnv(text: string): EnvParseResult {
  const entries: EnvEntry[] = [];
  const problems: EnvProblem[] = [];
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith('#')) return;

    const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const exported = withoutExport !== trimmed;

    const separator = withoutExport.indexOf('=');
    if (separator === -1) {
      problems.push({ line, raw, reason: 'No "=" on this line.' });
      return;
    }

    const key = withoutExport.slice(0, separator).trim();
    if (!key) {
      problems.push({ line, raw, reason: 'Missing a key before "=".' });
      return;
    }
    if (!KEY_PATTERN.test(key)) {
      problems.push({
        line,
        raw,
        reason: `"${key}" is not a valid key. Use letters, digits and underscores.`,
      });
      return;
    }

    const { value, quote, comment } = readValue(withoutExport.slice(separator + 1));

    const previous = seen.get(key);
    if (previous !== undefined && !duplicates.includes(key)) duplicates.push(key);
    seen.set(key, line);

    entries.push({ key, value, line, exported, quote, comment });
  });

  return { entries, duplicates, problems };
}

export function isSecretKey(key: string): boolean {
  return SECRET_PATTERN.test(key);
}

/** Replaces secret-looking values, so a parsed file can be shared or screenshotted. */
export function maskSecrets(entries: EnvEntry[]): EnvEntry[] {
  return entries.map((entry) =>
    isSecretKey(entry.key) ? { ...entry, value: maskValue(entry.value) } : entry
  );
}

export function maskValue(value: string): string {
  if (value.length <= 4) return '*'.repeat(value.length || 4);
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(value.length - 4, 24))}${value.slice(-2)}`;
}

/** Last definition wins, matching dotenv. */
export function toRecord(entries: EnvEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of entries) record[entry.key] = entry.value;
  return record;
}

export function toJson(entries: EnvEntry[]): string {
  return JSON.stringify(toRecord(entries), null, 2);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function toShellExport(entries: EnvEntry[]): string {
  return entries.map((entry) => `export ${entry.key}=${shellQuote(entry.value)}`).join('\n');
}

export function toDockerArgs(entries: EnvEntry[]): string {
  return entries.map((entry) => `-e ${entry.key}=${shellQuote(entry.value)}`).join(' ');
}

export function toYamlEnv(entries: EnvEntry[]): string {
  return entries.map((entry) => `  ${entry.key}: ${JSON.stringify(entry.value)}`).join('\n');
}
