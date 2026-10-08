export type ToolMode =
  | 'select'
  | 'pen'
  | 'arrow'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'pixelate'
  | 'crop'
  | 'ocr';

export interface Point {
  x: number;
  y: number;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationItem {
  id: string;
  tool: ToolMode;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  points?: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  fill?: boolean;
}

export const PRESET_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Dark Slate', hex: '#0F172A' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

export const STROKE_WIDTH_OPTIONS = [2, 4, 6, 8, 12];
export const FONT_SIZE_OPTIONS = [14, 18, 24, 32, 48];

/**
 * Normalizes coordinates so that width and height are positive
 * even if the user dragged leftwards or upwards.
 */
export function normalizeRect(x1: number, y1: number, x2: number, y2: number): RectBounds {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x, y, width, height };
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(val: number, min: number, max: number): number {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

/**
 * Calculates the two wing points of an arrow head pointing from (fromX, fromY) to (toX, toY).
 */
export function calculateArrowHead(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  headLength = 16,
  angleRad = Math.PI / 6
): { left: Point; right: Point } {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const left: Point = {
    x: toX - headLength * Math.cos(angle - angleRad),
    y: toY - headLength * Math.sin(angle - angleRad),
  };
  const right: Point = {
    x: toX - headLength * Math.cos(angle + angleRad),
    y: toY - headLength * Math.sin(angle + angleRad),
  };
  return { left, right };
}

/**
 * Tests if a point is within rectangular bounds.
 */
export function isPointInRect(px: number, py: number, rect: RectBounds): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

/**
 * Formats byte size into human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Pixelation block size for redaction: scales with the image so text on large
 * screenshots stays unreadable, never below 8px.
 */
export function redactionBlockSize(strokeWidth: number, canvasWidth: number, canvasHeight: number): number {
  return Math.max(8, strokeWidth * 2, Math.round(Math.min(canvasWidth, canvasHeight) / 100));
}

/**
 * Pure pixelation algorithm operating directly on an ImageData buffer.
 * Averages RGBA channels across each block and overwrites the pixel area.
 */
export function pixelateImageData(imageData: ImageData, blockSize = 10): ImageData {
  const { width, height, data } = imageData;
  const size = Math.max(2, Math.floor(blockSize));

  for (let blockY = 0; blockY < height; blockY += size) {
    for (let blockX = 0; blockX < width; blockX += size) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      const currentBlockWidth = Math.min(size, width - blockX);
      const currentBlockHeight = Math.min(size, height - blockY);

      // Accumulate color values in the block
      for (let py = 0; py < currentBlockHeight; py++) {
        for (let px = 0; px < currentBlockWidth; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          aSum += data[idx + 3];
          count++;
        }
      }

      if (count === 0) continue;

      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      const avgA = Math.round(aSum / count);

      // Write average color back to the block
      for (let py = 0; py < currentBlockHeight; py++) {
        for (let px = 0; px < currentBlockWidth; px++) {
          const idx = ((blockY + py) * width + (blockX + px)) * 4;
          data[idx] = avgR;
          data[idx + 1] = avgG;
          data[idx + 2] = avgB;
          data[idx + 3] = avgA;
        }
      }
    }
  }

  return imageData;
}

/**
 * Draws a single annotation item onto the 2D canvas context.
 */
export function drawAnnotation(ctx: CanvasRenderingContext2D, item: AnnotationItem): void {
  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineWidth = item.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (item.tool) {
    case 'pen': {
      if (!item.points || item.points.length === 0) break;
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case 'line': {
      const endX = item.endX ?? item.x;
      const endY = item.endY ?? item.y;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      break;
    }

    case 'arrow': {
      const endX = item.endX ?? item.x;
      const endY = item.endY ?? item.y;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrowhead
      const head = calculateArrowHead(item.x, item.y, endX, endY, Math.max(14, item.strokeWidth * 3));
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(head.left.x, head.left.y);
      ctx.moveTo(endX, endY);
      ctx.lineTo(head.right.x, head.right.y);
      ctx.stroke();
      break;
    }

    case 'rectangle': {
      const w = item.width ?? 0;
      const h = item.height ?? 0;
      if (item.fill) {
        ctx.fillRect(item.x, item.y, w, h);
      } else {
        ctx.strokeRect(item.x, item.y, w, h);
      }
      break;
    }

    case 'circle': {
      const w = Math.abs(item.width ?? 0);
      const h = Math.abs(item.height ?? 0);
      const radiusX = w / 2;
      const radiusY = h / 2;
      const centerX = item.x + radiusX;
      const centerY = item.y + radiusY;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, 2 * Math.PI);
      if (item.fill) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }

    case 'text': {
      if (!item.text) break;
      const size = item.fontSize ?? 20;
      ctx.font = `600 ${size}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
      ctx.textBaseline = 'top';

      // Subtle drop shadow / text outline for readability against light and dark backgrounds
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(item.text, item.x, item.y);
      break;
    }

    case 'pixelate': {
      const w = Math.round(item.width ?? 0);
      const h = Math.round(item.height ?? 0);
      if (w <= 0 || h <= 0) break;

      const safeX = Math.max(0, Math.round(item.x));
      const safeY = Math.max(0, Math.round(item.y));
      const safeW = Math.min(w, ctx.canvas.width - safeX);
      const safeH = Math.min(h, ctx.canvas.height - safeY);

      if (safeW > 0 && safeH > 0) {
        try {
          const region = ctx.getImageData(safeX, safeY, safeW, safeH);
          pixelateImageData(region, redactionBlockSize(item.strokeWidth, ctx.canvas.width, ctx.canvas.height));
          ctx.putImageData(region, safeX, safeY);

          // Add a dashed border indicating redacted zone
          ctx.save();
          ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(safeX, safeY, safeW, safeH);
          ctx.restore();
        } catch {
          // If canvas security origin prevents reading data, draw fallback solid box
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(safeX, safeY, safeW, safeH);
        }
      }
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Copies canvas image to system clipboard.
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard?.write) {
    return false;
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}

/**
 * Triggers a download of the canvas content.
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename = 'annotated-screenshot.png',
  format: 'image/png' | 'image/jpeg' = 'image/png'
): void {
  const url = canvas.toDataURL(format, 0.95);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Extracts a rectangular sub-region from a canvas and returns a new canvas.
 */
export function extractCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  region: RectBounds
): HTMLCanvasElement | null {
  if (region.width <= 0 || region.height <= 0) return null;
  const target = document.createElement('canvas');
  target.width = Math.round(region.width);
  target.height = Math.round(region.height);
  const ctx = target.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(
    sourceCanvas,
    Math.round(region.x),
    Math.round(region.y),
    Math.round(region.width),
    Math.round(region.height),
    0,
    0,
    Math.round(region.width),
    Math.round(region.height)
  );

  return target;
}

type OcrWorker = Awaited<ReturnType<typeof import('tesseract.js').createWorker>>;

// One worker is reused so the engine and language data load only once
let ocrWorkerPromise: Promise<OcrWorker> | null = null;
let ocrProgress: ((pct: number, status: string) => void) | undefined;

function getOcrWorker(): Promise<OcrWorker> {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = import('tesseract.js')
      .then(({ createWorker }) =>
        createWorker('eng', 1, {
          logger: (m) => {
            if (ocrProgress && m.status) {
              ocrProgress(Math.round((m.progress || 0) * 100), m.status);
            }
          },
        })
      )
      .catch((err) => {
        ocrWorkerPromise = null;
        throw err;
      });
  }
  return ocrWorkerPromise;
}

/** Frees the shared OCR worker. The next performOcr call creates a new one. */
export async function terminateOcrWorker(): Promise<void> {
  const pending = ocrWorkerPromise;
  ocrWorkerPromise = null;
  if (pending) await (await pending).terminate();
}

/**
 * Performs client-side OCR using a shared Tesseract WebAssembly worker.
 */
export async function performOcr(
  imageSource: string | HTMLCanvasElement,
  onProgress?: (pct: number, status: string) => void
): Promise<string> {
  if (typeof WebAssembly === 'undefined') {
    throw new Error('Text extraction needs WebAssembly, which this browser does not support. Please update your browser.');
  }
  const worker = await getOcrWorker();
  ocrProgress = onProgress;
  try {
    const res = await worker.recognize(imageSource);
    return (res.data.text || '').trim();
  } catch (err) {
    // A failed worker may be left in a bad state, so drop it
    await terminateOcrWorker().catch(() => {});
    throw err;
  } finally {
    ocrProgress = undefined;
  }
}
