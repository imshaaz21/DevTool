/**
 * Utility functions for JSON formatting, stringified JSON unescaping, and deep inner unwrapping.
 */

export interface FormatterResult {
  success: boolean;
  formatted?: string;
  error?: string;
  iterations?: number;
  unwrappedCount?: number;
}

/**
 * Attempts to parse a string as JSON if it represents an object or array.
 * Includes fallback heuristics for escaped quotes and backslashes.
 */
export function cleanAndParseJsonString(str: string): any {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (
    !((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')))
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed !== null && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Try unescaping backslash-escaped quotes and characters often found in log exports
    try {
      const unescaped = trimmed.replace(/\\\\"/g, '"').replace(/\\"/g, '"');
      const parsed = JSON.parse(unescaped);
      if (parsed !== null && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Recursively unwraps nested stringified JSON values in an object or array.
 * Traverses objects and arrays to arbitrary depth and parses any inner stringified JSON.
 */
export function unwrapNestedStrings(
  obj: any,
  state: { count: number } = { count: 0 },
  depth = 0,
  maxDepth = 25
): any {
  if (depth > maxDepth) return obj;

  if (typeof obj === 'string') {
    const parsed = cleanAndParseJsonString(obj);
    if (parsed !== null && typeof parsed === 'object') {
      state.count++;
      return unwrapNestedStrings(parsed, state, depth + 1, maxDepth);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => unwrapNestedStrings(item, state, depth + 1, maxDepth));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = unwrapNestedStrings(value, state, depth + 1, maxDepth);
    }
    return result;
  }

  return obj;
}

/**
 * Parses any JSON string, whether standard, outer-stringified (escaped with quotes),
 * or containing inner stringified JSON properties.
 */
export function parseStringifiedJSON(
  input: string,
  unwrapInner = true,
  indent = 2
): FormatterResult {
  if (!input || !input.trim()) {
    return { success: false, error: 'Empty JSON input' };
  }

  let current = input.trim();
  let iterations = 0;
  const maxIterations = 10;

  // Strip wrapping outer quotes if needed
  if (current.startsWith('"') && current.endsWith('"')) {
    try {
      current = JSON.parse(current);
    } catch {
      current = current.slice(1, -1);
    }
  }

  try {
    let parsed: any;
    while (iterations < maxIterations) {
      iterations++;

      try {
        parsed = JSON.parse(current);

        // If the parsed result is still a string, it might be doubly stringified
        if (typeof parsed === 'string') {
          const trimmed = parsed.trim();
          if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
          ) {
            current = trimmed;
            continue;
          } else {
            // It's a plain string, not JSON
            return {
              success: true,
              formatted: JSON.stringify(parsed, null, indent),
              iterations,
              unwrappedCount: 0,
            };
          }
        }
        break;
      } catch (parseError) {
        // If parsing fails and contains escaped characters, attempt unescaping
        if (current.includes('\\')) {
          try {
            current = JSON.parse(`"${current}"`);
            continue;
          } catch {
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }
    }

    const state = { count: 0 };
    const finalObj = unwrapInner ? unwrapNestedStrings(parsed, state) : parsed;

    return {
      success: true,
      formatted: JSON.stringify(finalObj, null, indent),
      iterations,
      unwrappedCount: state.count,
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${(error as Error).message}`,
    };
  }
}

/**
 * Format JSON with proper indentation and optional automatic inner unwrap.
 */
export function formatJSON(
  input: string,
  indent = 2,
  unwrapInner = true
): FormatterResult {
  if (!input || !input.trim()) {
    return { success: false, error: 'Empty JSON input' };
  }

  // If unwrapInner is enabled, use the deep recursive parser
  if (unwrapInner) {
    return parseStringifiedJSON(input, true, indent);
  }

  try {
    const parsed = JSON.parse(input);
    return {
      success: true,
      formatted: JSON.stringify(parsed, null, indent),
      unwrappedCount: 0,
    };
  } catch (error) {
    // If standard JSON.parse fails, try parseStringifiedJSON as fallback
    return parseStringifiedJSON(input, false, indent);
  }
}

/**
 * Minify JSON (remove all whitespace), optionally unwrapping inner stringified JSON first.
 */
export function minifyJSON(input: string, unwrapInner = false): FormatterResult {
  if (!input || !input.trim()) {
    return { success: false, error: 'Empty JSON input' };
  }

  if (unwrapInner) {
    const res = parseStringifiedJSON(input, true, 0);
    if (!res.success) return res;
    try {
      const obj = JSON.parse(res.formatted || '');
      return {
        success: true,
        formatted: JSON.stringify(obj),
        unwrappedCount: res.unwrappedCount,
      };
    } catch {
      return res;
    }
  }

  try {
    const parsed = JSON.parse(input);
    return {
      success: true,
      formatted: JSON.stringify(parsed),
      unwrappedCount: 0,
    };
  } catch (error) {
    // Attempt stringified parse
    const res = parseStringifiedJSON(input, false, 0);
    if (res.success && res.formatted) {
      try {
        const obj = JSON.parse(res.formatted);
        return {
          success: true,
          formatted: JSON.stringify(obj),
          unwrappedCount: 0,
        };
      } catch {
        return res;
      }
    }
    return {
      success: false,
      error: `Invalid JSON: ${(error as Error).message}`,
    };
  }
}

/**
 * Escape JSON string for use in another JSON payload.
 */
export function escapeJSON(input: string): FormatterResult {
  try {
    JSON.parse(input);
    const escaped = JSON.stringify(input);
    return {
      success: true,
      formatted: escaped,
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${(error as Error).message}`,
    };
  }
}
