/**
 * Minimal DER reader.
 *
 * Only what X.509 needs, and deliberately strict: lengths are bounds checked,
 * recursion is capped, and anything malformed throws rather than returning a
 * half parsed structure. Written by hand to avoid pulling a general purpose
 * crypto library into a client bundle for one read-only tool.
 */
export const TAG = {
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  BIT_STRING: 0x03,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OID: 0x06,
  UTF8_STRING: 0x0c,
  SEQUENCE: 0x10,
  SET: 0x11,
  PRINTABLE_STRING: 0x13,
  T61_STRING: 0x14,
  IA5_STRING: 0x16,
  UTC_TIME: 0x17,
  GENERALIZED_TIME: 0x18,
  BMP_STRING: 0x1e,
} as const;

export const TAG_CLASS = {
  UNIVERSAL: 0,
  APPLICATION: 1,
  CONTEXT: 2,
  PRIVATE: 3,
} as const;

export interface Asn1Node {
  tagClass: number;
  constructed: boolean;
  tagNumber: number;
  /** Content bytes, excluding tag and length. */
  content: Uint8Array;
  /** Offset of the first byte of this node within the buffer it came from. */
  offset: number;
  /** Total bytes consumed, including tag and length. */
  totalLength: number;
  children: Asn1Node[];
}

const MAX_DEPTH = 32;

function readLength(bytes: Uint8Array, offset: number): { length: number; bytesRead: number } {
  if (offset >= bytes.length) throw new Error('Truncated: no length byte.');

  const first = bytes[offset];
  if (first < 0x80) return { length: first, bytesRead: 1 };

  const count = first & 0x7f;
  if (count === 0) throw new Error('Indefinite lengths are not valid in DER.');
  if (count > 4) throw new Error('Length field is implausibly large.');
  if (offset + count >= bytes.length) throw new Error('Truncated length field.');

  let length = 0;
  for (let i = 1; i <= count; i += 1) {
    length = length * 256 + bytes[offset + i];
  }
  return { length, bytesRead: count + 1 };
}

export function parseAsn1(bytes: Uint8Array, offset = 0, depth = 0): Asn1Node {
  if (depth > MAX_DEPTH) throw new Error('Structure is nested too deeply.');
  if (offset >= bytes.length) throw new Error('Truncated: no tag byte.');

  const identifier = bytes[offset];
  const tagClass = (identifier & 0xc0) >> 6;
  const constructed = (identifier & 0x20) !== 0;
  let tagNumber = identifier & 0x1f;
  let cursor = offset + 1;

  if (tagNumber === 0x1f) {
    // High tag number form: base 128, continuation bit set on all but the last.
    tagNumber = 0;
    let byte: number;
    do {
      if (cursor >= bytes.length) throw new Error('Truncated tag number.');
      byte = bytes[cursor];
      tagNumber = tagNumber * 128 + (byte & 0x7f);
      cursor += 1;
    } while ((byte & 0x80) !== 0);
  }

  const { length, bytesRead } = readLength(bytes, cursor);
  cursor += bytesRead;

  const end = cursor + length;
  if (end > bytes.length) throw new Error('Declared length runs past the end of the data.');

  const content = bytes.subarray(cursor, end);
  const node: Asn1Node = {
    tagClass,
    constructed,
    tagNumber,
    content,
    offset,
    totalLength: end - offset,
    children: [],
  };

  if (constructed) {
    let childOffset = 0;
    while (childOffset < content.length) {
      const child = parseAsn1(content, childOffset, depth + 1);
      node.children.push(child);
      if (child.totalLength <= 0) throw new Error('Zero length element: refusing to loop.');
      childOffset += child.totalLength;
    }
  }

  return node;
}

export function decodeOid(content: Uint8Array): string {
  if (content.length === 0) return '';

  const subIdentifiers: number[] = [];
  let value = 0;
  for (let i = 0; i < content.length; i += 1) {
    value = value * 128 + (content[i] & 0x7f);
    if ((content[i] & 0x80) === 0) {
      subIdentifiers.push(value);
      value = 0;
    }
  }
  if (subIdentifiers.length === 0) return '';

  // The first subidentifier packs two arcs as 40 * arc1 + arc2. Arc 1 is at
  // most 2, and under arc 2 the second arc is not capped at 39, so the whole
  // subidentifier has to be decoded before it is split.
  const first = subIdentifiers[0];
  const arcs = first < 80 ? [Math.floor(first / 40), first % 40] : [2, first - 80];

  return arcs.concat(subIdentifiers.slice(1)).join('.');
}

export function decodeInteger(content: Uint8Array): string {
  if (content.length === 0) return '0';
  return toHex(content).replace(/^00/, '') || '0';
}

export function toHex(bytes: Uint8Array, separator = ''): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    parts.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return parts.join(separator);
}

export function decodeString(node: Asn1Node): string {
  const { content, tagNumber } = node;

  if (tagNumber === TAG.BMP_STRING) {
    // UCS-2, big endian.
    let out = '';
    for (let i = 0; i + 1 < content.length; i += 2) {
      out += String.fromCharCode((content[i] << 8) | content[i + 1]);
    }
    return out;
  }

  if (typeof TextDecoder !== 'undefined') {
    const encoding = tagNumber === TAG.UTF8_STRING ? 'utf-8' : 'latin1';
    try {
      return new TextDecoder(encoding).decode(content);
    } catch {
      // Fall through to the manual path.
    }
  }

  let out = '';
  for (let i = 0; i < content.length; i += 1) out += String.fromCharCode(content[i]);
  return out;
}

/**
 * Reads an ASN.1 time. UTCTime carries a two digit year, which the RFC pivots
 * at 50: 49 means 2049, 50 means 1950.
 */
export function decodeTime(node: Asn1Node): Date | null {
  const text = decodeString(node).trim();
  const isGeneralized = node.tagNumber === TAG.GENERALIZED_TIME;

  const pattern = isGeneralized
    ? /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z?$/
    : /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z?$/;

  const match = pattern.exec(text);
  if (!match) return null;

  let year = Number(match[1]);
  if (!isGeneralized) year += year >= 50 ? 1900 : 2000;

  const date = new Date(
    Date.UTC(
      year,
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? '0')
    )
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Decodes base64 to bytes without assuming a Node Buffer. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
