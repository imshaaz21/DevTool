import {
  parseInputTime,
  convertToTimezone,
  getTimezoneOffsetMs,
  getUnixEpoch,
  TIME_ZONES,
} from '../utils/timezoneConverter';

describe('timezoneConverter utility', () => {
  describe('getUnixEpoch', () => {
    it('returns seconds and milliseconds for a given date', () => {
      const date = new Date('2026-04-04T12:00:00.000Z');
      const epoch = getUnixEpoch(date);
      expect(epoch.milliseconds).toBe(date.getTime());
      expect(epoch.seconds).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('parseInputTime', () => {
    it('parses numeric epoch timestamps in seconds', () => {
      const date = parseInputTime('1712232000', 'UTC');
      expect(date).not.toBeNull();
      expect(date?.getTime()).toBe(1712232000 * 1000);
    });

    it('parses numeric epoch timestamps in milliseconds', () => {
      const date = parseInputTime('1712232000123', 'UTC');
      expect(date).not.toBeNull();
      expect(date?.getTime()).toBe(1712232000123);
    });

    it('parses ISO date string with Z', () => {
      const date = parseInputTime('2026-04-04T12:00:00.000Z', 'UTC');
      expect(date).not.toBeNull();
      expect(date?.toISOString()).toBe('2026-04-04T12:00:00.000Z');
    });

    it('parses standard YYYY-MM-DD HH:mm:ss format with timezone offset', () => {
      const date = parseInputTime('2026-04-04 15:00:00', 'Asia/Riyadh');
      expect(date).not.toBeNull();
      // Riyadh is GMT+3, so 15:00 in Riyadh is 12:00 UTC
      expect(date?.toISOString()).toBe('2026-04-04T12:00:00.000Z');
    });
  });

  describe('convertToTimezone', () => {
    it('converts UTC date to Riyadh and Colombo timezones', () => {
      const date = new Date('2026-04-04T12:00:00.000Z');
      const riyadh = convertToTimezone(date, 'Asia/Riyadh');
      const colombo = convertToTimezone(date, 'Asia/Colombo');
      const utc = convertToTimezone(date, 'UTC');

      expect(utc).toContain('2026-04-04 12:00:00');
      expect(riyadh).toContain('2026-04-04 15:00:00');
      expect(colombo).toContain('2026-04-04 17:30:00');
    });
  });

  describe('getTimezoneOffsetMs', () => {
    it('returns correct millisecond offsets', () => {
      expect(getTimezoneOffsetMs('UTC')).toBe(0);
      expect(getTimezoneOffsetMs('Asia/Riyadh')).toBe(3 * 3600 * 1000);
      expect(getTimezoneOffsetMs('Asia/Colombo')).toBe(5.5 * 3600 * 1000);
    });
  });
});
