import {
  detectEpochUnit,
  toMillis,
  formatRelative,
  fromEpoch,
  fromDateString,
  EPOCH_UNITS,
} from '../lib/epochConverter';

// 2026-11-14T10:30:00.000Z
const NOW = 1794652200000;

describe('epoch converter', () => {
  describe('detectEpochUnit', () => {
    it('reads a ten digit value as seconds', () => {
      expect(detectEpochUnit(1794652200)).toBe('seconds');
    });

    it('reads a thirteen digit value as milliseconds', () => {
      expect(detectEpochUnit(1794652200000)).toBe('milliseconds');
    });

    it('reads a sixteen digit value as microseconds', () => {
      expect(detectEpochUnit(1794652200000000)).toBe('microseconds');
    });

    it('reads a nineteen digit value as nanoseconds', () => {
      expect(detectEpochUnit(1794652200000000000)).toBe('nanoseconds');
    });

    it('reads zero as seconds', () => {
      expect(detectEpochUnit(0)).toBe('seconds');
    });

    it('ignores the sign', () => {
      expect(detectEpochUnit(-1794652200)).toBe('seconds');
    });

    it('offers every unit it can detect', () => {
      expect(EPOCH_UNITS).toEqual(['seconds', 'milliseconds', 'microseconds', 'nanoseconds']);
    });
  });

  describe('toMillis', () => {
    it('converts each unit to the same instant', () => {
      expect(toMillis(1794652200, 'seconds')).toBe(NOW);
      expect(toMillis(1794652200000, 'milliseconds')).toBe(NOW);
      expect(toMillis(1794652200000000, 'microseconds')).toBe(NOW);
      expect(toMillis(1794652200000000000, 'nanoseconds')).toBe(NOW);
    });
  });

  describe('formatRelative', () => {
    it('calls a few seconds ago just now', () => {
      expect(formatRelative(NOW - 10000, NOW)).toBe('just now');
    });

    it('calls a few seconds ahead a moment', () => {
      expect(formatRelative(NOW + 10000, NOW)).toBe('in a moment');
    });

    it('describes the past', () => {
      expect(formatRelative(NOW - 3 * 3600 * 1000, NOW)).toBe('3 hours ago');
    });

    it('describes the future', () => {
      expect(formatRelative(NOW + 2 * 86400 * 1000, NOW)).toBe('in 2 days');
    });

    it('uses the singular for one unit', () => {
      expect(formatRelative(NOW - 3600 * 1000, NOW)).toBe('1 hour ago');
    });

    it('falls back to years for a distant date', () => {
      expect(formatRelative(NOW - 5 * 31536000 * 1000, NOW)).toMatch(/5 years ago/);
    });
  });

  describe('fromEpoch', () => {
    it('rejects an empty input', () => {
      const result = fromEpoch('', undefined, NOW);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Enter a timestamp/);
    });

    it('rejects text that is not a number', () => {
      expect(fromEpoch('2026-11-14', undefined, NOW).error).toMatch(/not a number/);
    });

    it('converts seconds and reports the detected unit', () => {
      const result = fromEpoch('1794652200', undefined, NOW);
      expect(result.valid).toBe(true);
      expect(result.unit).toBe('seconds');
      expect(result.detected).toBe(true);
      expect(result.iso).toBe('2026-11-14T10:30:00.000Z');
      expect(result.epochMillis).toBe(NOW);
      expect(result.epochSeconds).toBe(1794652200);
      expect(result.dayOfWeek).toBe('Saturday');
      expect(result.relative).toBe('just now');
    });

    it('honours a forced unit over the detected one', () => {
      const result = fromEpoch('1794652200', 'milliseconds', NOW);
      expect(result.unit).toBe('milliseconds');
      expect(result.detected).toBe(false);
      expect(result.iso).toBe('1970-01-21T18:30:52.200Z');
    });

    it('tolerates separators pasted from logs', () => {
      expect(fromEpoch('1_794_652_200', undefined, NOW).epochMillis).toBe(NOW);
      expect(fromEpoch('1,794,652,200', undefined, NOW).epochMillis).toBe(NOW);
      expect(fromEpoch(' 1794652200 ', undefined, NOW).epochMillis).toBe(NOW);
    });

    it('handles the epoch itself', () => {
      const result = fromEpoch('0', undefined, NOW);
      expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
      expect(result.dayOfWeek).toBe('Thursday');
    });

    it('handles a date before the epoch', () => {
      expect(fromEpoch('-86400', 'seconds', NOW).iso).toBe('1969-12-31T00:00:00.000Z');
    });

    it('rejects a timestamp outside the range of a date', () => {
      const result = fromEpoch('99999999999999999999', 'milliseconds', NOW);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/outside the range/);
    });

    it('accepts a fractional value', () => {
      expect(fromEpoch('1794652200.5', 'seconds', NOW).epochMillis).toBe(NOW + 500);
    });
  });

  describe('fromDateString', () => {
    it('rejects an empty input', () => {
      expect(fromDateString('  ').error).toMatch(/Enter a date/);
    });

    it('rejects something that is not a date', () => {
      const result = fromDateString('not a date');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/ISO 8601/);
    });

    it('converts an ISO date to both units', () => {
      const result = fromDateString('2026-11-14T10:30:00.000Z');
      expect(result.valid).toBe(true);
      expect(result.epochMillis).toBe(NOW);
      expect(result.epochSeconds).toBe(1794652200);
      expect(result.iso).toBe('2026-11-14T10:30:00.000Z');
    });

    it('accepts a date with no time', () => {
      expect(fromDateString('2026-11-14').iso).toBe('2026-11-14T00:00:00.000Z');
    });
  });
});
