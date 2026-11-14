import {
  TAG,
  TAG_CLASS,
  parseAsn1,
  decodeOid,
  decodeInteger,
  decodeString,
  decodeTime,
  toHex,
  base64ToBytes,
} from '../lib/asn1';

const bytes = (...values: number[]) => new Uint8Array(values);

/** A primitive node, for the decoders that take one. */
const node = (tagNumber: number, content: Uint8Array) =>
  parseAsn1(new Uint8Array([tagNumber, content.length, ...Array.from(content)]));

describe('ASN.1 DER reader', () => {
  describe('parseAsn1', () => {
    it('reads a primitive with a short length', () => {
      const result = parseAsn1(bytes(0x02, 0x01, 0x05));
      expect(result.tagNumber).toBe(TAG.INTEGER);
      expect(result.tagClass).toBe(TAG_CLASS.UNIVERSAL);
      expect(result.constructed).toBe(false);
      expect(Array.from(result.content)).toEqual([0x05]);
      expect(result.totalLength).toBe(3);
      expect(result.children).toEqual([]);
    });

    it('reads a long form length', () => {
      const content = new Uint8Array(300).fill(0x41);
      const der = new Uint8Array([0x04, 0x82, 0x01, 0x2c, ...Array.from(content)]);
      const result = parseAsn1(der);
      expect(result.content.length).toBe(300);
      expect(result.totalLength).toBe(304);
    });

    it('reads a constructed sequence and its children', () => {
      const result = parseAsn1(bytes(0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02));
      expect(result.constructed).toBe(true);
      expect(result.children).toHaveLength(2);
      expect(result.children.map((child) => Array.from(child.content))).toEqual([[1], [2]]);
    });

    it('reads a context specific tag', () => {
      const result = parseAsn1(bytes(0xa0, 0x03, 0x02, 0x01, 0x02));
      expect(result.tagClass).toBe(TAG_CLASS.CONTEXT);
      expect(result.tagNumber).toBe(0);
      expect(result.constructed).toBe(true);
    });

    it('reads a high tag number', () => {
      const result = parseAsn1(bytes(0x1f, 0x81, 0x00, 0x00));
      expect(result.tagNumber).toBe(128);
    });

    it('reads an empty content element', () => {
      const result = parseAsn1(bytes(0x05, 0x00));
      expect(result.content.length).toBe(0);
      expect(result.totalLength).toBe(2);
    });

    it('starts from an offset', () => {
      const result = parseAsn1(bytes(0xff, 0xff, 0x02, 0x01, 0x07), 2);
      expect(Array.from(result.content)).toEqual([0x07]);
      expect(result.offset).toBe(2);
    });

    it('refuses empty input', () => {
      expect(() => parseAsn1(bytes())).toThrow(/Truncated: no tag byte/);
    });

    it('refuses a length that runs past the data', () => {
      expect(() => parseAsn1(bytes(0x04, 0x10, 0x01))).toThrow(/runs past the end/);
    });

    it('refuses a truncated high tag number', () => {
      expect(() => parseAsn1(bytes(0x1f, 0x81))).toThrow(/Truncated tag number/);
    });

    it('refuses an indefinite length, which DER does not allow', () => {
      expect(() => parseAsn1(bytes(0x30, 0x80, 0x00, 0x00))).toThrow();
    });

    it('refuses a structure nested past the depth limit', () => {
      // 40 nested single byte sequences, each wrapping the next.
      let der = bytes(0x05, 0x00);
      for (let i = 0; i < 40; i += 1) {
        der = new Uint8Array([0x30, der.length, ...Array.from(der)]);
      }
      expect(() => parseAsn1(der)).toThrow(/nested too deeply/);
    });
  });

  describe('decodeOid', () => {
    it('decodes an empty OID as empty', () => {
      expect(decodeOid(bytes())).toBe('');
    });

    it('decodes commonName', () => {
      expect(decodeOid(bytes(0x55, 0x04, 0x03))).toBe('2.5.4.3');
    });

    it('decodes sha256WithRSAEncryption, which uses multi byte arcs', () => {
      expect(decodeOid(bytes(0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b))).toBe(
        '1.2.840.113549.1.1.11'
      );
    });

    it('decodes an arc under the joint-iso-itu-t root', () => {
      expect(decodeOid(bytes(0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01))).toBe(
        '2.16.840.1.101.3.4.2.1'
      );
    });

    it('decodes a second arc above 39, which only the 2 root allows', () => {
      // 2.100.3, where the first subidentifier is 180 and needs two bytes.
      expect(decodeOid(bytes(0x81, 0x34, 0x03))).toBe('2.100.3');
    });
  });

  describe('decodeInteger', () => {
    it('reads zero', () => {
      expect(decodeInteger(bytes(0x00))).toBe('0');
      expect(decodeInteger(bytes())).toBe('0');
    });

    it('reads a serial number as hex', () => {
      expect(decodeInteger(bytes(0x14, 0xea, 0x6b))).toBe('14ea6b');
    });

    it('drops the leading zero DER adds to keep a value positive', () => {
      expect(decodeInteger(bytes(0x00, 0xff, 0x01))).toBe('ff01');
    });
  });

  describe('toHex', () => {
    it('pads each byte to two digits', () => {
      expect(toHex(bytes(0x00, 0x0f, 0xff))).toBe('000fff');
    });

    it('joins with a separator for fingerprints', () => {
      expect(toHex(bytes(0xde, 0xad), ':')).toBe('de:ad');
    });

    it('returns nothing for no bytes', () => {
      expect(toHex(bytes())).toBe('');
    });
  });

  describe('decodeString', () => {
    it('reads a printable string', () => {
      expect(decodeString(node(TAG.PRINTABLE_STRING, bytes(0x61, 0x62, 0x63)))).toBe('abc');
    });

    it('reads a UTF-8 string with multi byte characters', () => {
      const utf8 = new TextEncoder().encode('Riyadh الرياض');
      expect(decodeString(node(TAG.UTF8_STRING, utf8))).toBe('Riyadh الرياض');
    });

    it('reads a BMPString as big endian UCS-2', () => {
      expect(decodeString(node(TAG.BMP_STRING, bytes(0x00, 0x41, 0x00, 0x42)))).toBe('AB');
    });

    it('reads an empty string', () => {
      expect(decodeString(node(TAG.PRINTABLE_STRING, bytes()))).toBe('');
    });
  });

  describe('decodeTime', () => {
    const utcTime = (text: string) => node(TAG.UTC_TIME, new TextEncoder().encode(text));
    const generalizedTime = (text: string) =>
      node(TAG.GENERALIZED_TIME, new TextEncoder().encode(text));

    it('reads a UTCTime', () => {
      expect(decodeTime(utcTime('261114103000Z'))!.toISOString()).toBe('2026-11-14T10:30:00.000Z');
    });

    it('reads a UTCTime with no seconds', () => {
      expect(decodeTime(utcTime('2611141030Z'))!.toISOString()).toBe('2026-11-14T10:30:00.000Z');
    });

    it('pivots a two digit year below 50 into this century', () => {
      expect(decodeTime(utcTime('490101000000Z'))!.getUTCFullYear()).toBe(2049);
    });

    it('pivots a two digit year of 50 or more into the last century', () => {
      expect(decodeTime(utcTime('500101000000Z'))!.getUTCFullYear()).toBe(1950);
    });

    it('reads a GeneralizedTime with a four digit year', () => {
      expect(decodeTime(generalizedTime('20991231235959Z'))!.toISOString()).toBe(
        '2099-12-31T23:59:59.000Z'
      );
    });

    it('returns null for text that is not a time', () => {
      expect(decodeTime(utcTime('not a time'))).toBeNull();
    });
  });

  describe('base64ToBytes', () => {
    it('decodes base64', () => {
      expect(Array.from(base64ToBytes('AQID'))).toEqual([1, 2, 3]);
    });

    it('ignores the line breaks PEM wraps at', () => {
      expect(Array.from(base64ToBytes('AQ\nID\n'))).toEqual([1, 2, 3]);
    });

    it('decodes an empty string to no bytes', () => {
      expect(base64ToBytes('').length).toBe(0);
    });

    it('throws on input that is not base64, for the caller to report', () => {
      expect(() => base64ToBytes('!!!!')).toThrow();
    });
  });
});
