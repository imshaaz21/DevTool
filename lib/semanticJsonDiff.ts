/*******************************************************************************
 * Semantic JSON Diff Engine
 * Inspired by and compatible with Zack Grossbart's jdd (jsondiff.com)
 ******************************************************************************/

export type DiffType = 'eq' | 'type' | 'missing';

export interface PathLine {
  path: string;
  line: number;
}

export interface SemanticDiff {
  id: number;
  type: DiffType;
  msg: string;
  rawMsg: string;
  path1: PathLine;
  path2: PathLine;
}

export interface Config {
  out: string;
  indent: number;
  currentPath: string[];
  paths: PathLine[];
  line: number;
  indentSpaces: string;
}

export interface DiffSummary {
  diffs: SemanticDiff[];
  leftFormatted: string;
  rightFormatted: string;
  leftLines: string[];
  rightLines: string[];
  eqCount: number;
  missingCount: number;
  typeCount: number;
}

const SEPARATOR = '/';

/**
 * Returns the precise JSON type of a value.
 */
export function getValueType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (['string', 'number', 'boolean', 'object'].includes(t)) {
    return t;
  }
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object\s+([a-zA-Z]+)\]$/, '$1')
    .toLowerCase();
}

/**
 * Unescapes special characters for formatted output so generated JSON remains valid.
 */
export function unescapeString(val: string): string {
  if (!val) return val;
  return val
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Creates a fresh format configuration.
 */
export function createConfig(indentSize = 2): Config {
  return {
    out: '',
    indent: -1,
    currentPath: [],
    paths: [],
    line: 1,
    indentSpaces: ' '.repeat(indentSize),
  };
}

export function getTabs(indent: number, indentSpaces: string): string {
  let s = '';
  for (let i = 0; i < indent; i++) {
    s += indentSpaces;
  }
  return s;
}

export function newLine(config: Config): string {
  config.line++;
  return '\n';
}

export function generatePath(config: Config, prop?: string): string {
  let s = config.currentPath.join('');
  if (prop) {
    s += SEPARATOR + prop.replace(new RegExp(SEPARATOR, 'g'), '#');
  }
  return s.length === 0 ? SEPARATOR : s;
}

export function removeTrailingComma(config: Config) {
  if (config.out.charAt(config.out.length - 1) === ',') {
    config.out = config.out.substring(0, config.out.length - 1);
  }
}

export function getSortedProperties(obj: Record<string, any>): string[] {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b));
}

export function startObject(config: Config) {
  config.indent++;
  config.out += '{';
  if (config.paths.length === 0) {
    config.paths.push({
      path: generatePath(config),
      line: config.line,
    });
  }
  if (config.indent === 0) {
    config.indent++;
  }
}

export function finishObject(config: Config) {
  if (config.indent === 0) {
    config.indent--;
  }
  removeTrailingComma(config);
  config.indent--;
  config.out += newLine(config) + getTabs(config.indent, config.indentSpaces) + '}';
  if (config.indent !== 0) {
    config.out += ',';
  } else {
    config.out += newLine(config);
  }
}

export function startArray(config: Config) {
  config.indent++;
  config.out += '[';
  if (config.paths.length === 0) {
    config.paths.push({
      path: generatePath(config),
      line: config.line,
    });
  }
  if (config.indent === 0) {
    config.indent++;
  }
}

export function finishArray(config: Config) {
  if (config.indent === 0) {
    config.indent--;
  }
  removeTrailingComma(config);
  config.indent--;
  config.out += newLine(config) + getTabs(config.indent, config.indentSpaces) + ']';
  if (config.indent !== 0) {
    config.out += ',';
  } else {
    config.out += newLine(config);
  }
}

export function formatVal(val: any, config: Config) {
  const type = getValueType(val);
  if (type === 'array') {
    config.out += '[';
    config.indent++;
    (val as any[]).forEach((item, index) => {
      config.out += newLine(config) + getTabs(config.indent, config.indentSpaces);
      config.paths.push({
        path: generatePath(config, `[${index}]`),
        line: config.line,
      });
      config.currentPath.push(`${SEPARATOR}[${index}]`);
      formatVal(item, config);
      config.currentPath.pop();
    });
    removeTrailingComma(config);
    config.indent--;
    config.out += newLine(config) + getTabs(config.indent, config.indentSpaces) + '],';
  } else if (type === 'object') {
    formatAndDecorate(config, val);
  } else if (type === 'string') {
    config.out += `"${unescapeString(val)}",`;
  } else if (type === 'number' || type === 'boolean') {
    config.out += `${val},`;
  } else if (type === 'null') {
    config.out += 'null,';
  }
}

export function formatAndDecorate(config: Config, data: any) {
  const type = getValueType(data);
  if (type === 'array') {
    formatAndDecorateArray(config, data);
    return;
  }

  if (type !== 'object' || data === null) {
    config.out += JSON.stringify(data);
    config.paths.push({
      path: generatePath(config),
      line: config.line,
    });
    return;
  }

  startObject(config);
  config.currentPath.push(SEPARATOR);

  const props = getSortedProperties(data);
  props.forEach((key) => {
    config.out +=
      newLine(config) +
      getTabs(config.indent, config.indentSpaces) +
      `"${unescapeString(key)}": `;
    config.currentPath.push(key.replace(new RegExp(SEPARATOR, 'g'), '#'));
    config.paths.push({
      path: generatePath(config),
      line: config.line,
    });
    formatVal(data[key], config);
    config.currentPath.pop();
  });

  finishObject(config);
  config.currentPath.pop();
}

export function formatAndDecorateArray(config: Config, data: any[]) {
  startArray(config);
  data.forEach((arrayVal, index) => {
    config.out += newLine(config) + getTabs(config.indent, config.indentSpaces);
    config.paths.push({
      path: generatePath(config, `[${index}]`),
      line: config.line,
    });
    config.currentPath.push(`${SEPARATOR}[${index}]`);
    formatVal(arrayVal, config);
    config.currentPath.pop();
  });
  finishArray(config);
  config.currentPath.pop();
}

/**
 * Finds matching line number for path, falling back to ancestor path if property is missing.
 */
function findPathLine(paths: PathLine[], targetPath: string): PathLine {
  let cleaned = targetPath;
  if (cleaned !== SEPARATOR && cleaned.endsWith(SEPARATOR)) {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }

  const direct = paths.find((p) => p.path === cleaned);
  if (direct) return direct;

  // Fallback to closest parent path
  let current = cleaned;
  while (current.includes(SEPARATOR) && current.length > 1) {
    const lastSlash = current.lastIndexOf(SEPARATOR);
    current = lastSlash > 0 ? current.substring(0, lastSlash) : SEPARATOR;
    const parentMatch = paths.find((p) => p.path === current);
    if (parentMatch) return parentMatch;
  }

  return paths[0] || { path: SEPARATOR, line: 1 };
}

/**
 * Generates a semantic diff entry.
 */
function generateDiff(
  config1: Config,
  path1: string,
  config2: Config,
  path2: string,
  msg: string,
  rawMsg: string,
  type: DiffType,
  id: number
): SemanticDiff {
  const pathObj1 = findPathLine(config1.paths, path1);
  const pathObj2 = findPathLine(config2.paths, path2);

  return {
    id,
    type,
    msg,
    rawMsg,
    path1: pathObj1,
    path2: pathObj2,
  };
}

/**
 * Core recursive diff engine.
 */
export function computeSemanticDiff(
  data1: any,
  data2: any,
  indentSize = 2
): DiffSummary {
  const config1 = createConfig(indentSize);
  formatAndDecorate(config1, data1);

  const config2 = createConfig(indentSize);
  formatAndDecorate(config2, data2);

  config1.currentPath = [];
  config2.currentPath = [];

  const diffs: SemanticDiff[] = [];
  let diffCounter = 0;

  function diffBool(val1: boolean, c1: Config, val2: any, c2: Config) {
    if (getValueType(val2) !== 'boolean') {
      diffCounter++;
      diffs.push(
        generateDiff(
          c1,
          generatePath(c1),
          c2,
          generatePath(c2),
          'Both types should be booleans',
          'Both types should be booleans',
          'type',
          diffCounter
        )
      );
    } else if (val1 !== val2) {
      diffCounter++;
      const msg = val1
        ? 'The left side is <code>true</code> and the right side is <code>false</code>'
        : 'The left side is <code>false</code> and the right side is <code>true</code>';
      const raw = val1
        ? 'The left side is true and the right side is false'
        : 'The left side is false and the right side is true';
      diffs.push(
        generateDiff(
          c1,
          generatePath(c1),
          c2,
          generatePath(c2),
          msg,
          raw,
          'eq',
          diffCounter
        )
      );
    }
  }

  function diffArray(val1: any[], c1: Config, val2: any, c2: Config) {
    if (getValueType(val2) !== 'array') {
      diffCounter++;
      diffs.push(
        generateDiff(
          c1,
          generatePath(c1),
          c2,
          generatePath(c2),
          'Both types should be arrays',
          'Both types should be arrays',
          'type',
          diffCounter
        )
      );
      return;
    }

    if (val1.length < val2.length) {
      for (let i = val1.length; i < val2.length; i++) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2, `[${i}]`),
            `Missing element <code>${i}</code> from the array on the left side`,
            `Missing element ${i} from the array on the left side`,
            'missing',
            diffCounter
          )
        );
      }
    }

    val1.forEach((arrayVal, index) => {
      if (val2.length <= index) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1, `[${index}]`),
            c2,
            generatePath(c2),
            `Missing element <code>${index}</code> from the array on the right side`,
            `Missing element ${index} from the array on the right side`,
            'missing',
            diffCounter
          )
        );
      } else {
        c1.currentPath.push(`${SEPARATOR}[${index}]`);
        c2.currentPath.push(`${SEPARATOR}[${index}]`);
        diffVal(arrayVal, c1, val2[index], c2);
        c1.currentPath.pop();
        c2.currentPath.pop();
      }
    });
  }

  function diffObjects(obj1: Record<string, any>, c1: Config, obj2: Record<string, any>, c2: Config) {
    c1.currentPath.push(SEPARATOR);
    c2.currentPath.push(SEPARATOR);

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check properties missing on left (present in right only)
    for (const key of keys2) {
      if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2, key),
            `Missing property <code>${key}</code> from the object on the left side`,
            `Missing property "${key}" from the object on the left side`,
            'missing',
            diffCounter
          )
        );
      }
    }

    // Check properties in obj1
    for (const key of keys1) {
      c1.currentPath.push(key.replace(new RegExp(SEPARATOR, 'g'), '#'));
      if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            `Missing property <code>${key}</code> from the object on the right side`,
            `Missing property "${key}" from the object on the right side`,
            'missing',
            diffCounter
          )
        );
      } else {
        c2.currentPath.push(key.replace(new RegExp(SEPARATOR, 'g'), '#'));
        diffVal(obj1[key], c1, obj2[key], c2);
        c2.currentPath.pop();
      }
      c1.currentPath.pop();
    }

    c1.currentPath.pop();
    c2.currentPath.pop();
  }

  function diffVal(val1: any, c1: Config, val2: any, c2: Config) {
    const type1 = getValueType(val1);
    const type2 = getValueType(val2);

    if (type1 === 'array') {
      diffArray(val1, c1, val2, c2);
    } else if (type1 === 'object') {
      if (type2 !== 'object') {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            'Both types should be objects',
            'Both types should be objects',
            'type',
            diffCounter
          )
        );
      } else {
        diffObjects(val1, c1, val2, c2);
      }
    } else if (type1 === 'string') {
      if (type2 !== 'string') {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            'Both types should be strings',
            'Both types should be strings',
            'type',
            diffCounter
          )
        );
      } else if (val1 !== val2) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            'Both sides should be equal strings',
            'Both sides should be equal strings',
            'eq',
            diffCounter
          )
        );
      }
    } else if (type1 === 'number') {
      if (type2 !== 'number') {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            'Both types should be numbers',
            'Both types should be numbers',
            'type',
            diffCounter
          )
        );
      } else if (val1 !== val2) {
        diffCounter++;
        diffs.push(
          generateDiff(
            c1,
            generatePath(c1),
            c2,
            generatePath(c2),
            'Both sides should be equal numbers',
            'Both sides should be equal numbers',
            'eq',
            diffCounter
          )
        );
      }
    } else if (type1 === 'boolean') {
      diffBool(val1, c1, val2, c2);
    } else if (type1 === 'null' && type2 !== 'null') {
      diffCounter++;
      diffs.push(
        generateDiff(
          c1,
          generatePath(c1),
          c2,
          generatePath(c2),
          'Both types should be nulls',
          'Both types should be nulls',
          'type',
          diffCounter
        )
      );
    }
  }

  diffVal(data1, config1, data2, config2);

  // Sort diffs by line order
  diffs.sort((a, b) => a.path1.line - b.path1.line || a.path2.line - b.path2.line);

  // Re-assign 1-based IDs
  diffs.forEach((d, idx) => {
    d.id = idx + 1;
  });

  const eqCount = diffs.filter((d) => d.type === 'eq').length;
  const missingCount = diffs.filter((d) => d.type === 'missing').length;
  const typeCount = diffs.filter((d) => d.type === 'type').length;

  return {
    diffs,
    leftFormatted: config1.out,
    rightFormatted: config2.out,
    leftLines: config1.out.split('\n'),
    rightLines: config2.out.split('\n'),
    eqCount,
    missingCount,
    typeCount,
  };
}
