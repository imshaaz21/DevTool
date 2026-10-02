import {
  generateCodeVerifier,
  validateCodeVerifier,
  deriveCodeChallenge,
  computePkce,
  verifyPkcePair,
  toBase64Url,
  UNRESERVED_CHARACTERS,
  MIN_VERIFIER_LENGTH,
  MAX_VERIFIER_LENGTH,
} from '../lib/pkce';

describe('PKCE Utility Functions (lib/pkce)', () => {
  describe('toBase64Url', () => {
    it('converts standard Base64 to URL-safe Base64 without padding', () => {
      expect(toBase64Url('ab+cd/ef==')).toBe('ab-cd_ef');
      expect(toBase64Url('2IcwB8OI04TcgTzwMSV1L41/tmXIq3k1rnGrMBCoGO8=')).toBe(
        '2IcwB8OI04TcgTzwMSV1L41_tmXIq3k1rnGrMBCoGO8'
      );
    });
  });

  describe('generateCodeVerifier', () => {
    it('generates a 64-character verifier by default', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(64);
    });

    it('generates verifiers with custom lengths within bounds', () => {
      const v43 = generateCodeVerifier(43);
      expect(v43.length).toBe(43);

      const v128 = generateCodeVerifier(128);
      expect(v128.length).toBe(128);
    });

    it('clamps lengths that are out of bounds', () => {
      const tooShort = generateCodeVerifier(10);
      expect(tooShort.length).toBe(MIN_VERIFIER_LENGTH);

      const tooLong = generateCodeVerifier(200);
      expect(tooLong.length).toBe(MAX_VERIFIER_LENGTH);
    });

    it('only contains RFC 7636 unreserved characters', () => {
      const verifier = generateCodeVerifier(100);
      for (const char of verifier) {
        expect(UNRESERVED_CHARACTERS.includes(char)).toBe(true);
      }
    });

    it('generates unique verifiers', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe('validateCodeVerifier', () => {
    it('validates RFC 7636 compliant verifier', () => {
      const valid = 'a'.repeat(43);
      const res = validateCodeVerifier(valid);
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('reports error when verifier is shorter than 43 characters', () => {
      const res = validateCodeVerifier('too-short');
      expect(res.isValid).toBe(false);
      expect(res.isTooShort).toBe(true);
      expect(res.errors[0]).toContain('at least 43');
    });

    it('reports error when verifier is longer than 128 characters', () => {
      const res = validateCodeVerifier('a'.repeat(129));
      expect(res.isValid).toBe(false);
      expect(res.isTooLong).toBe(true);
      expect(res.errors[0]).toContain('at most 128');
    });

    it('reports error when verifier contains invalid characters', () => {
      const invalid = 'valid-part-of-verifier-with-length-greater-than-43-chars!@#$%^';
      const res = validateCodeVerifier(invalid);
      expect(res.isValid).toBe(false);
      expect(res.hasInvalidChars).toBe(true);
      expect(res.invalidChars).toEqual(expect.arrayContaining(['!', '@', '#', '$', '%', '^']));
    });
  });

  describe('deriveCodeChallenge & computePkce', () => {
    it('matches RFC 7636 Appendix B test vector', () => {
      // Official RFC 7636 Appendix B:
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const result = deriveCodeChallenge(verifier, 'S256');
      expect(result.codeChallenge).toBe(expectedChallenge);
    });

    it('correctly derives SHA-256 hex, base64 and base64url challenge for RFC 7636 vector', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

      const result = deriveCodeChallenge(verifier, 'S256');
      expect(result.hexSha256).toBe('13d31e961a1ad8ec2f16b10c4c982e0876a878ad6df144566ee1894acb70f9c3');
      expect(result.standardBase64).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw+cM=');
      expect(result.codeChallenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    });

    it('handles plain method challenge', () => {
      const verifier = 'test-verifier-plain-method-long-enough-for-rfc-standards-43-chars';
      const result = deriveCodeChallenge(verifier, 'plain');
      expect(result.codeChallenge).toBe(verifier);
      expect(result.hexSha256).toBeUndefined();
    });

    it('computePkce returns comprehensive result', () => {
      const verifier = generateCodeVerifier(50);
      const res = computePkce(verifier, 'S256');
      expect(res.codeVerifier).toBe(verifier);
      expect(res.codeChallenge).toBeDefined();
      expect(res.hexSha256).toBeDefined();
      expect(res.validation.isValid).toBe(true);
    });
  });

  describe('verifyPkcePair', () => {
    it('returns matches: true for a valid pair', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const check = verifyPkcePair(verifier, challenge, 'S256');
      expect(check.matches).toBe(true);
      expect(check.expectedChallenge).toBe(challenge);
    });

    it('returns matches: false for an incorrect challenge', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const wrongChallenge = 'wrong-challenge-value';

      const check = verifyPkcePair(verifier, wrongChallenge, 'S256');
      expect(check.matches).toBe(false);
      expect(check.expectedChallenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    });

    it('verifies plain method pairs', () => {
      const verifier = 'a-random-verifier-string-that-has-sufficient-length-now';
      const check = verifyPkcePair(verifier, verifier, 'plain');
      expect(check.matches).toBe(true);
    });
  });
});
