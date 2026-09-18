import {
  extractMimeType,
  getImageMetadata,
  normalizeBase64,
  formatFileSize,
} from '@/utils/base64ImageViewer';

describe('base64ImageViewer utility', () => {
  const samplePdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCnRyYWlsZXI8PC9Sb290IDEgMCBSL1NpemUgNT4+CnN0YXJ0eHJlZgoyNzIKJSVFT0Y=';
  const samplePdfDataUrl = `data:application/pdf;base64,${samplePdfBase64}`;
  const samplePngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  describe('extractMimeType', () => {
    it('detects application/pdf from raw base64 starting with JVBERi', () => {
      const mime = extractMimeType(samplePdfBase64);
      expect(mime).toBe('application/pdf');
    });

    it('detects application/pdf from data URL', () => {
      const mime = extractMimeType(samplePdfDataUrl);
      expect(mime).toBe('application/pdf');
    });

    it('detects image/png from data URL', () => {
      const mime = extractMimeType(samplePngDataUrl);
      expect(mime).toBe('image/png');
    });
  });

  describe('getImageMetadata for PDF', () => {
    it('returns PDF metadata without trying to load as image', async () => {
      const meta = await getImageMetadata(samplePdfDataUrl);
      expect(meta.format).toBe('PDF');
      expect(meta.mimeType).toBe('application/pdf');
      expect(meta.isPdf).toBe(true);
      expect(meta.sizeInBytes).toBeGreaterThan(0);
    });
  });

  describe('normalizeBase64 and formatFileSize', () => {
    it('adds data url prefix if missing', () => {
      const normalized = normalizeBase64(samplePdfBase64, 'application/pdf');
      expect(normalized).toBe(samplePdfDataUrl);
    });

    it('formats file sizes accurately', () => {
      expect(formatFileSize(500)).toBe('500 bytes');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });
});
