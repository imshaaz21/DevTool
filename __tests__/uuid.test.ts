import {
  MIN_UUID_COUNT,
  MAX_UUID_COUNT,
  generateUuid,
  generateUuids,
  clampUuidCount,
  isValidUuidV4,
} from '../lib/uuid';

describe('uuid', () => {
  describe('generateUuid', () => {
    it('produces a valid version 4 uuid', () => {
      expect(isValidUuidV4(generateUuid())).toBe(true);
    });

    it('does not repeat itself', () => {
      const values = new Set(Array.from({ length: 200 }, generateUuid));
      expect(values.size).toBe(200);
    });

    it('falls back when randomUUID is unavailable, as on plain HTTP', () => {
      const original = crypto.randomUUID;
      // @ts-expect-error deliberately removing the secure-context API
      delete crypto.randomUUID;
      try {
        const value = generateUuid();
        expect(isValidUuidV4(value)).toBe(true);
      } finally {
        crypto.randomUUID = original;
      }
    });

    it('sets the version and variant bits in the fallback', () => {
      const original = crypto.randomUUID;
      // @ts-expect-error deliberately removing the secure-context API
      delete crypto.randomUUID;
      try {
        for (let i = 0; i < 25; i += 1) {
          const value = generateUuid();
          expect(value[14]).toBe('4');
          expect('89ab').toContain(value[19]);
        }
      } finally {
        crypto.randomUUID = original;
      }
    });
  });

  describe('clampUuidCount', () => {
    it.each([
      [0, MIN_UUID_COUNT],
      [-5, MIN_UUID_COUNT],
      [1, 1],
      [25, 25],
      [500, MAX_UUID_COUNT],
      [3.7, 3],
      [Number.NaN, MIN_UUID_COUNT],
    ])('clamps %p to %p', (input, expected) => {
      expect(clampUuidCount(input)).toBe(expected);
    });
  });

  describe('generateUuids', () => {
    it('generates the requested number', () => {
      expect(generateUuids(5)).toHaveLength(5);
    });

    it('never exceeds the supported range', () => {
      expect(generateUuids(9999)).toHaveLength(MAX_UUID_COUNT);
      expect(generateUuids(0)).toHaveLength(MIN_UUID_COUNT);
    });

    it('generates distinct values', () => {
      const values = generateUuids(MAX_UUID_COUNT);
      expect(new Set(values).size).toBe(MAX_UUID_COUNT);
    });
  });

  describe('isValidUuidV4', () => {
    it('accepts a canonical v4 value', () => {
      expect(isValidUuidV4('9b2e4a1c-6d3f-4b8a-9c1d-2e3f4a5b6c7d')).toBe(true);
    });

    it('ignores surrounding whitespace', () => {
      expect(isValidUuidV4('  9b2e4a1c-6d3f-4b8a-9c1d-2e3f4a5b6c7d  ')).toBe(true);
    });

    it.each([
      ['', 'empty'],
      ['not-a-uuid', 'plain text'],
      ['9b2e4a1c6d3f4b8a9c1d2e3f4a5b6c7d', 'missing dashes'],
      ['9b2e4a1c-6d3f-1b8a-9c1d-2e3f4a5b6c7d', 'wrong version'],
      ['9b2e4a1c-6d3f-4b8a-1c1d-2e3f4a5b6c7d', 'wrong variant'],
    ])('rejects %p (%s)', (value) => {
      expect(isValidUuidV4(value)).toBe(false);
    });
  });
});
