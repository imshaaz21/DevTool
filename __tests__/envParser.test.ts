import {
  parseEnv,
  isSecretKey,
  maskSecrets,
  maskValue,
  toRecord,
  toJson,
  toShellExport,
  toDockerArgs,
  toYamlEnv,
} from '../lib/envParser';

describe('env parser', () => {
  describe('parseEnv', () => {
    it('returns nothing for an empty file', () => {
      const result = parseEnv('');
      expect(result.entries).toEqual([]);
      expect(result.problems).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    it('reads a plain assignment', () => {
      const [entry] = parseEnv('PORT=3000').entries;
      expect(entry).toMatchObject({ key: 'PORT', value: '3000', line: 1, exported: false, quote: 'none' });
    });

    it('skips blank lines and full line comments', () => {
      const result = parseEnv('# a comment\n\n   \nPORT=3000');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].line).toBe(4);
    });

    it('records the export prefix', () => {
      const [entry] = parseEnv('export API_URL=https://example.test').entries;
      expect(entry.exported).toBe(true);
      expect(entry.key).toBe('API_URL');
      expect(entry.value).toBe('https://example.test');
    });

    it('expands escapes inside double quotes', () => {
      const [entry] = parseEnv('GREETING="line one\\nline two\\ttabbed"').entries;
      expect(entry.quote).toBe('double');
      expect(entry.value).toBe('line one\nline two\ttabbed');
    });

    it('leaves single quoted values literal', () => {
      const [entry] = parseEnv("GREETING='line one\\nstill one line'").entries;
      expect(entry.quote).toBe('single');
      expect(entry.value).toBe('line one\\nstill one line');
    });

    it('keeps spaces that are inside quotes', () => {
      expect(parseEnv('NAME="DevTools Suite"').entries[0].value).toBe('DevTools Suite');
    });

    it('reads a trailing comment after a quoted value', () => {
      const [entry] = parseEnv('PORT="3000" # the dev server').entries;
      expect(entry.value).toBe('3000');
      expect(entry.comment).toBe('the dev server');
    });

    it('reads a trailing comment after an unquoted value', () => {
      const [entry] = parseEnv('PORT=3000 # the dev server').entries;
      expect(entry.value).toBe('3000');
      expect(entry.comment).toBe('the dev server');
    });

    it('keeps a hash that is part of an unquoted value', () => {
      expect(parseEnv('COLOR=#ff0000').entries[0].value).toBe('#ff0000');
    });

    it('accepts an empty value', () => {
      expect(parseEnv('EMPTY=').entries[0].value).toBe('');
    });

    it('keeps an = that appears inside the value', () => {
      expect(parseEnv('QUERY=a=1&b=2').entries[0].value).toBe('a=1&b=2');
    });

    it('reports a line with no equals sign', () => {
      const result = parseEnv('JUST_A_KEY');
      expect(result.entries).toEqual([]);
      expect(result.problems[0]).toMatchObject({ line: 1, reason: 'No "=" on this line.' });
    });

    it('reports a missing key', () => {
      expect(parseEnv('=orphan').problems[0].reason).toMatch(/Missing a key/);
    });

    it('reports a key that is not a valid identifier', () => {
      const result = parseEnv('my-key=value');
      expect(result.problems[0].reason).toMatch(/not a valid key/);
      expect(result.entries).toEqual([]);
    });

    it('allows dots and underscores in a key', () => {
      expect(parseEnv('app.name=devtools\n_PRIVATE=1').entries).toHaveLength(2);
    });

    it('reports duplicates once and keeps both entries', () => {
      const result = parseEnv('PORT=3000\nPORT=4000\nPORT=5000');
      expect(result.duplicates).toEqual(['PORT']);
      expect(result.entries).toHaveLength(3);
    });

    it('handles windows line endings', () => {
      expect(parseEnv('A=1\r\nB=2').entries.map((e) => e.key)).toEqual(['A', 'B']);
    });

    it('carries on past a bad line', () => {
      const result = parseEnv('GOOD=1\nbroken line\nALSO_GOOD=2');
      expect(result.entries).toHaveLength(2);
      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].line).toBe(2);
    });
  });

  describe('isSecretKey', () => {
    it.each(['API_SECRET', 'DB_PASSWORD', 'JWT_TOKEN', 'APIKEY', 'API_KEY', 'PRIVATE_THING', 'AUTH_HEADER'])(
      'treats %s as a secret',
      (key) => {
        expect(isSecretKey(key)).toBe(true);
      }
    );

    it.each(['PORT', 'NODE_ENV', 'API_URL'])('treats %s as ordinary', (key) => {
      expect(isSecretKey(key)).toBe(false);
    });
  });

  describe('maskValue', () => {
    it('keeps the first and last two characters', () => {
      expect(maskValue('abcdefgh')).toBe('ab****gh');
    });

    it('hides a short value completely', () => {
      expect(maskValue('abcd')).toBe('****');
    });

    it('masks an empty value with a fixed width, revealing no length', () => {
      expect(maskValue('')).toBe('****');
    });

    it('caps the number of stars so a long secret does not reveal its length', () => {
      expect(maskValue('x'.repeat(200))).toBe(`xx${'*'.repeat(24)}xx`);
    });
  });

  describe('maskSecrets', () => {
    it('masks only the secret looking entries', () => {
      const { entries } = parseEnv('PORT=3000\nDB_PASSWORD=supersecret');
      const masked = maskSecrets(entries);
      expect(masked[0].value).toBe('3000');
      expect(masked[1].value).toBe('su*******et');
    });

    it('does not mutate the entries it was given', () => {
      const { entries } = parseEnv('DB_PASSWORD=supersecret');
      maskSecrets(entries);
      expect(entries[0].value).toBe('supersecret');
    });
  });

  describe('output formats', () => {
    const { entries } = parseEnv('PORT=3000\nNAME="DevTools Suite"\nPORT=4000');

    it('lets the last definition win in a record', () => {
      expect(toRecord(entries)).toEqual({ PORT: '4000', NAME: 'DevTools Suite' });
    });

    it('writes indented JSON', () => {
      expect(toJson(entries)).toBe('{\n  "PORT": "4000",\n  "NAME": "DevTools Suite"\n}');
    });

    it('writes shell exports', () => {
      expect(toShellExport(entries).split('\n')[1]).toBe("export NAME='DevTools Suite'");
    });

    it('writes docker arguments on one line', () => {
      expect(toDockerArgs(entries)).toContain("-e NAME='DevTools Suite'");
    });

    it('writes a yaml env block', () => {
      expect(toYamlEnv(entries).split('\n')[0]).toBe('  PORT: "3000"');
    });

    it('escapes a single quote for the shell', () => {
      const quoted = parseEnv(`MESSAGE="it's fine"`).entries;
      expect(toShellExport(quoted)).toBe(`export MESSAGE='it'\\''s fine'`);
    });
  });
});
