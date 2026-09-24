/**
 * Developer Case Converter & Text Transformation Utilities
 */

export type CaseType =
  | 'camelCase'
  | 'pascalCase'
  | 'snakeCase'
  | 'constantCase'
  | 'kebabCase'
  | 'screamingKebabCase'
  | 'dotCase'
  | 'pathCase'
  | 'titleCase'
  | 'sentenceCase'
  | 'upperCase'
  | 'lowerCase'
  | 'slug'
  | 'alternatingCase'
  | 'inverseCase';

export interface CaseOption {
  id: CaseType;
  label: string;
  badge: string;
  description: string;
  category: 'code' | 'separator' | 'text' | 'special';
}

export const CASE_OPTIONS: CaseOption[] = [
  {
    id: 'camelCase',
    label: 'camelCase',
    badge: 'JS / TS / Java',
    description: 'First word lowercase, each subsequent word capitalized.',
    category: 'code',
  },
  {
    id: 'pascalCase',
    label: 'PascalCase',
    badge: 'Classes / React',
    description: 'Every word begins with an uppercase letter.',
    category: 'code',
  },
  {
    id: 'snakeCase',
    label: 'snake_case',
    badge: 'Python / SQL',
    description: 'All lowercase with words separated by underscores.',
    category: 'code',
  },
  {
    id: 'constantCase',
    label: 'CONSTANT_CASE',
    badge: 'Env / Enums',
    description: 'All uppercase with words separated by underscores.',
    category: 'code',
  },
  {
    id: 'kebabCase',
    label: 'kebab-case',
    badge: 'CSS / URLs / NPM',
    description: 'All lowercase with words separated by hyphens.',
    category: 'code',
  },
  {
    id: 'screamingKebabCase',
    label: 'SCREAMING-KEBAB',
    badge: 'Headers / COBOL',
    description: 'All uppercase with words separated by hyphens.',
    category: 'code',
  },
  {
    id: 'dotCase',
    label: 'dot.case',
    badge: 'Properties / i18n',
    description: 'All lowercase with words separated by dots.',
    category: 'separator',
  },
  {
    id: 'pathCase',
    label: 'path/case',
    badge: 'Files / Routes',
    description: 'All lowercase with words separated by slashes.',
    category: 'separator',
  },
  {
    id: 'titleCase',
    label: 'Title Case',
    badge: 'UI & Headers',
    description: 'Every word capitalized, separated by spaces.',
    category: 'text',
  },
  {
    id: 'sentenceCase',
    label: 'Sentence case',
    badge: 'Prose & Labels',
    description: 'First word capitalized, remaining words lowercase.',
    category: 'text',
  },
  {
    id: 'upperCase',
    label: 'UPPERCASE',
    badge: 'SQL Keywords',
    description: 'All characters converted to uppercase.',
    category: 'text',
  },
  {
    id: 'lowerCase',
    label: 'lowercase',
    badge: 'Search & Normalize',
    description: 'All characters converted to lowercase.',
    category: 'text',
  },
  {
    id: 'slug',
    label: 'URL-safe slug',
    badge: 'Web URLs',
    description: 'Normalized unicode, no symbols, hyphen-separated.',
    category: 'special',
  },
  {
    id: 'alternatingCase',
    label: 'aLtErNaTiNg cAsE',
    badge: 'Meme / QA',
    description: 'Characters alternating between lowercase and uppercase.',
    category: 'special',
  },
  {
    id: 'inverseCase',
    label: 'iNVERSE cASE',
    badge: 'Invert Casing',
    description: 'Inverts the case of each character.',
    category: 'special',
  },
];

/**
 * Splits text into individual words, respecting camelCase, PascalCase, snake_case,
 * CONSTANT_CASE, acronyms (e.g. XMLParser, getHTTPResponse), and common punctuation.
 */
export function splitIntoWords(input: string): string[] {
  if (!input || !input.trim()) return [];

  // Step 1: Separate acronyms followed by camel/pascal words: "XMLParser" -> "XML Parser", "getHTTPResponse" -> "get HTTP Response"
  let text = input.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Step 2: Separate camelCase and PascalCase transitions: "camelCase" -> "camel Case", "user123Id" -> "user 123 Id"
  text = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  // Step 3: Replace common delimiters and symbols with spaces
  text = text.replace(/[\s_\-./\\:;|,~+=*&%$#@!^(){}[\]<>?"'`]+/g, ' ');

  // Step 4: Extract trimmed words
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Converts text into camelCase (e.g. "userProfileId")
 */
export function toCamelCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return '';
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Converts text into PascalCase (e.g. "UserProfileId")
 */
export function toPascalCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return '';
  return words
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Converts text into snake_case (e.g. "user_profile_id")
 */
export function toSnakeCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join('_');
}

/**
 * Converts text into CONSTANT_CASE / SCREAMING_SNAKE_CASE (e.g. "USER_PROFILE_ID")
 */
export function toConstantCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toUpperCase())
    .join('_');
}

/**
 * Converts text into kebab-case (e.g. "user-profile-id")
 */
export function toKebabCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join('-');
}

/**
 * Converts text into SCREAMING-KEBAB-CASE / TRAIN-CASE (e.g. "USER-PROFILE-ID")
 */
export function toScreamingKebabCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toUpperCase())
    .join('-');
}

/**
 * Converts text into dot.case (e.g. "user.profile.id")
 */
export function toDotCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join('.');
}

/**
 * Converts text into path/case (e.g. "user/profile/id")
 */
export function toPathCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join('/');
}

/**
 * Converts text into Title Case (e.g. "User Profile Id")
 */
export function toTitleCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Converts text into Sentence case (e.g. "User profile id")
 */
export function toSentenceCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return '';
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    })
    .join(' ');
}

/**
 * Converts text to a clean, URL-safe slug
 */
export function toSlug(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD') // Decompose combined accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}

/**
 * Alternating case (e.g. "uSeR pRoFiLe")
 */
export function toAlternatingCase(input: string): string {
  let isUpper = false;
  return input
    .split('')
    .map((char) => {
      if (/[a-zA-Z]/.test(char)) {
        const transformed = isUpper ? char.toUpperCase() : char.toLowerCase();
        isUpper = !isUpper;
        return transformed;
      }
      return char;
    })
    .join('');
}

/**
 * Inverts the case of each character
 */
export function toInverseCase(input: string): string {
  return input
    .split('')
    .map((char) => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      }
      return char.toUpperCase();
    })
    .join('');
}

/**
 * Converts input text according to specified CaseType
 */
export function convertCase(input: string, caseType: CaseType): string {
  switch (caseType) {
    case 'camelCase':
      return toCamelCase(input);
    case 'pascalCase':
      return toPascalCase(input);
    case 'snakeCase':
      return toSnakeCase(input);
    case 'constantCase':
      return toConstantCase(input);
    case 'kebabCase':
      return toKebabCase(input);
    case 'screamingKebabCase':
      return toScreamingKebabCase(input);
    case 'dotCase':
      return toDotCase(input);
    case 'pathCase':
      return toPathCase(input);
    case 'titleCase':
      return toTitleCase(input);
    case 'sentenceCase':
      return toSentenceCase(input);
    case 'upperCase':
      return input.toUpperCase();
    case 'lowerCase':
      return input.toLowerCase();
    case 'slug':
      return toSlug(input);
    case 'alternatingCase':
      return toAlternatingCase(input);
    case 'inverseCase':
      return toInverseCase(input);
    default:
      return input;
  }
}

/**
 * Delimiter and Space Transformations
 */
export function replaceSpacesWith(input: string, replacement: string): string {
  return input.replace(/[^\S\r\n]+/g, replacement);
}

export function removeAllSpaces(input: string): string {
  return input.replace(/\s+/g, '');
}

export function collapseWhitespace(input: string): string {
  return input
    .split('\n')
    .map((line) => line.replace(/[^\S\r\n]+/g, ' ').trim())
    .join('\n');
}

export function replaceUnderscoresWithSpaces(input: string): string {
  return input.replace(/_/g, ' ');
}

export function replaceHyphensWithSpaces(input: string): string {
  return input.replace(/-/g, ' ');
}

export function removeSpecialChars(input: string, keepWhitespace = true): string {
  if (keepWhitespace) {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  }
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

export function trimLines(input: string): string {
  return input
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

export function removeEmptyLines(input: string): string {
  return input
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

export function removeDuplicateLines(input: string): string {
  const lines = input.split('\n');
  const seen = new Set<string>();
  const uniqueLines: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      uniqueLines.push(line);
    }
  }
  return uniqueLines.join('\n');
}

export function sortLines(input: string, direction: 'asc' | 'desc' = 'asc'): string {
  const lines = input.split('\n');
  lines.sort((a, b) => {
    return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
  });
  return lines.join('\n');
}

export interface BatchConvertOptions {
  caseType: CaseType | 'none';
  prefix?: string;
  suffix?: string;
  quote?: 'none' | 'single' | 'double' | 'backtick';
  delimiter?: 'newline' | 'comma' | 'comma-space' | 'semicolon' | 'pipe';
  wrapper?: 'none' | 'array' | 'sql' | 'curly';
  removeEmpty?: boolean;
  trim?: boolean;
  deduplicate?: boolean;
}

/**
 * Batch converts a multiline string with line-by-line formatting, casing, and quote wrapping.
 */
export function batchConvert(input: string, options: BatchConvertOptions): string {
  if (!input) return '';

  let lines = input.split(/\r?\n/);

  if (options.trim) {
    lines = lines.map((l) => l.trim());
  }

  if (options.removeEmpty) {
    lines = lines.filter((l) => l.length > 0);
  }

  if (options.deduplicate) {
    lines = Array.from(new Set(lines));
  }

  const transformed = lines.map((line) => {
    let result = line;
    if (options.caseType !== 'none') {
      result = convertCase(result, options.caseType);
    }

    if (options.prefix) {
      result = options.prefix + result;
    }

    if (options.suffix) {
      result = result + options.suffix;
    }

    switch (options.quote) {
      case 'single':
        result = `'${result}'`;
        break;
      case 'double':
        result = `"${result}"`;
        break;
      case 'backtick':
        result = `\`${result}\``;
        break;
      case 'none':
      default:
        break;
    }

    return result;
  });

  let joined = '';
  switch (options.delimiter) {
    case 'comma':
      joined = transformed.join(',');
      break;
    case 'comma-space':
      joined = transformed.join(', ');
      break;
    case 'semicolon':
      joined = transformed.join('; ');
      break;
    case 'pipe':
      joined = transformed.join(' | ');
      break;
    case 'newline':
    default:
      joined = transformed.join('\n');
      break;
  }

  switch (options.wrapper) {
    case 'array':
      return `[ ${joined} ]`;
    case 'sql':
      return `( ${joined} )`;
    case 'curly':
      return `{ ${joined} }`;
    case 'none':
    default:
      return joined;
  }
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  bytes: number;
}

export function getTextStats(input: string): TextStats {
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, '').length;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lines = input ? input.split(/\r?\n/).length : 0;
  const bytes = new TextEncoder().encode(input).length;

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    bytes,
  };
}
