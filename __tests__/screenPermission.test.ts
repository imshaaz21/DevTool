import {
  decompressScreenPermission,
  compressScreenPermission,
  normalizeBase64,
  uint8ArrayToBase64,
  base64ToUint8Array,
  SAMPLE_SCREEN_PERMISSION_JSON,
  SAMPLE_SCREEN_PERMISSION_BASE64_GZIP
} from '@/utils/screenPermission';

describe('Screen Permission Gzip Utility', () => {
  it('should normalize base64 strings with whitespace and quotes', () => {
    const raw = ' "H4sIAAAAAAAA" ';
    expect(normalizeBase64(raw)).toBe('H4sIAAAAAAAA');
  });

  it('should handle URL-safe base64 characters (- and _)', () => {
    const urlSafe = 'ab-_';
    expect(normalizeBase64(urlSafe)).toBe('ab+/');
  });

  it('should pad base64 string if length is not multiple of 4', () => {
    const unpadded = 'YWJj'; // 4 chars
    expect(normalizeBase64(unpadded)).toBe('YWJj');
    const needPad = 'YWJ'; // 3 chars
    expect(normalizeBase64(needPad)).toBe('YWJ=');
  });

  it('should decompress the sample screen permission payload to formatted JSON', () => {
    expect(SAMPLE_SCREEN_PERMISSION_BASE64_GZIP).toBeTruthy();
    const result = decompressScreenPermission(SAMPLE_SCREEN_PERMISSION_BASE64_GZIP);
    expect(result.success).toBe(true);
    expect(result.isJson).toBe(true);
    expect(result.parsedJson).toBeDefined();
    expect(result.parsedJson.screenId).toBe('SCR_SECURITY_ROLES_MGMT');
    expect(result.formattedJson).toBe(SAMPLE_SCREEN_PERMISSION_JSON);
  });

  it('should perform round-trip compression and decompression', () => {
    const originalText = JSON.stringify({
      user: 'admin',
      screens: ['DASHBOARD', 'REPORTS', 'SETTINGS'],
      enabled: true
    });

    const compResult = compressScreenPermission(originalText);
    expect(compResult.success).toBe(true);
    expect(compResult.base64Gzip).toBeTruthy();

    const decompResult = decompressScreenPermission(compResult.base64Gzip);
    expect(decompResult.success).toBe(true);
    expect(decompResult.decompressedText).toBe(originalText);
    expect(decompResult.isJson).toBe(true);
    expect(decompResult.parsedJson.user).toBe('admin');
  });

  it('should return error on invalid base64 input', () => {
    const result = decompressScreenPermission('!!!invalid-base-64!!!');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error on valid base64 that is not gzip compressed', () => {
    const plainBase64 = btoa('Hello world, this is not gzip!');
    const result = decompressScreenPermission(plainBase64);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Decompression failed/i);
  });

  it('should return error on empty input for decompress and compress', () => {
    const dResult = decompressScreenPermission('');
    expect(dResult.success).toBe(false);

    const cResult = compressScreenPermission('');
    expect(cResult.success).toBe(false);
  });
});
