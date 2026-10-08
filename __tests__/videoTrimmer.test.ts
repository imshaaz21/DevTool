import {
  formatTimestamp,
  parseTimestamp,
  clampTime,
  validateVideoFile,
  validateTrimRange,
  calculateCropDimensions,
  estimateTrimmedSize,
  downloadBlob,
  trimAndCropVideo,
  getVideoDuration,
  getExportSupportError,
  MAX_FILE_SIZE_BYTES,
  MAX_DURATION_SECONDS,
  ASPECT_RATIO_PRESETS,
} from '../lib/video-trimmer';

const mockCancel = jest.fn();
const mockExecute = jest.fn();
const mockInit = jest.fn();
const mockFirstCodec = jest.fn();
const mockComputeDuration = jest.fn();
class MockCanceledError extends Error {}
jest.mock('mediabunny', () => ({
  Input: jest.fn().mockImplementation(() => ({ dispose: jest.fn(), computeDuration: mockComputeDuration })),
  Output: jest.fn(),
  UrlSource: jest.fn(),
  Mp4OutputFormat: jest.fn().mockImplementation(() => ({ getSupportedVideoCodecs: () => ['avc'] })),
  getFirstEncodableVideoCodec: (...args: unknown[]) => mockFirstCodec(...args),
  BufferTarget: jest.fn().mockImplementation(() => ({ buffer: new ArrayBuffer(8) })),
  ALL_FORMATS: [],
  ConversionCanceledError: MockCanceledError,
  Conversion: { init: (...args: unknown[]) => mockInit(...args) },
}));

describe('video-trimmer library', () => {
  describe('constants', () => {
    it('defines limits and aspect ratio presets', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(104857600);
      expect(MAX_DURATION_SECONDS).toBe(300);
      expect(ASPECT_RATIO_PRESETS.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('formatTimestamp', () => {
    it('formats seconds to mm:ss.s format', () => {
      expect(formatTimestamp(0)).toBe('00:00.0');
      expect(formatTimestamp(5.5)).toBe('00:05.5');
      expect(formatTimestamp(65.2)).toBe('01:05.2');
      expect(formatTimestamp(125)).toBe('02:05.0');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatTimestamp(-1)).toBe('00:00.0');
      expect(formatTimestamp(NaN)).toBe('00:00.0');
    });
  });

  describe('parseTimestamp', () => {
    it('parses mm:ss.s format into total seconds', () => {
      expect(parseTimestamp('01:05.2')).toBeCloseTo(65.2);
      expect(parseTimestamp('00:10')).toBe(10);
      expect(parseTimestamp('02:00.0')).toBe(120);
    });

    it('parses raw seconds strings', () => {
      expect(parseTimestamp('45.5')).toBe(45.5);
      expect(parseTimestamp('0')).toBe(0);
      expect(parseTimestamp('')).toBe(0);
      expect(parseTimestamp('abc')).toBe(0);
    });
  });

  describe('clampTime', () => {
    it('clamps time within min and max', () => {
      expect(clampTime(-5, 0, 100)).toBe(0);
      expect(clampTime(150, 0, 100)).toBe(100);
      expect(clampTime(40, 0, 100)).toBe(40);
    });
  });

  describe('validateVideoFile', () => {
    it('accepts valid video files under limit', () => {
      const res = validateVideoFile({ size: 10 * 1024 * 1024, type: 'video/mp4' });
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects files larger than 100 MB', () => {
      const res = validateVideoFile({ size: 101 * 1024 * 1024, type: 'video/mp4' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('100 MB limit');
    });

    it('falls back to the file extension when MIME type is empty', () => {
      expect(validateVideoFile({ size: 1024, type: '', name: 'clip.mov' }).valid).toBe(true);
    });

    it('rejects empty MIME type without a video extension', () => {
      expect(validateVideoFile({ size: 1024, type: '', name: 'notes.txt' }).valid).toBe(false);
      expect(validateVideoFile({ size: 1024, type: '' }).valid).toBe(false);
    });

    it('rejects non-video file types', () => {
      const res = validateVideoFile({ size: 1024, type: 'application/pdf' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('valid video file');
    });
  });

  describe('validateTrimRange', () => {
    it('accepts valid start and end within duration', () => {
      expect(validateTrimRange(5, 15, 60).valid).toBe(true);
    });

    it('rejects negative start or end', () => {
      expect(validateTrimRange(-1, 10, 60).valid).toBe(false);
    });

    it('rejects start time greater or equal to end', () => {
      expect(validateTrimRange(15, 10, 60).valid).toBe(false);
      expect(validateTrimRange(10, 10, 60).valid).toBe(false);
    });

    it('rejects ranges that are too short (< 0.2s)', () => {
      expect(validateTrimRange(10, 10.1, 60).valid).toBe(false);
    });

    it('rejects end time exceeding duration', () => {
      expect(validateTrimRange(10, 70, 60).valid).toBe(false);
    });

    it('accepts start and end anywhere in a long video if clip length is under 5 mins', () => {
      expect(validateTrimRange(300, 450, 600).valid).toBe(true);
    });

    it('rejects clip duration exceeding max clip length', () => {
      const res = validateTrimRange(50, 400, 600);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('5-minute max limit');
    });
  });

  describe('calculateCropDimensions', () => {
    it('returns full dimensions for original preset', () => {
      const res = calculateCropDimensions(1920, 1080, 'original');
      expect(res).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    });

    it('crops width for 1:1 square ratio from landscape', () => {
      const res = calculateCropDimensions(1920, 1080, '1:1');
      expect(res.height).toBe(1080);
      expect(res.width).toBe(1080);
      expect(res.x).toBe((1920 - 1080) / 2);
      expect(res.y).toBe(0);
    });

    it('crops height for 16:9 ratio from portrait video', () => {
      const res = calculateCropDimensions(1080, 1920, '16:9');
      expect(res.width).toBe(1080);
      expect(res.height).toBe(Math.round(1080 / (16 / 9)));
      expect(res.x).toBe(0);
      expect(res.y).toBe(Math.round((1920 - res.height) / 2));
    });

    it('handles zero or missing dimensions', () => {
      const res = calculateCropDimensions(0, 0, '1:1');
      expect(res).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('estimateTrimmedSize', () => {
    it('estimates proportional size', () => {
      const est = estimateTrimmedSize(1000000, 100, 50);
      expect(est).toBe(500000);
    });

    it('returns zero for invalid inputs', () => {
      expect(estimateTrimmedSize(0, 100, 50)).toBe(0);
      expect(estimateTrimmedSize(1000, 0, 50)).toBe(0);
    });
  });

  describe('downloadBlob', () => {
    it('creates object URL and triggers anchor click', () => {
      const blob = new Blob(['sample-video-bytes'], { type: 'video/webm' });
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:sample');
      global.URL.revokeObjectURL = jest.fn();
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      downloadBlob(blob, 'trimmed.webm');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:sample');

      clickSpy.mockRestore();
    });
  });
  describe('getExportSupportError', () => {
    it('reports missing WebCodecs and clears when present', () => {
      const g = globalThis as any;
      expect(getExportSupportError()).toMatch(/WebCodecs/);
      g.VideoDecoder = class {};
      g.VideoEncoder = class {};
      expect(getExportSupportError()).toBeNull();
      delete g.VideoDecoder;
      delete g.VideoEncoder;
    });
  });

  describe('getVideoDuration', () => {
    it('reads duration from the container', async () => {
      mockComputeDuration.mockResolvedValue(42.5);
      await expect(getVideoDuration('blob:x')).resolves.toBe(42.5);
    });
  });

  describe('estimateTrimmedSize with crop', () => {
    it('scales by the cropped area ratio', () => {
      expect(estimateTrimmedSize(1000, 10, 5, 0.5)).toBe(250);
      expect(estimateTrimmedSize(1000, 10, 5, 2)).toBe(500);
    });
  });

  describe('trimAndCropVideo', () => {
    const base = { src: 'blob:x', start: 1, end: 5 };
    const conv = (isValid = true) => ({ isValid, execute: mockExecute, cancel: mockCancel });

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecute.mockResolvedValue(undefined);
      mockFirstCodec.mockResolvedValue('avc');
    });

    it('trims without a crop and returns an mp4 blob', async () => {
      const c = conv();
      mockInit.mockResolvedValue(c);
      const blob = await trimAndCropVideo(base);
      expect(blob?.type).toBe('video/mp4');
      const opts = mockInit.mock.calls[0][0];
      expect(opts.trim).toEqual({ start: 1, end: 5 });
      expect(opts.video).toEqual({});
    });

    it('passes an even-sized crop rectangle', async () => {
      mockInit.mockResolvedValue(conv());
      await trimAndCropVideo({ ...base, crop: { x: 10, y: 2, width: 607, height: 1081 } });
      expect(mockInit.mock.calls[0][0].video.crop).toEqual({ left: 10, top: 2, width: 606, height: 1080 });
    });

    it('fails early when a crop is requested but no encoder exists', async () => {
      mockFirstCodec.mockResolvedValue(null);
      await expect(
        trimAndCropVideo({ ...base, crop: { x: 0, y: 0, width: 100, height: 100 } })
      ).rejects.toThrow('no video encoder');
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('skips the encoder check for a plain trim', async () => {
      mockFirstCodec.mockResolvedValue(null);
      mockInit.mockResolvedValue(conv());
      await expect(trimAndCropVideo(base)).resolves.toBeInstanceOf(Blob);
    });

    it('reports progress', async () => {
      const c = conv() as ReturnType<typeof conv> & { onProgress?: (p: number) => void };
      mockInit.mockResolvedValue(c);
      mockExecute.mockImplementation(async () => c.onProgress?.(0.5));
      const onProgress = jest.fn();
      await trimAndCropVideo({ ...base, onProgress });
      expect(onProgress).toHaveBeenCalledWith(0.5);
    });

    it('throws when the conversion is invalid', async () => {
      mockInit.mockResolvedValue(conv(false));
      await expect(trimAndCropVideo(base)).rejects.toThrow('cannot be exported');
    });

    it('returns null when cancelled and cancels on abort', async () => {
      mockInit.mockResolvedValue(conv());
      const controller = new AbortController();
      mockExecute.mockImplementation(async () => {
        controller.abort();
        throw new MockCanceledError();
      });
      expect(await trimAndCropVideo({ ...base, signal: controller.signal })).toBeNull();
      expect(mockCancel).toHaveBeenCalled();
    });
  });
});
