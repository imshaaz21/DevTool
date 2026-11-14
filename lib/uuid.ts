/**
 * UUID generation.
 *
 * `crypto.randomUUID` only exists in secure contexts, so a page served over
 * plain HTTP (a LAN preview, an internal host) would otherwise throw. The
 * fallback builds an RFC 4122 version 4 value from `crypto.getRandomValues`,
 * which is available far more widely and is still cryptographically random.
 */
export const MIN_UUID_COUNT = 1;
export const MAX_UUID_COUNT = 50;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomUuidFromBytes(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Version 4, and the RFC 4122 variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Indexed loop: the build targets es5, where iterating a typed array needs downlevelIteration.
  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hex.push(bytes[i].toString(16).padStart(2, '0'));
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return randomUuidFromBytes();
}

/** Clamps to the supported range rather than throwing on a bad input. */
export function clampUuidCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_UUID_COUNT;
  return Math.min(Math.max(Math.trunc(count), MIN_UUID_COUNT), MAX_UUID_COUNT);
}

export function generateUuids(count: number): string[] {
  return Array.from({ length: clampUuidCount(count) }, generateUuid);
}

export function isValidUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value.trim());
}
