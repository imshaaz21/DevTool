import {
  cleanHex,
  hexToRgba,
  rgbToHsl,
  rgbToCmyk,
  getLuminance,
  getContrastRatio,
  inspectColor,
  extractHexColors,
} from '@/lib/colorInspector';

describe('colorInspector library', () => {
  describe('cleanHex', () => {
    it('normalizes 3-char hex with or without hash', () => {
      expect(cleanHex('#fff')).toBe('ffffff');
      expect(cleanHex('abc')).toBe('aabbcc');
    });

    it('normalizes 6-char hex and handles 0x prefix', () => {
      expect(cleanHex('#3B82F6')).toBe('3b82f6');
      expect(cleanHex('0x3B82F6')).toBe('3b82f6');
    });

    it('normalizes 8-char hex with alpha', () => {
      expect(cleanHex('#3B82F680')).toBe('3b82f680');
    });

    it('returns null for invalid strings', () => {
      expect(cleanHex('invalid')).toBeNull();
      expect(cleanHex('#12')).toBeNull();
    });
  });

  describe('hexToRgba', () => {
    it('converts hex to RGB values', () => {
      const rgba = hexToRgba('#3B82F6');
      expect(rgba).toEqual({ r: 59, g: 130, b: 246, a: 1 });
    });

    it('parses alpha in 8-char hex', () => {
      const rgba = hexToRgba('#00000080');
      expect(rgba?.a).toBeCloseTo(0.5, 1);
    });
  });

  describe('rgbToHsl and rgbToCmyk', () => {
    it('converts pure red', () => {
      const hsl = rgbToHsl(255, 0, 0);
      expect(hsl).toEqual({ h: 0, s: 100, l: 50 });
      const cmyk = rgbToCmyk(255, 0, 0);
      expect(cmyk).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });
  });

  describe('inspectColor', () => {
    it('provides full color details for valid hex', () => {
      const details = inspectColor('#3B82F6');
      expect(details).not.toBeNull();
      expect(details?.hex).toBe('#3B82F6');
      expect(details?.rgbString).toBe('rgb(59, 130, 246)');
      expect(details?.hslString).toContain('hsl(');
      expect(details?.cmykString).toContain('cmyk(');
      expect(details?.contrast.ratioOnWhite).toBeGreaterThan(1);
      expect(details?.contrast.ratioOnBlack).toBeGreaterThan(1);
      expect(details?.shades.length).toBe(10);
      expect(details?.nearestTailwind.name).toBe('blue-500');
    });

    it('parses rgb input string', () => {
      const details = inspectColor('rgb(255, 255, 255)');
      expect(details?.hex).toBe('#FFFFFF');
      expect(details?.contrast.recommendedText).toBe('#000000');
    });
  });

  describe('extractHexColors', () => {
    it('finds and extracts all hex colors from text', () => {
      const css = `
        .header { background: #3b82f6; color: #ffffff; }
        .footer { border-color: #3B82F6; background: #1e293b; }
      `;
      const extracted = extractHexColors(css);
      expect(extracted.length).toBe(3); // #3B82F6 (deduped), #FFFFFF, #1E293B
      const blue = extracted.find((e) => e.hex === '#3B82F6');
      expect(blue?.count).toBe(2);
    });
  });
});
