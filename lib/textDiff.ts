/**
 * Text diffing.
 *
 * Built on diff-match-patch, which is already a dependency. Two views are
 * produced from the same comparison: a character level diff for prose, and a
 * line aligned diff for code and logs, where whole-line granularity is what
 * people actually read.
 */
import DiffMatchPatch from 'diff-match-patch';

export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffSegment {
  op: DiffOp;
  text: string;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
  /** Characters, or lines, depending on which view produced the stats. */
  unit: 'characters' | 'lines';
}

export interface LineDiffRow {
  op: DiffOp;
  text: string;
  leftNumber?: number;
  rightNumber?: number;
}

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  trimLines?: boolean;
}

const OP_BY_CODE: Record<number, DiffOp> = {
  [-1]: 'delete',
  0: 'equal',
  1: 'insert',
};

function normalise(text: string, options: DiffOptions): string {
  let result = text;
  if (options.ignoreCase) result = result.toLowerCase();
  if (options.ignoreWhitespace) result = result.replace(/[ \t]+/g, ' ');
  if (options.trimLines) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }
  return result;
}

export function diffCharacters(left: string, right: string, options: DiffOptions = {}): DiffSegment[] {
  const engine = new DiffMatchPatch();
  const diffs = engine.diff_main(normalise(left, options), normalise(right, options));
  // Collapses the single character noise diff_main produces into readable runs.
  engine.diff_cleanupSemantic(diffs);

  return diffs.map(([code, text]) => ({ op: OP_BY_CODE[code], text }));
}

export function segmentStats(segments: DiffSegment[]): DiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const segment of segments) {
    if (segment.op === 'insert') added += segment.text.length;
    else if (segment.op === 'delete') removed += segment.text.length;
    else unchanged += segment.text.length;
  }

  return { added, removed, unchanged, unit: 'characters' };
}

/**
 * Line level diff.
 *
 * diff-match-patch works on characters, so the standard trick is to map each
 * distinct line to a single character, diff that, and map back.
 */
export function diffLines(left: string, right: string, options: DiffOptions = {}): LineDiffRow[] {
  const engine = new DiffMatchPatch();
  const leftText = normalise(left, options);
  const rightText = normalise(right, options);

  const { chars1, chars2, lineArray } = engine.diff_linesToChars_(leftText, rightText);
  const diffs = engine.diff_main(chars1, chars2, false);
  engine.diff_charsToLines_(diffs, lineArray);

  const rows: LineDiffRow[] = [];
  let leftNumber = 0;
  let rightNumber = 0;

  for (const [code, text] of diffs) {
    const op = OP_BY_CODE[code];
    const lines = text.split('\n');
    // A trailing newline produces an empty final element that is not a line.
    if (lines[lines.length - 1] === '') lines.pop();

    for (const line of lines) {
      if (op === 'equal') {
        leftNumber += 1;
        rightNumber += 1;
        rows.push({ op, text: line, leftNumber, rightNumber });
      } else if (op === 'delete') {
        leftNumber += 1;
        rows.push({ op, text: line, leftNumber });
      } else {
        rightNumber += 1;
        rows.push({ op, text: line, rightNumber });
      }
    }
  }

  return rows;
}

export function lineStats(rows: LineDiffRow[]): DiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const row of rows) {
    if (row.op === 'insert') added += 1;
    else if (row.op === 'delete') removed += 1;
    else unchanged += 1;
  }

  return { added, removed, unchanged, unit: 'lines' };
}

export function areIdentical(left: string, right: string, options: DiffOptions = {}): boolean {
  return normalise(left, options) === normalise(right, options);
}

/** Unified diff text, for pasting into a review or an issue. */
export function toUnifiedDiff(rows: LineDiffRow[], leftLabel = 'a', rightLabel = 'b'): string {
  const lines = [`--- ${leftLabel}`, `+++ ${rightLabel}`];

  for (const row of rows) {
    if (row.op === 'insert') lines.push(`+${row.text}`);
    else if (row.op === 'delete') lines.push(`-${row.text}`);
    else lines.push(` ${row.text}`);
  }

  return lines.join('\n');
}
