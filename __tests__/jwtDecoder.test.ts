import {
  cleanJwtToken,
  base64UrlDecode,
  decodeJwt,
  SAMPLE_ACTIVE_JWT,
  SAMPLE_BEARER_JWT,
  SAMPLE_EXPIRED_JWT,
  isTimestampClaim,
} from '@/lib/jwtDecoder';

describe('jwtDecoder utility', () => {
  describe('cleanJwtToken', () => {
    it('strips "Bearer " prefix case-insensitively', () => {
      expect(cleanJwtToken('Bearer eyJhbGciOi...').cleaned).toBe('eyJhbGciOi...');
      expect(cleanJwtToken('bearer eyJhbGciOi...').cleaned).toBe('eyJhbGciOi...');
      expect(cleanJwtToken('BEARER eyJhbGciOi...').cleaned).toBe('eyJhbGciOi...');
      expect(cleanJwtToken('Bearer eyJhbGciOi...').hadBearerPrefix).toBe(true);
    });

    it('retains token without Bearer prefix', () => {
      const res = cleanJwtToken('eyJhbGciOi...');
      expect(res.cleaned).toBe('eyJhbGciOi...');
      expect(res.hadBearerPrefix).toBe(false);
    });

    it('strips enclosing quotes and trims whitespace', () => {
      expect(cleanJwtToken('  "Bearer eyJhbGciOi..."  ').cleaned).toBe('eyJhbGciOi...');
      expect(cleanJwtToken(" 'eyJhbGciOi...' ").cleaned).toBe('eyJhbGciOi...');
    });
  });

  describe('base64UrlDecode', () => {
    it('decodes base64url characters with hyphens and underscores', () => {
      // {"alg":"HS256","typ":"JWT"} in base64url is eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
      const decoded = base64UrlDecode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(JSON.parse(decoded)).toEqual({ alg: 'HS256', typ: 'JWT' });
    });
  });

  describe('decodeJwt', () => {
    it('decodes clean active token without Bearer prefix', () => {
      const res = decodeJwt(SAMPLE_ACTIVE_JWT);
      expect(res.valid).toBe(true);
      expect(res.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(res.payload?.sub).toBe('1234567890');
      expect(res.payload?.name).toBe('Ali Al-Shahrani');
      expect(res.hadBearerPrefix).toBe(false);
      expect(res.algorithm).toBe('HS256');
      expect(res.isExpired).toBe(false);
      expect(res.expiresInText).toContain('Active');
    });

    it('decodes token with Bearer prefix seamlessly', () => {
      const res = decodeJwt(SAMPLE_BEARER_JWT);
      expect(res.valid).toBe(true);
      expect(res.hadBearerPrefix).toBe(true);
      expect(res.payload?.email).toBe('ali.shahrani@csi.com');
      expect(res.payload?.roles).toContain('ADMIN');
    });

    it('detects and labels expired tokens', () => {
      const res = decodeJwt(SAMPLE_EXPIRED_JWT);
      expect(res.valid).toBe(true);
      expect(res.isExpired).toBe(true);
      expect(res.expiresInText).toContain('Expired');
    });

    it('returns friendly error for empty token', () => {
      const res = decodeJwt('');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Empty token input');
    });

    it('returns error for invalid segment count', () => {
      const res = decodeJwt('part1.part2.part3.part4');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Expected 3 segments separated by dots');
    });

    it('returns error for malformed base64 segments', () => {
      const res = decodeJwt('invalidHeader.invalidPayload.sig');
      expect(res.valid).toBe(false);
      expect(res.error).toBeTruthy();
    });

    it('formats timestamps with specified timezone', () => {
      const res = decodeJwt(SAMPLE_ACTIVE_JWT, 'Asia/Kolkata');
      expect(res.valid).toBe(true);
      expect(res.expiresInText).toContain('Asia/Kolkata');
    });
  });

  describe('isTimestampClaim', () => {
    it('identifies standard timestamp claims', () => {
      expect(isTimestampClaim('exp', 1994972800)).toBe(true);
      expect(isTimestampClaim('iat', 1742555200)).toBe(true);
      expect(isTimestampClaim('nbf', 1742555200)).toBe(true);
      expect(isTimestampClaim('sub', '12345')).toBe(false);
      expect(isTimestampClaim('roles', ['admin'])).toBe(false);
    });
  });
});
