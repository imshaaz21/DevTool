/**
 * Color Inspector & Hex Decoder Library
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface TailwindMatch {
  name: string;
  hex: string;
  distance: number;
}

export interface ContrastDetails {
  ratioOnWhite: number;
  ratioOnBlack: number;
  recommendedText: '#000000' | '#ffffff';
  whitePassAA: boolean;
  whitePassAAA: boolean;
  blackPassAA: boolean;
  blackPassAAA: boolean;
}

export interface ColorShade {
  label: string; // e.g. "50", "100", ..., "900"
  hex: string;
  isBase?: boolean;
}

export interface ColorDetails {
  hex: string;
  hex8: string;
  rgb: RGB;
  rgba: RGBA;
  hsl: HSL;
  cmyk: CMYK;
  rgbString: string;
  rgbaString: string;
  hslString: string;
  cmykString: string;
  cssVar: string;
  luminance: number;
  contrast: ContrastDetails;
  nearestTailwind: TailwindMatch;
  shades: ColorShade[];
}

const TAILWIND_COLORS: Record<string, string> = {
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1', 'slate-400': '#94a3b8',
  'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155', 'slate-800': '#1e293b', 'slate-900': '#0f172a',
  'red-500': '#ef4444', 'red-600': '#dc2626', 'orange-500': '#f97316', 'amber-500': '#f59e0b',
  'yellow-400': '#facc15', 'yellow-500': '#eab308', 'emerald-500': '#10b981', 'green-500': '#22c55e',
  'teal-500': '#14b8a6', 'cyan-500': '#06b6d4', 'sky-500': '#0ea5e9', 'blue-500': '#3b82f6',
  'blue-600': '#2563eb', 'indigo-500': '#6366f1', 'violet-500': '#8b5cf6', 'purple-500': '#a855f7',
  'fuchsia-500': '#d946ef', 'pink-500': '#ec4899', 'rose-500': '#f43f5e', 'zinc-500': '#71717a',
  'neutral-900': '#171717', 'neutral-50': '#fafafa', 'white': '#ffffff', 'black': '#000000',
};

/**
 * Normalizes hex string into standard 6 or 8 character hex (without prefix)
 */
export function cleanHex(input: string): string | null {
  if (!input) return null;
  let raw = input.trim().toLowerCase();

  // Strip 0x or #
  if (raw.startsWith('0x')) raw = raw.slice(2);
  if (raw.startsWith('#')) raw = raw.slice(1);

  if (/^[0-9a-f]{3}$/.test(raw)) {
    return raw.split('').map((c) => c + c).join('');
  }
  if (/^[0-9a-f]{4}$/.test(raw)) {
    return raw.split('').map((c) => c + c).join('');
  }
  if (/^[0-9a-f]{6}$/.test(raw) || /^[0-9a-f]{8}$/.test(raw)) {
    return raw;
  }
  return null;
}

/**
 * Converts Hex string to RGBA object
 */
export function hexToRgba(hexInput: string): RGBA | null {
  const cleaned = cleanHex(hexInput);
  if (!cleaned) return null;

  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  let a = 1;

  if (cleaned.length === 8) {
    a = Math.round((parseInt(cleaned.slice(6, 8), 16) / 255) * 100) / 100;
  }

  return { r, g, b, a };
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts RGB to CMYK
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

/**
 * Computes WCAG relative luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio between two relative luminances
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}

/**
 * Finds the nearest Tailwind CSS color
 */
export function getNearestTailwind(r: number, g: number, b: number): TailwindMatch {
  let minDistance = Infinity;
  let bestName = 'blue-500';
  let bestHex = '#3b82f6';

  for (const [name, hex] of Object.entries(TAILWIND_COLORS)) {
    const target = hexToRgba(hex);
    if (!target) continue;
    // Euclidean distance in RGB
    const dist = Math.sqrt(
      Math.pow(r - target.r, 2) + Math.pow(g - target.g, 2) + Math.pow(b - target.b, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      bestName = name;
      bestHex = hex;
    }
  }

  return {
    name: bestName,
    hex: bestHex,
    distance: Math.round(minDistance),
  };
}

/**
 * Generates tints (mixed with white) and shades (mixed with black)
 */
export function generateShades(r: number, g: number, b: number): ColorShade[] {
  const mix = (c1: number, c2: number, weight: number) => Math.round(c1 * (1 - weight) + c2 * weight);

  const padHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  const toHex = (cr: number, cg: number, cb: number) => `#${padHex(cr)}${padHex(cg)}${padHex(cb)}`;

  return [
    { label: '50', hex: toHex(mix(r, 255, 0.9), mix(g, 255, 0.9), mix(b, 255, 0.9)) },
    { label: '100', hex: toHex(mix(r, 255, 0.75), mix(g, 255, 0.75), mix(b, 255, 0.75)) },
    { label: '200', hex: toHex(mix(r, 255, 0.55), mix(g, 255, 0.55), mix(b, 255, 0.55)) },
    { label: '300', hex: toHex(mix(r, 255, 0.35), mix(g, 255, 0.35), mix(b, 255, 0.35)) },
    { label: '400', hex: toHex(mix(r, 255, 0.15), mix(g, 255, 0.15), mix(b, 255, 0.15)) },
    { label: '500', hex: toHex(r, g, b), isBase: true },
    { label: '600', hex: toHex(mix(r, 0, 0.15), mix(g, 0, 0.15), mix(b, 0, 0.15)) },
    { label: '700', hex: toHex(mix(r, 0, 0.35), mix(g, 0, 0.35), mix(b, 0, 0.35)) },
    { label: '800', hex: toHex(mix(r, 0, 0.55), mix(g, 0, 0.55), mix(b, 0, 0.55)) },
    { label: '900', hex: toHex(mix(r, 0, 0.75), mix(g, 0, 0.75), mix(b, 0, 0.75)) },
  ];
}

/**
 * Main parse function from any hex or rgb input string
 */
export function inspectColor(input: string): ColorDetails | null {
  if (!input) return null;

  let rgba: RGBA | null = null;
  const raw = input.trim();

  // Try RGB/RGBA pattern
  const rgbMatch = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (rgbMatch) {
    rgba = {
      r: Math.min(255, parseInt(rgbMatch[1], 10)),
      g: Math.min(255, parseInt(rgbMatch[2], 10)),
      b: Math.min(255, parseInt(rgbMatch[3], 10)),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  } else {
    // Try Hex
    rgba = hexToRgba(raw);
  }

  if (!rgba) return null;

  const padHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  const hex = `#${padHex(rgba.r)}${padHex(rgba.g)}${padHex(rgba.b)}`;
  const alphaHex = padHex(Math.round(rgba.a * 255));
  const hex8 = `${hex}${alphaHex}`;

  const rgb: RGB = { r: rgba.r, g: rgba.g, b: rgba.b };
  const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
  const cmyk = rgbToCmyk(rgba.r, rgba.g, rgba.b);

  const luminance = getLuminance(rgba.r, rgba.g, rgba.b);
  const whiteLum = 1.0;
  const blackLum = 0.0;
  const ratioOnWhite = getContrastRatio(luminance, whiteLum);
  const ratioOnBlack = getContrastRatio(luminance, blackLum);

  const contrast: ContrastDetails = {
    ratioOnWhite,
    ratioOnBlack,
    recommendedText: ratioOnWhite > ratioOnBlack ? '#ffffff' : '#000000',
    whitePassAA: ratioOnWhite >= 4.5,
    whitePassAAA: ratioOnWhite >= 7.0,
    blackPassAA: ratioOnBlack >= 4.5,
    blackPassAAA: ratioOnBlack >= 7.0,
  };

  const nearestTailwind = getNearestTailwind(rgba.r, rgba.g, rgba.b);
  const shades = generateShades(rgba.r, rgba.g, rgba.b);

  return {
    hex,
    hex8,
    rgb,
    rgba,
    hsl,
    cmyk,
    rgbString: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`,
    rgbaString: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmykString: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    cssVar: `--color: ${hex.toLowerCase()};`,
    luminance: Math.round(luminance * 1000) / 1000,
    contrast,
    nearestTailwind,
    shades,
  };
}

/**
 * Scans arbitrary text (CSS, JSON, markdown, logs) and extracts all valid unique hex colors
 */
export function extractHexColors(text: string): { hex: string; count: number; details: ColorDetails }[] {
  if (!text) return [];

  // Match #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  const regex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  const matches = text.match(regex) || [];

  const countMap = new Map<string, number>();
  for (const m of matches) {
    const cleaned = cleanHex(m);
    if (cleaned) {
      const fullHex = `#${cleaned.slice(0, 6).toUpperCase()}`;
      countMap.set(fullHex, (countMap.get(fullHex) || 0) + 1);
    }
  }

  const results: { hex: string; count: number; details: ColorDetails }[] = [];
  countMap.forEach((count, hex) => {
    const details = inspectColor(hex);
    if (details) {
      results.push({ hex, count, details });
    }
  });

  return results;
}
