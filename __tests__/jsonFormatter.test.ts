import {
  formatJSON,
  parseStringifiedJSON,
  minifyJSON,
  cleanAndParseJsonString,
  unwrapNestedStrings,
} from '../utils/jsonFormatter';

describe('jsonFormatter utility', () => {
  describe('cleanAndParseJsonString', () => {
    it('parses valid JSON object string', () => {
      const res = cleanAndParseJsonString('{"a": 1}');
      expect(res).toEqual({ a: 1 });
    });

    it('parses valid JSON array string', () => {
      const res = cleanAndParseJsonString('[1, 2, "three"]');
      expect(res).toEqual([1, 2, 'three']);
    });

    it('returns null for non-JSON strings', () => {
      expect(cleanAndParseJsonString('hello world')).toBeNull();
      expect(cleanAndParseJsonString('12345')).toBeNull();
      expect(cleanAndParseJsonString('https://example.com')).toBeNull();
    });

    it('handles escaped quotes inside stringified JSON', () => {
      const escaped = '{\\"name\\": \\"Alice\\", \\"role\\": \\"admin\\"}';
      const res = cleanAndParseJsonString(escaped);
      expect(res).toEqual({ name: 'Alice', role: 'admin' });
    });
  });

  describe('unwrapNestedStrings', () => {
    it('unwraps single-level inner stringified JSON', () => {
      const input = {
        event: 'log',
        payload: '{"userId": "123", "action": "login"}',
      };
      const result = unwrapNestedStrings(input);
      expect(result).toEqual({
        event: 'log',
        payload: {
          userId: '123',
          action: 'login',
        },
      });
    });

    it('unwraps multi-level deeply nested stringified JSON', () => {
      const input = {
        meta: '{"inner": "{\\\"deep\\\": \\\"{\\\\\\\"level3\\\\\\\": 42}\\\"}"}',
      };
      const result = unwrapNestedStrings(input);
      expect(result).toEqual({
        meta: {
          inner: {
            deep: {
              level3: 42,
            },
          },
        },
      });
    });

    it('unwraps stringified JSON items inside arrays', () => {
      const input = {
        items: [
          '{"id": 1, "name": "first"}',
          '{"id": 2, "name": "second"}',
        ],
      };
      const result = unwrapNestedStrings(input);
      expect(result).toEqual({
        items: [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' },
        ],
      });
    });

    it('preserves non-JSON strings without alteration', () => {
      const input = {
        text: 'just a normal string',
        date: '2026-09-18',
        count: 5,
      };
      const result = unwrapNestedStrings(input);
      expect(result).toEqual(input);
    });
  });

  describe('formatJSON', () => {
    it('formats normal JSON cleanly', () => {
      const input = '{"b":2,"a":1}';
      const result = formatJSON(input, 2, false);
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{\n  "b": 2,\n  "a": 1\n}');
    });

    it('automatically unescapes and formats inner stringified JSON when unwrapInner is true', () => {
      const input = JSON.stringify({
        event: 'user_created',
        data: JSON.stringify({
          userId: 'u_100',
          profile: JSON.stringify({ email: 'test@example.com' }),
        }),
      });

      const result = formatJSON(input, 2, true);
      expect(result.success).toBe(true);
      expect(result.unwrappedCount).toBeGreaterThanOrEqual(2);

      const parsed = JSON.parse(result.formatted || '');
      expect(parsed.data.profile.email).toBe('test@example.com');
      expect(typeof parsed.data).toBe('object');
      expect(typeof parsed.data.profile).toBe('object');
    });

    it('preserves inner stringified JSON as string when unwrapInner is false', () => {
      const input = JSON.stringify({
        data: JSON.stringify({ a: 1 }),
      });

      const result = formatJSON(input, 2, false);
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.formatted || '');
      expect(typeof parsed.data).toBe('string');
    });
  });

  describe('parseStringifiedJSON', () => {
    it('unwraps outer stringified JSON and inner stringified fields', () => {
      const raw = JSON.stringify(
        JSON.stringify({
          msg: 'test',
          inner: JSON.stringify({ x: 10 }),
        })
      );

      const result = parseStringifiedJSON(raw, true);
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.formatted || '');
      expect(parsed).toEqual({
        msg: 'test',
        inner: { x: 10 },
      });
    });
  });

  describe('minifyJSON', () => {
    it('minifies JSON with whitespace removed', () => {
      const input = '{\n  "name": "DevTools",\n  "active": true\n}';
      const result = minifyJSON(input);
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{"name":"DevTools","active":true}');
    });

    it('minifies and unwraps inner stringified JSON when requested', () => {
      const input = '{"data": "{\\"a\\": 1}"}';
      const result = minifyJSON(input, true);
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{"data":{"a":1}}');
    });
  });
});
