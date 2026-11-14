import {
  compileRegex,
  testRegex,
  escapeRegex,
  describeFlags,
  toHighlightSegments,
  MAX_MATCHES,
  REGEX_PRESETS,
  SUPPORTED_FLAGS,
} from '../lib/regexTester';

describe('regex tester', () => {
  describe('compileRegex', () => {
    it('compiles a valid pattern', () => {
      expect(compileRegex('\\d+', 'g')).toBeInstanceOf(RegExp);
    });

    it('returns the engine message for a broken pattern', () => {
      const result = compileRegex('(unclosed', '');
      expect(typeof result).toBe('string');
      expect(result as string).toMatch(/group|Unterminated|Invalid/i);
    });

    it('names an unknown flag', () => {
      expect(compileRegex('a', 'x')).toBe('Unknown flag: x');
    });

    it('pluralises several unknown flags', () => {
      expect(compileRegex('a', 'xz')).toBe('Unknown flags: x, z');
    });

    it('rejects a repeated flag', () => {
      expect(compileRegex('a', 'gg')).toBe('That flag is repeated.');
    });

    it('accepts every flag it advertises', () => {
      expect(compileRegex('a', SUPPORTED_FLAGS.join(''))).toBeInstanceOf(RegExp);
    });
  });

  describe('testRegex', () => {
    it('asks for a pattern when given none', () => {
      expect(testRegex('', 'g', 'subject').error).toBe('Enter a pattern.');
    });

    it('reports a compile failure as invalid', () => {
      const result = testRegex('(', 'g', 'subject');
      expect(result.valid).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('returns only the first match without the global flag', () => {
      const result = testRegex('\\d+', '', 'a 1 b 22 c');
      expect(result.matchCount).toBe(1);
      expect(result.matches[0]).toMatchObject({ value: '1', index: 2, length: 1 });
    });

    it('returns every match with the global flag', () => {
      const result = testRegex('\\d+', 'g', 'a 1 b 22 c 333');
      expect(result.matches.map((m) => m.value)).toEqual(['1', '22', '333']);
      expect(result.truncated).toBe(false);
    });

    it('honours the ignore case flag', () => {
      expect(testRegex('abc', 'gi', 'ABC abc').matchCount).toBe(2);
    });

    it('honours the multiline flag', () => {
      expect(testRegex('^b', 'gm', 'a\nb\nb').matchCount).toBe(2);
      expect(testRegex('^b', 'g', 'a\nb\nb').matchCount).toBe(0);
    });

    it('honours the dotall flag', () => {
      expect(testRegex('a.b', 's', 'a\nb').matchCount).toBe(1);
      expect(testRegex('a.b', '', 'a\nb').matchCount).toBe(0);
    });

    it('reports positional capture groups', () => {
      const [match] = testRegex('(\\w+)@(\\w+)', 'g', 'ops@devtools').matches;
      expect(match.groups).toEqual(['ops', 'devtools']);
    });

    it('leaves a group that did not participate undefined', () => {
      const [match] = testRegex('(a)|(b)', 'g', 'a').matches;
      expect(match.groups).toEqual(['a', undefined]);
    });

    it('reports named capture groups separately', () => {
      const [match] = testRegex('(?<user>\\w+)@(?<host>\\w+)', 'g', 'ops@devtools').matches;
      expect(match.named).toEqual({ user: 'ops', host: 'devtools' });
      expect(match.groups).toEqual(['ops', 'devtools']);
    });

    it('gives an empty named map when there are no named groups', () => {
      expect(testRegex('\\d', 'g', '1').matches[0].named).toEqual({});
    });

    it('does not spin on a zero width match', () => {
      const result = testRegex('a*', 'g', 'bbb');
      expect(result.matchCount).toBeLessThan(10);
      expect(result.matches.every((m) => m.length === 0)).toBe(true);
    });

    it('stops at the match cap and says so', () => {
      const result = testRegex('a', 'g', 'a'.repeat(MAX_MATCHES + 50));
      expect(result.matchCount).toBe(MAX_MATCHES);
      expect(result.truncated).toBe(true);
    });

    it('leaves replaced undefined when no replacement was asked for', () => {
      expect(testRegex('a', 'g', 'aaa').replaced).toBeUndefined();
    });

    it('applies a replacement', () => {
      expect(testRegex('a', 'g', 'aaa', 'b').replaced).toBe('bbb');
    });

    it('supports group references in a replacement', () => {
      expect(testRegex('(\\w+)@(\\w+)', 'g', 'ops@devtools', '$2/$1').replaced).toBe('devtools/ops');
    });

    it('replaces only once without the global flag', () => {
      expect(testRegex('a', '', 'aaa', 'b').replaced).toBe('baa');
    });

    it('accepts an empty replacement as a deletion', () => {
      expect(testRegex('\\s', 'g', 'a b c', '').replaced).toBe('abc');
    });

    it('finds nothing in an empty subject without failing', () => {
      const result = testRegex('\\d', 'g', '');
      expect(result.valid).toBe(true);
      expect(result.matchCount).toBe(0);
    });
  });

  describe('escapeRegex', () => {
    it('escapes every character with meaning', () => {
      expect(escapeRegex('a.b*c+d?e^f$g{h}i(j)k|l[m]n\\o')).toBe(
        'a\\.b\\*c\\+d\\?e\\^f\\$g\\{h\\}i\\(j\\)k\\|l\\[m\\]n\\\\o'
      );
    });

    it('produces a pattern that matches the literal', () => {
      const literal = 'price is $5.00 (today)';
      expect(testRegex(escapeRegex(literal), 'g', `the ${literal}!`).matchCount).toBe(1);
    });
  });

  describe('describeFlags', () => {
    it('describes each flag given', () => {
      expect(describeFlags('gi')).toEqual([
        'g: global - find every match, not just the first',
        'i: ignore case',
      ]);
    });

    it('ignores a flag it does not know', () => {
      expect(describeFlags('gx')).toHaveLength(1);
    });

    it('returns nothing for no flags', () => {
      expect(describeFlags('')).toEqual([]);
    });
  });

  describe('toHighlightSegments', () => {
    it('returns nothing for an empty subject', () => {
      expect(toHighlightSegments('', [])).toEqual([]);
    });

    it('returns one plain segment when nothing matched', () => {
      expect(toHighlightSegments('hello', [])).toEqual([{ text: 'hello', isMatch: false }]);
    });

    it('alternates plain and matched segments', () => {
      const { matches } = testRegex('\\d+', 'g', 'a 1 b 22');
      expect(toHighlightSegments('a 1 b 22', matches)).toEqual([
        { text: 'a ', isMatch: false },
        { text: '1', isMatch: true },
        { text: ' b ', isMatch: false },
        { text: '22', isMatch: true },
      ]);
    });

    it('handles a match at the very start', () => {
      const { matches } = testRegex('^a', 'g', 'abc');
      expect(toHighlightSegments('abc', matches)).toEqual([
        { text: 'a', isMatch: true },
        { text: 'bc', isMatch: false },
      ]);
    });

    it('emits no empty segment for a zero width match', () => {
      const { matches } = testRegex('a*', 'g', 'bb');
      const segments = toHighlightSegments('bb', matches);
      expect(segments.every((segment) => segment.text.length > 0)).toBe(true);
      expect(segments.map((segment) => segment.text).join('')).toBe('bb');
    });

    it('reassembles the subject exactly', () => {
      const subject = 'the quick brown fox';
      const { matches } = testRegex('o', 'g', subject);
      expect(toHighlightSegments(subject, matches).map((s) => s.text).join('')).toBe(subject);
    });
  });

  describe('presets', () => {
    it('ships only patterns that compile', () => {
      for (const preset of REGEX_PRESETS) {
        expect(compileRegex(preset.pattern, preset.flags)).toBeInstanceOf(RegExp);
      }
    });

    it('matches what each preset claims to match', () => {
      const subject = 'mail ops@devtools.test at https://devtools.test/x from 10.0.0.8 on 2026-11-14 in #ff0000';
      const byLabel = (label: string) => REGEX_PRESETS.find((preset) => preset.label === label)!;
      expect(testRegex(byLabel('Email').pattern, 'g', subject).matches[0].value).toBe('ops@devtools.test');
      expect(testRegex(byLabel('URL').pattern, 'g', subject).matches[0].value).toBe('https://devtools.test/x');
      expect(testRegex(byLabel('IPv4').pattern, 'g', subject).matches[0].value).toBe('10.0.0.8');
      expect(testRegex(byLabel('ISO date').pattern, 'g', subject).matches[0].value).toBe('2026-11-14');
      expect(testRegex(byLabel('Hex colour').pattern, 'gi', subject).matches[0].value).toBe('#ff0000');
    });
  });
});
