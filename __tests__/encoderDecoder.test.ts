import { webcrypto } from 'crypto';
import {
  encodeBase64,
  decodeBase64,
  hashMD5,
  hashSHA1,
  hashSHA256,
  hashSHA512,
} from '../lib/encoderDecoder';

// jsdom exposes no SubtleCrypto, so the Node implementation stands in for it.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

describe('encoder / decoder', () => {
  describe('base64', () => {
    it('round trips plain ASCII', () => {
      expect(decodeBase64(encodeBase64('hello world'))).toBe('hello world');
    });

    it('encodes to the expected value', () => {
      expect(encodeBase64('hello world')).toBe('aGVsbG8gd29ybGQ=');
    });

    it('round trips multi-byte characters', () => {
      const input = 'مرحبا بالعالم 🌍 çédille';
      expect(decodeBase64(encodeBase64(input))).toBe(input);
    });

    it('handles an empty string', () => {
      expect(encodeBase64('')).toBe('');
      expect(decodeBase64('')).toBe('');
    });

    it('rejects a value that is not base64', () => {
      expect(() => decodeBase64('!!! not base64 !!!')).toThrow(/Invalid Base64/);
    });
  });

  describe('hashes', () => {
    // Values from the well known test vectors for "abc".
    it('computes MD5', () => {
      expect(hashMD5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    });

    it('computes SHA-1', async () => {
      await expect(hashSHA1('abc')).resolves.toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    });

    it('computes SHA-256', async () => {
      await expect(hashSHA256('abc')).resolves.toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });

    it('computes SHA-512', async () => {
      await expect(hashSHA512('abc')).resolves.toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
          '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
      );
    });

    it('hashes the empty string', () => {
      expect(hashMD5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('produces a different digest for a one character change', async () => {
      const [a, b] = await Promise.all([hashSHA256('abc'), hashSHA256('abd')]);
      expect(a).not.toBe(b);
    });
  });
});
