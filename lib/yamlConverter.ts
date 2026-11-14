/**
 * YAML and JSON conversion.
 *
 * Uses js-yaml rather than a hand written parser: YAML has anchors, multi
 * document streams, block scalars, implicit typing and significant whitespace,
 * and getting any of those subtly wrong corrupts config silently. `JSON_SCHEMA`
 * plus `load` (never `loadAll` with custom types) keeps parsing to plain data,
 * so no YAML tag can construct an arbitrary object.
 */
import { load, dump, JSON_SCHEMA, YAMLException } from 'js-yaml';

export interface ConversionResult {
  ok: boolean;
  output: string;
  error?: string;
  /** Line the parser objected to, when it reported one. */
  errorLine?: number;
}

export interface YamlOptions {
  indent?: number;
  /** Sort object keys, which makes two configs comparable. */
  sortKeys?: boolean;
  /** Keep strings on one line rather than wrapping them. */
  noWrap?: boolean;
}

function describeError(error: unknown): { message: string; line?: number } {
  if (error instanceof YAMLException) {
    const line = error.mark?.line;
    return {
      message: error.reason || error.message,
      line: typeof line === 'number' ? line + 1 : undefined,
    };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'That input could not be converted.' };
}

export function yamlToJson(yaml: string, indent = 2): ConversionResult {
  if (!yaml.trim()) return { ok: false, output: '', error: 'Enter some YAML.' };

  try {
    // JSON_SCHEMA refuses custom tags, so nothing beyond plain data is built.
    const parsed = load(yaml, { schema: JSON_SCHEMA });
    // A document of nothing but comments or whitespace loads as null.
    if (parsed === undefined || parsed === null) {
      return { ok: false, output: '', error: 'That YAML is empty.' };
    }
    return { ok: true, output: JSON.stringify(parsed, null, indent) };
  } catch (error) {
    const { message, line } = describeError(error);
    return { ok: false, output: '', error: message, errorLine: line };
  }
}

export function jsonToYaml(json: string, options: YamlOptions = {}): ConversionResult {
  if (!json.trim()) return { ok: false, output: '', error: 'Enter some JSON.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      ok: false,
      output: '',
      error: error instanceof Error ? error.message : 'That JSON is not valid.',
    };
  }

  try {
    const output = dump(parsed, {
      indent: options.indent ?? 2,
      sortKeys: options.sortKeys ?? false,
      lineWidth: options.noWrap ? -1 : 80,
      schema: JSON_SCHEMA,
      noRefs: true,
    });
    return { ok: true, output };
  } catch (error) {
    return { ok: false, output: '', error: describeError(error).message };
  }
}

/** Reformats YAML through a parse and dump round trip, normalising it. */
export function formatYaml(yaml: string, options: YamlOptions = {}): ConversionResult {
  const asJson = yamlToJson(yaml);
  if (!asJson.ok) return asJson;
  return jsonToYaml(asJson.output, options);
}

export function isProbablyYaml(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  // A mapping line: an optionally quoted key, which may contain spaces, then a colon.
  const mappingLine = /^\s*(?:"[^"]*"|'[^']*'|[\w.$-]+)\s*:(\s|$)/m;
  return mappingLine.test(trimmed) || trimmed.startsWith('---') || /^-\s+/m.test(trimmed);
}

export const YAML_SAMPLE = `# Service configuration
name: payments-api
replicas: 3
image:
  repository: registry.internal/payments
  tag: "2.11.4"
env:
  - name: LOG_LEVEL
    value: info
  - name: TIMEOUT_MS
    value: "5000"
resources:
  limits:
    cpu: "1"
    memory: 512Mi
healthcheck:
  path: /health
  intervalSeconds: 10
`;
