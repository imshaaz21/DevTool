import {
  MB,
  MAX_IMAGE_PIXELS,
  IMAGE_UPLOAD_RULE,
  ENCODABLE_UPLOAD_RULE,
  MARKUP_UPLOAD_RULE,
  CERTIFICATE_UPLOAD_RULE,
  ENV_UPLOAD_RULE,
  checkUpload,
  checkImagePixels,
  formatFileSize,
  truncateFileName,
} from '../lib/fileGuards';

const file = (name: string, size: number, type: string) => ({ name, size, type });

describe('file guards', () => {
  describe('checkUpload', () => {
    it('accepts a normal image', () => {
      expect(checkUpload(file('shot.png', 400 * 1024, 'image/png'), IMAGE_UPLOAD_RULE)).toEqual({
        ok: true,
      });
    });

    it('rejects an empty file', () => {
      const result = checkUpload(file('shot.png', 0, 'image/png'), IMAGE_UPLOAD_RULE);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it('rejects a file whose type does not match the rule', () => {
      const result = checkUpload(file('clip.mp4', 1024, 'video/mp4'), IMAGE_UPLOAD_RULE);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/not a supported/i);
    });

    it('accepts a known extension when the browser reports a generic type', () => {
      // Browsers send application/octet-stream for plenty of ordinary files, so the
      // extension has to count. Content is validated when the file is decoded.
      expect(
        checkUpload(file('notes.md', 1024, 'application/octet-stream'), MARKUP_UPLOAD_RULE).ok
      ).toBe(true);
    });

    it('still rejects a generic type whose extension is unknown', () => {
      expect(
        checkUpload(file('payload.exe', 1024, 'application/octet-stream'), IMAGE_UPLOAD_RULE).ok
      ).toBe(false);
    });

    it('falls back to the extension when the browser reports no type', () => {
      expect(checkUpload(file('diagram.webp', 2048, ''), IMAGE_UPLOAD_RULE).ok).toBe(true);
    });

    it('rejects an unknown file with no type and no known extension', () => {
      expect(checkUpload(file('mystery.bin', 2048, ''), IMAGE_UPLOAD_RULE).ok).toBe(false);
    });

    it('rejects a file over the size limit and names both sizes', () => {
      const result = checkUpload(file('huge.png', 40 * MB, 'image/png'), IMAGE_UPLOAD_RULE);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('40.0 MB');
      expect(result.error).toContain('25.0 MB');
    });

    it('accepts a file exactly on the limit', () => {
      expect(
        checkUpload(file('edge.png', IMAGE_UPLOAD_RULE.maxBytes, 'image/png'), IMAGE_UPLOAD_RULE).ok
      ).toBe(true);
    });

    it('accepts PDFs under the encodable rule but not under the image rule', () => {
      const pdf = file('report.pdf', 1024, 'application/pdf');
      expect(checkUpload(pdf, ENCODABLE_UPLOAD_RULE).ok).toBe(true);
      expect(checkUpload(pdf, IMAGE_UPLOAD_RULE).ok).toBe(false);
    });

    it('caps markup uploads more tightly than images', () => {
      expect(MARKUP_UPLOAD_RULE.maxBytes).toBeLessThan(IMAGE_UPLOAD_RULE.maxBytes);
      expect(checkUpload(file('page.html', 5 * MB, 'text/html'), MARKUP_UPLOAD_RULE).ok).toBe(false);
      expect(checkUpload(file('notes.md', 10 * 1024, 'text/markdown'), MARKUP_UPLOAD_RULE).ok).toBe(true);
    });

    it('keeps a hostile filename out of the message body', () => {
      const long = `${'a'.repeat(400)}.png`;
      const result = checkUpload(file(long, 40 * MB, 'image/png'), IMAGE_UPLOAD_RULE);
      expect(result.error!.length).toBeLessThan(200);
    });
  });

  describe('checkImagePixels', () => {
    it('accepts an ordinary screenshot', () => {
      expect(checkImagePixels(2560, 1440)).toEqual({ ok: true });
    });

    it('rejects a bitmap over the pixel budget', () => {
      const result = checkImagePixels(10000, 10000);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/100.0 MP/);
    });

    it('rejects an image with no usable dimensions', () => {
      expect(checkImagePixels(0, 0).ok).toBe(false);
      expect(checkImagePixels(Number.NaN, 100).ok).toBe(false);
    });

    it('accepts an image exactly on the budget', () => {
      const side = Math.sqrt(MAX_IMAGE_PIXELS);
      expect(checkImagePixels(side, side).ok).toBe(true);
    });

    it('honours a custom budget', () => {
      expect(checkImagePixels(2000, 2000, 1_000_000).ok).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it.each([
      [0, '0 B'],
      [512, '512 B'],
      [1536, '1.5 KB'],
      [5 * MB, '5.0 MB'],
      [3 * 1024 * MB, '3.0 GB'],
    ])('formats %i bytes as %s', (bytes, expected) => {
      expect(formatFileSize(bytes)).toBe(expected);
    });
  });

  describe('truncateFileName', () => {
    it('leaves a short name alone', () => {
      expect(truncateFileName('shot.png')).toBe('shot.png');
    });

    it('shortens a long name with an ellipsis', () => {
      const result = truncateFileName('x'.repeat(100), 10);
      expect(result).toHaveLength(10);
      expect(result.endsWith('…')).toBe(true);
    });
  });

  describe('CERTIFICATE_UPLOAD_RULE', () => {
    it.each(['server.pem', 'server.crt', 'server.cer', 'server.der'])('accepts %s', (name) => {
      expect(checkUpload(file(name, 2048, ''), CERTIFICATE_UPLOAD_RULE).ok).toBe(true);
    });

    it('rejects an archive', () => {
      expect(checkUpload(file('bundle.zip', 2048, 'application/zip'), CERTIFICATE_UPLOAD_RULE).ok).toBe(false);
    });

    it('rejects a file too large to be a certificate', () => {
      const result = checkUpload(file('huge.pem', 4 * MB, ''), CERTIFICATE_UPLOAD_RULE);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/limit is 1.0 MB/);
    });
  });

  describe('ENV_UPLOAD_RULE', () => {
    it.each(['.env', '.env.local', '.env.production', 'app.properties', 'notes.txt'])(
      'accepts %s',
      (name) => {
        expect(checkUpload(file(name, 512, ''), ENV_UPLOAD_RULE).ok).toBe(true);
      }
    );

    it('rejects a binary', () => {
      expect(checkUpload(file('app.jar', 512, 'application/java-archive'), ENV_UPLOAD_RULE).ok).toBe(false);
    });

    it('rejects a file larger than half a megabyte', () => {
      expect(checkUpload(file('.env', MB, ''), ENV_UPLOAD_RULE).ok).toBe(false);
    });
  });
});
