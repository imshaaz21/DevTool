import {
  normalizeRect,
  clamp,
  calculateArrowHead,
  isPointInRect,
  formatFileSize,
  pixelateImageData,
  drawAnnotation,
  copyCanvasToClipboard,
  downloadCanvas,
  extractCanvasRegion,
  performOcr,
  terminateOcrWorker,
  redactionBlockSize,
  PRESET_COLORS,
  STROKE_WIDTH_OPTIONS,
  FONT_SIZE_OPTIONS,
  AnnotationItem,
} from '../lib/image-annotator';

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockImplementation((_lang, _oem, options) =>
    Promise.resolve({
      recognize: jest.fn().mockImplementation(async () => {
        options?.logger?.({ status: 'recognizing text', progress: 0.5 });
        return { data: { text: 'Extracted OCR Test Text' } };
      }),
      terminate: jest.fn().mockResolvedValue(undefined),
    })
  ),
}));

describe('image-annotator library', () => {
  let originalGetContext: any;

  beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(400) }),
      putImageData: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      fillText: jest.fn(),
      setLineDash: jest.fn(),
    });
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe('constants', () => {
    it('defines preset colors and sizes', () => {
      expect(PRESET_COLORS.length).toBeGreaterThan(0);
      expect(STROKE_WIDTH_OPTIONS).toContain(4);
      expect(FONT_SIZE_OPTIONS).toContain(24);
    });
  });

  describe('normalizeRect', () => {
    it('handles standard top-left to bottom-right coordinates', () => {
      const rect = normalizeRect(10, 20, 100, 120);
      expect(rect).toEqual({ x: 10, y: 20, width: 90, height: 100 });
    });

    it('normalizes reversed coordinates when dragging upwards/leftwards', () => {
      const rect = normalizeRect(100, 120, 10, 20);
      expect(rect).toEqual({ x: 10, y: 20, width: 90, height: 100 });
    });

    it('handles zero dimensions', () => {
      const rect = normalizeRect(50, 50, 50, 50);
      expect(rect).toEqual({ x: 50, y: 50, width: 0, height: 0 });
    });
  });

  describe('clamp', () => {
    it('clamps values below min or above max', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });

  describe('calculateArrowHead', () => {
    it('calculates arrowhead wing coordinates correctly', () => {
      const { left, right } = calculateArrowHead(0, 0, 100, 0, 10);
      expect(left.x).toBeCloseTo(100 - 10 * Math.cos(-Math.PI / 6));
      expect(left.y).toBeCloseTo(-10 * Math.sin(-Math.PI / 6));
      expect(right.x).toBeCloseTo(100 - 10 * Math.cos(Math.PI / 6));
      expect(right.y).toBeCloseTo(-10 * Math.sin(Math.PI / 6));
    });
  });

  describe('isPointInRect', () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };

    it('returns true when point is inside rect', () => {
      expect(isPointInRect(20, 30, rect)).toBe(true);
      expect(isPointInRect(10, 20, rect)).toBe(true);
      expect(isPointInRect(110, 70, rect)).toBe(true);
    });

    it('returns false when point is outside rect', () => {
      expect(isPointInRect(5, 30, rect)).toBe(false);
      expect(isPointInRect(115, 30, rect)).toBe(false);
      expect(isPointInRect(50, 15, rect)).toBe(false);
      expect(isPointInRect(50, 75, rect)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-10)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  describe('pixelateImageData', () => {
    it('averages pixel colors in blocks', () => {
      // 4x4 image with 2 distinct colors
      const data = new Uint8ClampedArray(4 * 4 * 4);
      // Fill first 2x2 with red (255, 0, 0, 255)
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const idx = (y * 4 + x) * 4;
          data[idx] = 200;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
      // Put a single lighter pixel inside that block
      data[0] = 100;

      const imgData: ImageData = {
        width: 4,
        height: 4,
        data,
        colorSpace: 'srgb',
      };

      const result = pixelateImageData(imgData, 2);
      expect(result).toBeDefined();

      // Check that the top-left 2x2 block pixels are averaged
      const expectedAvgR = Math.round((100 + 200 * 3) / 4);
      expect(result.data[0]).toBe(expectedAvgR);
      expect(result.data[4]).toBe(expectedAvgR);
    });
  });

  describe('drawAnnotation', () => {
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        strokeRect: jest.fn(),
        fillRect: jest.fn(),
        ellipse: jest.fn(),
        fillText: jest.fn(),
        setLineDash: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          width: 50,
          height: 50,
          data: new Uint8ClampedArray(50 * 50 * 4),
        }),
        putImageData: jest.fn(),
        canvas: { width: 400, height: 300 },
      };
    });

    it('draws pen strokes', () => {
      const penItem: AnnotationItem = {
        id: '1',
        tool: 'pen',
        x: 10,
        y: 10,
        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }],
        color: '#EF4444',
        strokeWidth: 4,
      };

      drawAnnotation(mockCtx, penItem);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 10);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(20, 20);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(30, 30);
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('draws line', () => {
      const lineItem: AnnotationItem = {
        id: '2',
        tool: 'line',
        x: 5,
        y: 10,
        endX: 50,
        endY: 80,
        color: '#3B82F6',
        strokeWidth: 2,
      };

      drawAnnotation(mockCtx, lineItem);
      expect(mockCtx.moveTo).toHaveBeenCalledWith(5, 10);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(50, 80);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('draws arrow with arrowhead', () => {
      const arrowItem: AnnotationItem = {
        id: '3',
        tool: 'arrow',
        x: 0,
        y: 0,
        endX: 100,
        endY: 50,
        color: '#10B981',
        strokeWidth: 3,
      };

      drawAnnotation(mockCtx, arrowItem);
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalledTimes(2);
    });

    it('draws rectangle stroked and filled', () => {
      const rectItem: AnnotationItem = {
        id: '4',
        tool: 'rectangle',
        x: 10,
        y: 20,
        width: 100,
        height: 60,
        color: '#F59E0B',
        strokeWidth: 2,
        fill: false,
      };

      drawAnnotation(mockCtx, rectItem);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 60);

      drawAnnotation(mockCtx, { ...rectItem, fill: true });
      expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 60);
    });

    it('draws circle / ellipse', () => {
      const circleItem: AnnotationItem = {
        id: '5',
        tool: 'circle',
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        color: '#8B5CF6',
        strokeWidth: 2,
      };

      drawAnnotation(mockCtx, circleItem);
      expect(mockCtx.ellipse).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();

      drawAnnotation(mockCtx, { ...circleItem, fill: true });
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('draws text callout', () => {
      const textItem: AnnotationItem = {
        id: '6',
        tool: 'text',
        x: 50,
        y: 50,
        text: 'Fix button position',
        color: '#EF4444',
        strokeWidth: 2,
        fontSize: 24,
      };

      drawAnnotation(mockCtx, textItem);
      expect(mockCtx.fillText).toHaveBeenCalledWith('Fix button position', 50, 50);
    });

    it('pixelates region for redaction', () => {
      const pixelateItem: AnnotationItem = {
        id: '7',
        tool: 'pixelate',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        color: '#000000',
        strokeWidth: 4,
      };

      drawAnnotation(mockCtx, pixelateItem);
      expect(mockCtx.getImageData).toHaveBeenCalledWith(10, 10, 50, 50);
      expect(mockCtx.putImageData).toHaveBeenCalled();
    });

    it('falls back if getImageData fails due to tainted canvas', () => {
      mockCtx.getImageData.mockImplementationOnce(() => {
        throw new Error('Tainted canvas');
      });

      const pixelateItem: AnnotationItem = {
        id: '8',
        tool: 'pixelate',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        color: '#000000',
        strokeWidth: 4,
      };

      drawAnnotation(mockCtx, pixelateItem);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 10, 50, 50);
    });
  });

  describe('copyCanvasToClipboard', () => {
    it('returns false if clipboard api is unavailable', async () => {
      const origClipboard = navigator.clipboard;
      // @ts-expect-error clipboard is readonly in lib.dom types
      delete navigator.clipboard;

      const canvas = document.createElement('canvas');
      const res = await copyCanvasToClipboard(canvas);
      expect(res).toBe(false);

      // Restore
      Object.assign(navigator, { clipboard: origClipboard });
    });

    it('writes image item when clipboard API succeeds', async () => {
      const mockWrite = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { write: mockWrite },
      });

      // Mock ClipboardItem
      (global as any).ClipboardItem = jest.fn().mockImplementation((val) => val);

      const canvas = document.createElement('canvas');
      canvas.toBlob = (callback: any) => {
        callback(new Blob(['fake-image'], { type: 'image/png' }));
      };

      const res = await copyCanvasToClipboard(canvas);
      expect(res).toBe(true);
      expect(mockWrite).toHaveBeenCalled();
    });
  });

  describe('downloadCanvas', () => {
    it('creates anchor and triggers click', () => {
      const canvas = document.createElement('canvas');
      canvas.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,1234');

      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      downloadCanvas(canvas, 'my-test.png');
      expect(canvas.toDataURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });

  describe('extractCanvasRegion', () => {
    it('returns null for zero or negative dimensions', () => {
      const canvas = document.createElement('canvas');
      expect(extractCanvasRegion(canvas, { x: 0, y: 0, width: 0, height: 10 })).toBeNull();
      expect(extractCanvasRegion(canvas, { x: 0, y: 0, width: 10, height: -5 })).toBeNull();
    });

    it('creates target canvas with slice dimensions', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const target = extractCanvasRegion(canvas, { x: 10, y: 10, width: 120, height: 80 });
      expect(target).not.toBeNull();
      expect(target?.width).toBe(120);
      expect(target?.height).toBe(80);
    });
  });

  describe('redactionBlockSize', () => {
    it('keeps the 8px floor and honours stroke width', () => {
      expect(redactionBlockSize(2, 400, 300)).toBe(8);
      expect(redactionBlockSize(10, 400, 300)).toBe(20);
    });

    it('scales with large images', () => {
      expect(redactionBlockSize(2, 3840, 2160)).toBe(22);
    });
  });

  describe('performOcr', () => {
    afterEach(async () => {
      await terminateOcrWorker();
      jest.clearAllMocks();
    });

    it('fails with a clear message without WebAssembly', async () => {
      const orig = globalThis.WebAssembly;
      // @ts-expect-error simulating an old browser
      delete globalThis.WebAssembly;
      try {
        await expect(performOcr(document.createElement('canvas'))).rejects.toThrow(/WebAssembly/);
      } finally {
        globalThis.WebAssembly = orig;
      }
    });

    it('reuses one worker across calls', async () => {
      const { createWorker } = jest.requireMock('tesseract.js');
      const canvas = document.createElement('canvas');
      await performOcr(canvas);
      await performOcr(canvas);
      expect(createWorker).toHaveBeenCalledTimes(1);
    });

    it('drops the worker when recognition fails', async () => {
      const { createWorker } = jest.requireMock('tesseract.js');
      const terminate = jest.fn().mockResolvedValue(undefined);
      createWorker.mockResolvedValueOnce({
        recognize: jest.fn().mockRejectedValue(new Error('boom')),
        terminate,
      });
      await expect(performOcr(document.createElement('canvas'))).rejects.toThrow('boom');
      expect(terminate).toHaveBeenCalled();
      // next call builds a fresh worker
      await expect(performOcr(document.createElement('canvas'))).resolves.toBe('Extracted OCR Test Text');
    });

    it('extracts recognized text using tesseract worker', async () => {
      const canvas = document.createElement('canvas');
      const progressSpy = jest.fn();
      const text = await performOcr(canvas, progressSpy);
      expect(typeof text).toBe('string');
      expect(text).toBe('Extracted OCR Test Text');
      expect(progressSpy).toHaveBeenCalledWith(50, 'recognizing text');
    });
  });
});
