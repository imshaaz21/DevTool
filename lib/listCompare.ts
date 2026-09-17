export type DelimiterOption = 'auto' | 'newline' | 'comma' | 'whitespace';
export type QuoteOption = 'none' | 'single' | 'double' | 'backtick';
export type WrapperOption = 'none' | 'sql' | 'array' | 'braces';
export type SortOption = 'none' | 'asc' | 'desc' | 'numeric';

export interface ParseOptions {
  delimiter?: DelimiterOption;
  trim?: boolean;
  stripQuotes?: boolean;
  ignoreEmpty?: boolean;
}

export interface DuplicateItem {
  value: string;
  count: number;
}

export interface ListAnalysis {
  total: number;
  unique: string[];
  duplicates: DuplicateItem[];
}

export interface CompareOptions {
  caseSensitive?: boolean;
  sort?: SortOption;
  removeDuplicates?: boolean;
}

export interface CompareResult {
  common: string[];
  onlyA: string[];
  onlyB: string[];
  union: string[];
  symmetricDiff: string[];
}

export interface FormatOptions {
  quote: QuoteOption;
  delimiter: string;
  wrapper?: WrapperOption;
}

/**
 * Parses raw text input into a string array based on chosen delimiter and clean options.
 */
export function parseList(rawText: string, options: ParseOptions = {}): string[] {
  const {
    delimiter = 'auto',
    trim = true,
    stripQuotes = false,
    ignoreEmpty = true,
  } = options;

  if (!rawText) return [];

  let rawItems: string[] = [];

  if (delimiter === 'auto') {
    // Check if multiline
    const lines = rawText.split(/\r?\n/);
    if (lines.length > 1) {
      rawItems = lines;
    } else {
      // Single line: check for comma separation
      if (rawText.includes(',')) {
        rawItems = rawText.split(',');
      } else if (rawText.includes('\t')) {
        rawItems = rawText.split('\t');
      } else {
        rawItems = [rawText];
      }
    }
  } else if (delimiter === 'newline') {
    rawItems = rawText.split(/\r?\n/);
  } else if (delimiter === 'comma') {
    rawItems = rawText.split(',');
  } else if (delimiter === 'whitespace') {
    rawItems = rawText.split(/\s+/);
  }

  let items = rawItems.map((item) => {
    let cleaned = trim ? item.trim() : item;
    if (stripQuotes) {
      cleaned = cleaned.replace(/^['"`]|['"`]$/g, '');
      if (trim) cleaned = cleaned.trim();
    }
    return cleaned;
  });

  if (ignoreEmpty) {
    items = items.filter((item) => item.length > 0);
  }

  return items;
}

/**
 * Analyzes a list of items for total count, unique entries (order preserved), and duplicate occurrences.
 */
export function analyzeList(items: string[], caseSensitive = true): ListAnalysis {
  const total = items.length;
  const countMap = new Map<string, { original: string; count: number }>();
  const unique: string[] = [];

  for (const item of items) {
    const key = caseSensitive ? item : item.toLowerCase();
    const existing = countMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      countMap.set(key, { original: item, count: 1 });
      unique.push(item);
    }
  }

  const duplicates: DuplicateItem[] = [];
  countMap.forEach(({ original, count }) => {
    if (count > 1) {
      duplicates.push({ value: original, count });
    }
  });

  return {
    total,
    unique,
    duplicates,
  };
}

/**
 * Performs set comparison operations between List A and List B.
 */
export function compareLists(
  listA: string[],
  listB: string[],
  options: CompareOptions = {}
): CompareResult {
  const { caseSensitive = true, sort = 'none', removeDuplicates = true } = options;

  const analysisA = analyzeList(listA, caseSensitive);
  const analysisB = analyzeList(listB, caseSensitive);

  const keyFn = (val: string) => (caseSensitive ? val : val.toLowerCase());

  const setBKeys = new Set(analysisB.unique.map(keyFn));
  const setAKeys = new Set(analysisA.unique.map(keyFn));

  const baseA = removeDuplicates ? analysisA.unique : listA;
  const baseB = removeDuplicates ? analysisB.unique : listB;

  // Common: in both A and B
  const common = baseA.filter((item) => setBKeys.has(keyFn(item)));

  // Only in A: in A not in B
  const onlyA = baseA.filter((item) => !setBKeys.has(keyFn(item)));

  // Only in B: in B not in A
  const onlyB = baseB.filter((item) => !setAKeys.has(keyFn(item)));

  // Union: unique in A plus only in B
  const union = removeDuplicates ? [...analysisA.unique, ...onlyB] : [...listA, ...onlyB];

  // Symmetric Difference: (only in A) + (only in B)
  const symmetricDiff = [...onlyA, ...onlyB];

  return {
    common: sortItems(common, sort),
    onlyA: sortItems(onlyA, sort),
    onlyB: sortItems(onlyB, sort),
    union: sortItems(union, sort),
    symmetricDiff: sortItems(symmetricDiff, sort),
  };
}

/**
 * Sorts string items based on sorting mode.
 */
export function sortItems(items: string[], mode: SortOption = 'none'): string[] {
  if (mode === 'none') return [...items];

  const copy = [...items];
  if (mode === 'asc') {
    return copy.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  if (mode === 'desc') {
    return copy.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
  }
  if (mode === 'numeric') {
    return copy.sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
      const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }
  return copy;
}

/**
 * Formats a list of items into a custom output string with quote styles, delimiters, and wrappers.
 */
export function formatListOutput(items: string[], options: FormatOptions): string {
  const { quote, delimiter, wrapper = 'none' } = options;

  const quotedItems = items.map((item) => {
    switch (quote) {
      case 'single':
        return `'${item}'`;
      case 'double':
        return `"${item}"`;
      case 'backtick':
        return `\`${item}\``;
      case 'none':
      default:
        return item;
    }
  });

  const joined = quotedItems.join(delimiter);

  switch (wrapper) {
    case 'sql':
      return `( ${joined} )`;
    case 'array':
      return `[ ${joined} ]`;
    case 'braces':
      return `{ ${joined} }`;
    case 'none':
    default:
      return joined;
  }
}
