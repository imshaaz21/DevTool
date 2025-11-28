/**
 * Utility functions for JSON formatting
 */

export interface FormatterResult {
    success: boolean;
    formatted?: string;
    error?: string;
    iterations?: number;
}

/**
 * Recursively parse stringified JSON
 * If the value is a string that contains JSON, parse it
 * If the parsed result is still a string containing JSON, parse again
 */
export function parseStringifiedJSON(input: string): FormatterResult {
    let current = input.trim();
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    // Remove surrounding quotes if present
    if (current.startsWith('"') && current.endsWith('"')) {
        current = current.slice(1, -1);
    }

    try {
        while (iterations < maxIterations) {
            iterations++;

            try {
                // Try to parse the current value
                const parsed = JSON.parse(current);

                // If it's a string, we might need to parse again
                if (typeof parsed === 'string') {
                    // Check if this string looks like JSON
                    const trimmed = parsed.trim();
                    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                        current = trimmed;
                        continue; // Parse again
                    } else {
                        // It's a plain string, not JSON
                        return {
                            success: true,
                            formatted: JSON.stringify(parsed, null, 2),
                            iterations
                        };
                    }
                } else {
                    // It's an object or array, we're done
                    // Now check for nested stringified values
                    const unwrapped = unwrapNestedStrings(parsed);
                    return {
                        success: true,
                        formatted: JSON.stringify(unwrapped, null, 2),
                        iterations
                    };
                }
            } catch (parseError) {
                // If parsing fails, try to unescape and parse again
                if (current.includes('\\')) {
                    try {
                        // Try unescaping
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

        return {
            success: false,
            error: 'Maximum parsing iterations reached. The input might be too deeply nested.'
        };
    } catch (error) {
        return {
            success: false,
            error: `Invalid JSON: ${(error as Error).message}`
        };
    }
}

/**
 * Recursively unwrap nested stringified JSON values in an object or array
 */
function unwrapNestedStrings(obj: any): any {
    if (typeof obj === 'string') {
        // Try to parse this string as JSON
        const trimmed = obj.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(obj);
                // Recursively unwrap the parsed value
                return unwrapNestedStrings(parsed);
            } catch {
                // If it fails to parse, return as is
                return obj;
            }
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(item => unwrapNestedStrings(item));
    } else if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = unwrapNestedStrings(value);
        }
        return result;
    }

    return obj;
}

/**
 * Format JSON with proper indentation
 */
export function formatJSON(input: string, indent: number = 2): FormatterResult {
    try {
        const parsed = JSON.parse(input);
        return {
            success: true,
            formatted: JSON.stringify(parsed, null, indent)
        };
    } catch (error) {
        return {
            success: false,
            error: `Invalid JSON: ${(error as Error).message}`
        };
    }
}

/**
 * Minify JSON (remove all whitespace)
 */
export function minifyJSON(input: string): FormatterResult {
    try {
        const parsed = JSON.parse(input);
        return {
            success: true,
            formatted: JSON.stringify(parsed)
        };
    } catch (error) {
        return {
            success: false,
            error: `Invalid JSON: ${(error as Error).message}`
        };
    }
}

/**
 * Escape JSON string for use in another JSON
 */
export function escapeJSON(input: string): FormatterResult {
    try {
        // First validate it's valid JSON
        JSON.parse(input);
        // Then escape it
        const escaped = JSON.stringify(input);
        return {
            success: true,
            formatted: escaped
        };
    } catch (error) {
        return {
            success: false,
            error: `Invalid JSON: ${(error as Error).message}`
        };
    }
}
