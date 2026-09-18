/**
 * Utilities for extracting, filtering, and aggregating values from complex nested JSON structures.
 */

export interface ExtractedItem {
  id: string;
  index: number;
  path: string;            // e.g. "[0].services[0].companyShareAmount"
  simplifiedPath: string;  // e.g. "services.companyShareAmount"
  key: string;             // e.g. "companyShareAmount"
  value: unknown;
  isNumeric: boolean;
  numericValue: number | null;
  parentContext?: Record<string, string | number | boolean>;
}

export interface AggregationStats {
  matchCount: number;
  numericCount: number;
  sum: number;
  avg: number;
  min: number | null;
  max: number | null;
  median: number | null;
  allValues: unknown[];
  numericValues: number[];
  arrayLengthSum: number;
}

export interface DiscoveredField {
  simplifiedPath: string;  // e.g. "services.companyShareAmount"
  key: string;             // e.g. "companyShareAmount"
  type: 'number' | 'string' | 'boolean' | 'array' | 'object' | 'null' | 'mixed';
  count: number;
  numericCount: number;
  sum?: number;
  sampleValue?: string;
  isArrayField: boolean;
}

export interface AggregatorOptions {
  caseSensitive?: boolean;
  parseNumericStrings?: boolean; // Treat "96.0" as 96.0
  partialKeyMatch?: boolean;     // Match prefixes or substrings if no wildcards/dots
}

/**
 * High precision decimal addition to eliminate IEEE-754 floating point artifacts
 * e.g. 14.4 + 34.44 -> 48.84 instead of 48.84000000000001
 */
export function safeAdd(a: number, b: number): number {
  const aStr = a.toString();
  const bStr = b.toString();
  const aDec = aStr.includes('.') ? aStr.split('.')[1].length : 0;
  const bDec = bStr.includes('.') ? bStr.split('.')[1].length : 0;
  const maxDec = Math.min(Math.max(aDec, bDec), 10);
  const factor = Math.pow(10, maxDec);
  return Math.round((a + b) * factor) / factor;
}

/**
 * Rounds a number to a clean decimal representation if floating point artifacts exist.
 */
export function cleanNumber(num: number, decimals: number = 6): number {
  if (Number.isInteger(num)) return num;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Checks if a value is numeric (either a number or a numeric string if enabled).
 */
export function extractNumeric(val: unknown, parseNumericStrings: boolean = true): number | null {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (parseNumericStrings && typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

interface IndexedNode {
  path: string;           // e.g. "[0].services[0].companyShareAmount"
  dotPath: string;        // e.g. "0.services.0.companyShareAmount"
  dotPathNoRoot: string;  // e.g. "services.0.companyShareAmount"
  simplifiedPath: string; // e.g. "services.companyShareAmount"
  key: string;
  value: unknown;
  parentContext?: Record<string, string | number | boolean>;
}

/**
 * Recursively traverses a JSON structure and indexes all leaf and intermediate nodes.
 */
export function indexJsonTree(root: unknown): IndexedNode[] {
  const nodes: IndexedNode[] = [];

  function traverse(
    curr: unknown,
    rawPath: string,
    simpPath: string,
    keyName: string,
    parentObj?: Record<string, unknown>
  ) {
    if (curr === undefined) return;

    // Collect context if current is inside an object
    let parentContext: Record<string, string | number | boolean> | undefined = undefined;
    if (parentObj && typeof parentObj === 'object' && !Array.isArray(parentObj)) {
      parentContext = {};
      let count = 0;
      for (const [k, v] of Object.entries(parentObj)) {
        if (v !== null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
          parentContext[k] = v;
          count++;
          if (count >= 5) break; // Keep top 5 contextual identifier fields
        }
      }
    }

    const dotPath = rawPath.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
    const dotPathNoRoot = dotPath.replace(/^\d+\./, '');

    if (curr !== null && typeof curr === 'object') {
      if (Array.isArray(curr)) {
        // Also register array node itself (e.g. packageDetails)
        if (keyName) {
          nodes.push({
            path: rawPath,
            dotPath,
            dotPathNoRoot,
            simplifiedPath: simpPath,
            key: keyName,
            value: curr,
            parentContext,
          });
        }
        for (let i = 0; i < curr.length; i++) {
          const item = curr[i];
          const nextRaw = rawPath ? `${rawPath}[${i}]` : `[${i}]`;
          const nextSimp = simpPath ? simpPath : '';
          traverse(item, nextRaw, nextSimp, '', parentObj);
        }
      } else {
        // Object
        const obj = curr as Record<string, unknown>;
        for (const [k, v] of Object.entries(obj)) {
          const nextRaw = rawPath ? `${rawPath}.${k}` : k;
          const nextSimp = simpPath ? `${simpPath}.${k}` : k;
          traverse(v, nextRaw, nextSimp, k, obj);
        }
      }
    } else {
      // Primitive leaf node
      nodes.push({
        path: rawPath,
        dotPath,
        dotPathNoRoot,
        simplifiedPath: simpPath,
        key: keyName,
        value: curr,
        parentContext,
      });
    }
  }

  traverse(root, '', '', '');
  return nodes;
}

export interface DiscoverFieldsOptions {
  amountOrPriceOnly?: boolean;
}

/**
 * Checks if a key or path contains "amount" or "price" (case-insensitive).
 */
export function isAmountOrPriceKey(key: string, path?: string): boolean {
  return /amount|price/i.test(key) || (path ? /amount|price/i.test(path) : false);
}

/**
 * Discovers all unique fields in a JSON structure and compiles summary statistics.
 */
export function discoverFields(root: unknown, options: DiscoverFieldsOptions = {}): DiscoveredField[] {
  const { amountOrPriceOnly = false } = options;
  const nodes = indexJsonTree(root);
  const map = new Map<string, {
    simplifiedPath: string;
    key: string;
    types: Set<string>;
    count: number;
    numericCount: number;
    sum: number;
    sampleValue?: unknown;
    isArrayField: boolean;
  }>();

  for (const node of nodes) {
    if (!node.simplifiedPath && !node.key) continue;
    const pathKey = node.simplifiedPath || node.key;

    let item = map.get(pathKey);
    if (!item) {
      item = {
        simplifiedPath: pathKey,
        key: node.key || pathKey.split('.').pop() || pathKey,
        types: new Set(),
        count: 0,
        numericCount: 0,
        sum: 0,
        sampleValue: node.value,
        isArrayField: Array.isArray(node.value),
      };
      map.set(pathKey, item);
    }

    item.count++;
    if (Array.isArray(node.value)) {
      item.isArrayField = true;
      item.types.add('array');
    } else if (node.value === null) {
      item.types.add('null');
    } else {
      item.types.add(typeof node.value);
    }

    const num = extractNumeric(node.value, true);
    if (num !== null) {
      item.numericCount++;
      item.sum = safeAdd(item.sum, num);
    }
  }

  const result: DiscoveredField[] = [];
  map.forEach((item) => {
    if (amountOrPriceOnly && !isAmountOrPriceKey(item.key, item.simplifiedPath)) {
      return;
    }

    let finalType: DiscoveredField['type'] = 'string';
    if (item.types.has('number') && item.types.size === 1) {
      finalType = 'number';
    } else if (item.types.has('array') && item.types.size === 1) {
      finalType = 'array';
    } else if (item.types.has('boolean') && item.types.size === 1) {
      finalType = 'boolean';
    } else if (item.types.has('null') && item.types.size === 1) {
      finalType = 'null';
    } else if (item.types.size > 1) {
      finalType = 'mixed';
    }

    let sampleStr = '';
    if (item.sampleValue !== undefined && item.sampleValue !== null) {
      if (Array.isArray(item.sampleValue)) {
        sampleStr = `[${item.sampleValue.length} items]`;
      } else {
        sampleStr = String(item.sampleValue);
      }
    }

    result.push({
      simplifiedPath: item.simplifiedPath,
      key: item.key,
      type: finalType,
      count: item.count,
      numericCount: item.numericCount,
      sum: item.numericCount > 0 ? item.sum : undefined,
      sampleValue: sampleStr,
      isArrayField: item.isArrayField,
    });
  });

  // Sort: numeric fields first (by count and presence of sum), then alphabetically
  return result.sort((a, b) => {
    if (a.numericCount > 0 && b.numericCount === 0) return -1;
    if (b.numericCount > 0 && a.numericCount === 0) return 1;
    return a.simplifiedPath.localeCompare(b.simplifiedPath);
  });
}

/**
 * Checks if a given path/key matches the query pattern.
 */
export function matchesPattern(
  query: string,
  node: IndexedNode,
  options: AggregatorOptions = {}
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  const {
    caseSensitive = false,
    partialKeyMatch = true,
  } = options;

  const q = caseSensitive ? trimmed : trimmed.toLowerCase();
  const key = caseSensitive ? node.key : node.key.toLowerCase();
  const simp = caseSensitive ? node.simplifiedPath : node.simplifiedPath.toLowerCase();
  const raw = caseSensitive ? node.path : node.path.toLowerCase();
  const dotPath = caseSensitive ? node.dotPath : node.dotPath.toLowerCase();
  const dotPathNoRoot = caseSensitive ? node.dotPathNoRoot : node.dotPathNoRoot.toLowerCase();

  // 1. Direct exact key match
  if (key === q) return true;

  // 2. Direct exact simplified path match (e.g. services.companyShareAmount)
  if (simp === q) return true;

  // 3. Wildcard matching (e.g. services.*.companyShareAmount or *.packageDetails)
  if (q.includes('*') || q.includes('[') || q.includes(']')) {
    // Normalize user pattern: convert [x] or [*] or [] to .*
    const normalized = q
      .replace(/\[\d*\]/g, '.*')
      .replace(/\[\*\]/g, '.*');

    // Escape regex chars except *
    let regexStr = normalized
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    // If partial match is true, allow end of pattern to match prefix
    if (partialKeyMatch && !regexStr.endsWith('.*')) {
      regexStr = regexStr + '.*';
    }

    try {
      const regex = new RegExp(`^(?:\\d+\\.)?${regexStr}$`, caseSensitive ? '' : 'i');
      if (
        regex.test(dotPath) ||
        regex.test(dotPathNoRoot) ||
        regex.test(simp) ||
        regex.test(raw) ||
        regex.test(key)
      ) {
        return true;
      }
    } catch {
      // Fall through to other checks
    }
  }

  // 4. Dot notation paths without wildcards (e.g. services.companyShareAmount or services.companyShare)
  if (q.includes('.')) {
    if (simp === q || simp.endsWith(`.${q}`)) return true;
    if (partialKeyMatch && (simp.startsWith(q) || simp.includes(q))) return true;
    if (dotPathNoRoot === q || dotPathNoRoot.includes(q)) return true;
  }

  // 5. Partial key or path match (e.g. typing "companyShare" matches "companyShareAmount")
  if (partialKeyMatch) {
    if (key.includes(q)) return true;
    if (simp.includes(q)) return true;
  }

  return false;
}

/**
 * Searches and aggregates matched values according to query and options.
 */
export function aggregateJson(
  root: unknown,
  query: string,
  options: AggregatorOptions = {}
): {
  items: ExtractedItem[];
  stats: AggregationStats;
} {
  const { parseNumericStrings = true } = options;
  const nodes = indexJsonTree(root);
  const items: ExtractedItem[] = [];

  let index = 0;
  for (const node of nodes) {
    if (matchesPattern(query, node, options)) {
      const num = extractNumeric(node.value, parseNumericStrings);
      items.push({
        id: `match-${index}-${node.path}`,
        index: index + 1,
        path: node.path,
        simplifiedPath: node.simplifiedPath,
        key: node.key,
        value: node.value,
        isNumeric: num !== null,
        numericValue: num,
        parentContext: node.parentContext,
      });
      index++;
    }
  }

  // Calculate statistics
  let sum = 0;
  const numericValues: number[] = [];
  const allValues: unknown[] = [];
  let min: number | null = null;
  let max: number | null = null;
  let arrayLengthSum = 0;

  for (const item of items) {
    allValues.push(item.value);
    if (Array.isArray(item.value)) {
      arrayLengthSum += item.value.length;
    }
    if (item.numericValue !== null) {
      numericValues.push(item.numericValue);
      sum = safeAdd(sum, item.numericValue);
      if (min === null || item.numericValue < min) min = item.numericValue;
      if (max === null || item.numericValue > max) max = item.numericValue;
    }
  }

  const numericCount = numericValues.length;
  const avg = numericCount > 0 ? cleanNumber(sum / numericCount) : 0;

  // Calculate median
  let median: number | null = null;
  if (numericCount > 0) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      median = sorted[mid];
    } else {
      median = cleanNumber((sorted[mid - 1] + sorted[mid]) / 2);
    }
  }

  return {
    items,
    stats: {
      matchCount: items.length,
      numericCount,
      sum: cleanNumber(sum),
      avg,
      min,
      max,
      median,
      allValues,
      numericValues,
      arrayLengthSum,
    },
  };
}

/**
 * Prepares extracted values as a formatted string for quick clipboard copying.
 */
export function formatExtractedValues(
  items: ExtractedItem[],
  format: 'json' | 'newline' | 'csv' | 'sum'
): string {
  if (items.length === 0) return '';

  if (format === 'sum') {
    let sum = 0;
    for (const item of items) {
      if (item.numericValue !== null) {
        sum = safeAdd(sum, item.numericValue);
      }
    }
    return String(cleanNumber(sum));
  }

  if (format === 'json') {
    const values = items.map(item => item.value);
    return JSON.stringify(values, null, 2);
  }

  if (format === 'newline') {
    return items.map(item => (item.value !== null && item.value !== undefined ? String(item.value) : '')).join('\n');
  }

  if (format === 'csv') {
    const header = 'Index,Path,Key,Value';
    const rows = items.map(item => {
      const valStr = typeof item.value === 'object' ? JSON.stringify(item.value).replace(/"/g, '""') : String(item.value).replace(/"/g, '""');
      return `${item.index},"${item.path}","${item.key}","${valStr}"`;
    });
    return [header, ...rows].join('\n');
  }

  return '';
}
