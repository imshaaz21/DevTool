import {
  splitIntoWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toConstantCase,
  toKebabCase,
  toScreamingKebabCase,
  toDotCase,
  toPathCase,
  toTitleCase,
  toSentenceCase,
  toSlug,
  toAlternatingCase,
  toInverseCase,
  convertCase,
  replaceSpacesWith,
  removeAllSpaces,
  collapseWhitespace,
  replaceUnderscoresWithSpaces,
  replaceHyphensWithSpaces,
  removeSpecialChars,
  trimLines,
  removeEmptyLines,
  removeDuplicateLines,
  sortLines,
  batchConvert,
  getTextStats,
} from '@/lib/caseConverter';

describe('caseConverter library', () => {
  describe('splitIntoWords', () => {
    it('splits camelCase properly', () => {
      expect(splitIntoWords('userProfileId')).toEqual(['user', 'Profile', 'Id']);
    });

    it('splits PascalCase properly', () => {
      expect(splitIntoWords('UserProfileId')).toEqual(['User', 'Profile', 'Id']);
    });

    it('splits snake_case and CONSTANT_CASE', () => {
      expect(splitIntoWords('user_profile_id')).toEqual(['user', 'profile', 'id']);
      expect(splitIntoWords('USER_PROFILE_ID')).toEqual(['USER', 'PROFILE', 'ID']);
    });

    it('splits kebab-case and SCREAMING-KEBAB-CASE', () => {
      expect(splitIntoWords('user-profile-id')).toEqual(['user', 'profile', 'id']);
      expect(splitIntoWords('USER-PROFILE-ID')).toEqual(['USER', 'PROFILE', 'ID']);
    });

    it('handles acronyms properly', () => {
      expect(splitIntoWords('getHTTPResponse')).toEqual(['get', 'HTTP', 'Response']);
      expect(splitIntoWords('XMLParser')).toEqual(['XML', 'Parser']);
    });

    it('returns empty array for empty or whitespace string', () => {
      expect(splitIntoWords('')).toEqual([]);
      expect(splitIntoWords('   \n  ')).toEqual([]);
    });
  });

  describe('Case Transformations', () => {
    const input = 'hello_world_dev_tool';

    it('converts to camelCase', () => {
      expect(toCamelCase(input)).toBe('helloWorldDevTool');
      expect(toCamelCase('HelloWorldDevTool')).toBe('helloWorldDevTool');
    });

    it('converts to PascalCase', () => {
      expect(toPascalCase(input)).toBe('HelloWorldDevTool');
      expect(toPascalCase('helloWorldDevTool')).toBe('HelloWorldDevTool');
    });

    it('converts to snake_case', () => {
      expect(toSnakeCase('helloWorldDevTool')).toBe('hello_world_dev_tool');
      expect(toSnakeCase('HELLO_WORLD_DEV_TOOL')).toBe('hello_world_dev_tool');
    });

    it('converts to CONSTANT_CASE', () => {
      expect(toConstantCase('helloWorldDevTool')).toBe('HELLO_WORLD_DEV_TOOL');
      expect(toConstantCase('hello-world-dev-tool')).toBe('HELLO_WORLD_DEV_TOOL');
    });

    it('converts to kebab-case', () => {
      expect(toKebabCase('helloWorldDevTool')).toBe('hello-world-dev-tool');
      expect(toKebabCase('hello_world_dev_tool')).toBe('hello-world-dev-tool');
    });

    it('converts to SCREAMING-KEBAB-CASE', () => {
      expect(toScreamingKebabCase('helloWorldDevTool')).toBe('HELLO-WORLD-DEV-TOOL');
    });

    it('converts to dot.case', () => {
      expect(toDotCase('helloWorldDevTool')).toBe('hello.world.dev.tool');
    });

    it('converts to path/case', () => {
      expect(toPathCase('helloWorldDevTool')).toBe('hello/world/dev/tool');
    });

    it('converts to Title Case', () => {
      expect(toTitleCase('hello_world_dev_tool')).toBe('Hello World Dev Tool');
    });

    it('converts to Sentence case', () => {
      expect(toSentenceCase('hello_world_dev_tool')).toBe('Hello world dev tool');
    });

    it('converts to URL slug', () => {
      expect(toSlug('Hello World! New 2.0 release?')).toBe('hello-world-new-2-0-release');
    });

    it('converts to alternating case', () => {
      expect(toAlternatingCase('hello')).toBe('hElLo');
    });

    it('converts to inverse case', () => {
      expect(toInverseCase('Hello World')).toBe('hELLO wORLD');
    });

    it('converts via convertCase switch dispatcher', () => {
      expect(convertCase('foo_bar', 'camelCase')).toBe('fooBar');
      expect(convertCase('foo_bar', 'constantCase')).toBe('FOO_BAR');
      expect(convertCase('foo_bar', 'upperCase')).toBe('FOO_BAR');
      expect(convertCase('FOO_BAR', 'lowerCase')).toBe('foo_bar');
    });
  });

  describe('Space & Delimiter Replacements', () => {
    it('replaces spaces with underscores', () => {
      expect(replaceSpacesWith('hello world foo bar', '_')).toBe('hello_world_foo_bar');
    });

    it('replaces spaces with hyphens', () => {
      expect(replaceSpacesWith('hello world foo bar', '-')).toBe('hello-world-foo-bar');
    });

    it('removes all spaces', () => {
      expect(removeAllSpaces('hello  world \n foo\tbar')).toBe('helloworldfoobar');
    });

    it('collapses whitespace', () => {
      expect(collapseWhitespace('hello    world  foo   bar')).toBe('hello world foo bar');
    });

    it('replaces underscores with spaces', () => {
      expect(replaceUnderscoresWithSpaces('user_profile_settings')).toBe('user profile settings');
    });

    it('replaces hyphens with spaces', () => {
      expect(replaceHyphensWithSpaces('user-profile-settings')).toBe('user profile settings');
    });

    it('removes special characters', () => {
      expect(removeSpecialChars('Hello, World! #2026?')).toBe('Hello World 2026');
      expect(removeSpecialChars('Hello, World! #2026?', false)).toBe('HelloWorld2026');
    });

    it('trims lines and removes empty/duplicate lines', () => {
      const text = '  line 1  \n\n  line 2  \n  line 1  ';
      expect(trimLines(text)).toBe('line 1\n\nline 2\nline 1');
      expect(removeEmptyLines(text)).toBe('  line 1  \n  line 2  \n  line 1  ');
      expect(removeDuplicateLines('a\nb\na\nc')).toBe('a\nb\nc');
    });

    it('sorts lines ascending and descending', () => {
      expect(sortLines('cherry\napple\nbanana', 'asc')).toBe('apple\nbanana\ncherry');
      expect(sortLines('cherry\napple\nbanana', 'desc')).toBe('cherry\nbanana\napple');
    });
  });

  describe('Batch Multi-line Conversion', () => {
    const rawLines = `user_id\nfirst_name\nlast_name\nemail_address`;

    it('converts multi-line input to camelCase with quotes and comma delimiter', () => {
      const result = batchConvert(rawLines, {
        caseType: 'camelCase',
        quote: 'single',
        delimiter: 'comma-space',
        wrapper: 'array',
      });
      expect(result).toBe("[ 'userId', 'firstName', 'lastName', 'emailAddress' ]");
    });

    it('converts multi-line input to CONSTANT_CASE with sql wrapper', () => {
      const result = batchConvert(rawLines, {
        caseType: 'constantCase',
        quote: 'double',
        delimiter: 'comma-space',
        wrapper: 'sql',
      });
      expect(result).toBe('( "USER_ID", "FIRST_NAME", "LAST_NAME", "EMAIL_ADDRESS" )');
    });

    it('applies prefix and suffix correctly', () => {
      const result = batchConvert('user\norder', {
        caseType: 'pascalCase',
        prefix: 'I',
        suffix: 'DTO',
        delimiter: 'newline',
      });
      expect(result).toBe('IUserDTO\nIOrderDTO');
    });
  });

  describe('getTextStats', () => {
    it('accurately calculates character, word, line, and byte statistics', () => {
      const stats = getTextStats('Hello World\nLine 2');
      expect(stats.characters).toBe(18);
      expect(stats.charactersNoSpaces).toBe(15);
      expect(stats.words).toBe(4);
      expect(stats.lines).toBe(2);
      expect(stats.bytes).toBe(18);
    });

    it('handles empty string gracefully', () => {
      const stats = getTextStats('');
      expect(stats.characters).toBe(0);
      expect(stats.words).toBe(0);
      expect(stats.lines).toBe(0);
    });
  });
});
