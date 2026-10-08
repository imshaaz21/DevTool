export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_DURATION_SECONDS = 300; // 5 minutes

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AspectRatioOption {
  label: string;
  value: string;
  ratio: number | null; // width / height, or null for freeform/original
}

export const ASPECT_RATIO_PRESETS: AspectRatioOption[] = [
  { label: 'Original', value: 'original', ratio: null },
  { label: '16:9 Landscape', value: '16:9', ratio: 16 / 9 },
  { label: '9:16 Mobile / Reel', value: '9:16', ratio: 9 / 16 },
  { label: '1:1 Square', value: '1:1', ratio: 1 },
  { label: '4:3 Standard', value: '4:3', ratio: 4 / 3 },
];

/**
 * Formats time in seconds to mm:ss.s format (e.g. 01:23.4).
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

/**
 * Parses a timestamp string (e.g. "01:23.4" or "83.4") into total seconds.
 */
export function parseTimestamp(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return Math.max(0, mins * 60 + secs);
  }

  const val = parseFloat(trimmed);
  return isNaN(val) ? 0 : Math.max(0, val);
}

/**
 * Clamps a timestamp within allowable bounds.
 */
export function clampTime(time: number, min: number, max: number): number {
  if (time < min) return min;
  if (time > max) return max;
  return time;
}

/**
 * Validates file size and MIME type for video upload.
 */
export function validateVideoFile(file: { size: number; type: string; name?: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 100 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Browser memory is capped for stability.`,
    };
  }

  // Allow standard web video containers (mp4, webm, mov, ogg)
  // Some browsers report an empty MIME type for .mov/.mkv, so fall back to the extension
  const isVideo =
    file.type.startsWith('video/') ||
    (file.type === '' && /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name ?? ''));

  if (!isVideo) {
    return {
      valid: false,
      error: 'Please select a valid video file (MP4, WebM, MOV, or OGG).',
    };
  }

  return { valid: true };
}

/**
 * Validates trim start and end times against video duration and max clip duration.
 */
export function validateTrimRange(
  start: number,
  end: number,
  duration: number,
  maxClipDuration = MAX_DURATION_SECONDS
): { valid: boolean; error?: string } {
  if (start < 0 || end < 0) {
    return { valid: false, error: 'Start and end times must be positive numbers.' };
  }

  if (start >= end) {
    return { valid: false, error: 'Start time must be strictly before end time.' };
  }

  if (end - start < 0.2) {
    return { valid: false, error: 'Trim range must be at least 0.2 seconds.' };
  }

  if (maxClipDuration > 0 && end - start > maxClipDuration) {
    const maxMins = (maxClipDuration / 60).toFixed(0);
    const selectedMins = ((end - start) / 60).toFixed(1);
    return {
      valid: false,
      error: `Selected clip length (${selectedMins} mins) exceeds the ${maxMins}-minute max limit. Please adjust start or end points.`,
    };
  }

  if (duration > 0 && end > duration + 0.5) {
    return { valid: false, error: 'End time cannot exceed total video duration.' };
  }

  return { valid: true };
}

/**
 * Calculates centered crop coordinates for a given aspect ratio.
 */
export function calculateCropDimensions(
  videoWidth: number,
  videoHeight: number,
  aspectRatioValue: string
): CropArea {
  if (!videoWidth || !videoHeight) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const preset = ASPECT_RATIO_PRESETS.find((p) => p.value === aspectRatioValue);
  if (!preset || preset.ratio === null) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  const targetRatio = preset.ratio;
  const currentRatio = videoWidth / videoHeight;

  let cropWidth = videoWidth;
  let cropHeight = videoHeight;

  if (currentRatio > targetRatio) {
    // Current video is wider than target ratio: crop width
    cropWidth = Math.round(videoHeight * targetRatio);
  } else {
    // Current video is taller than target ratio: crop height
    cropHeight = Math.round(videoWidth / targetRatio);
  }

  const x = Math.max(0, Math.round((videoWidth - cropWidth) / 2));
  const y = Math.max(0, Math.round((videoHeight - cropHeight) / 2));

  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * Estimates output file size based on original size and trim proportion.
 */
export function estimateTrimmedSize(
  originalBytes: number,
  originalDuration: number,
  trimDuration: number,
  areaRatio = 1 // cropped pixels / source pixels; a crop re-encodes, so size follows the area
): number {
  if (originalDuration <= 0 || trimDuration <= 0 || originalBytes <= 0) return 0;
  const ratio = Math.min(1, trimDuration / originalDuration);
  return Math.round(originalBytes * ratio * Math.min(1, Math.max(0, areaRatio)));
}

/**
 * Triggers a file download in the browser for a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface TrimExportOptions {
  src: string; // object URL or same-origin URL of the source video
  start: number;
  end: number;
  crop?: CropArea; // omit for the original frame; a crop forces re-encoding
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

/**
 * Trims (and optionally crops) a video to MP4 using WebCodecs via mediabunny.
 * Runs faster than real time. Without a crop the encoded packets are copied
 * (no re-encode), so the cut may snap to the nearest earlier keyframe.
 * Resolves to null if cancelled through `signal`.
 */
export async function trimAndCropVideo(opts: TrimExportOptions): Promise<Blob | null> {
  const {
    Input,
    Output,
    Conversion,
    ConversionCanceledError,
    UrlSource,
    ALL_FORMATS,
    Mp4OutputFormat,
    BufferTarget,
    getFirstEncodableVideoCodec,
  } = await import('mediabunny');

  // A crop re-encodes, so fail early with a clear message if no MP4 codec can be encoded
  if (opts.crop && !(await getFirstEncodableVideoCodec(new Mp4OutputFormat().getSupportedVideoCodecs()))) {
    throw new Error('This browser has no video encoder available for cropping (H.264, VP9 or AV1). Try Chrome or Edge, or export without cropping.');
  }

  const input = new Input({ source: new UrlSource(opts.src), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat(), target });

  try {
    const conversion = await Conversion.init({
      input,
      output,
      trim: { start: opts.start, end: opts.end },
      // Encoders need even dimensions
      video: opts.crop
        ? {
            crop: {
              left: opts.crop.x,
              top: opts.crop.y,
              width: opts.crop.width - (opts.crop.width % 2),
              height: opts.crop.height - (opts.crop.height % 2),
            },
          }
        : {},
    });
    if (!conversion.isValid) {
      throw new Error('This video format cannot be exported in this browser.');
    }
    conversion.onProgress = (p) => opts.onProgress?.(p);
    opts.signal?.addEventListener('abort', () => void conversion.cancel(), { once: true });
    await conversion.execute();
  } catch (err) {
    if (err instanceof ConversionCanceledError) return null;
    throw err;
  } finally {
    input.dispose();
  }

  return target.buffer ? new Blob([target.buffer], { type: 'video/mp4' }) : null;
}

/**
 * Reads the real duration with mediabunny. Needed for files whose container has
 * no duration header (e.g. Chrome screen recordings), where <video> reports Infinity.
 */
export async function getVideoDuration(src: string): Promise<number> {
  const { Input, UrlSource, ALL_FORMATS } = await import('mediabunny');
  const input = new Input({ source: new UrlSource(src), formats: ALL_FORMATS });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
}

/**
 * Returns a user-facing reason when this browser cannot export (no WebCodecs), else null.
 * Chrome/Edge 94+, Safari 16.4+ and Firefox 130+ have it.
 */
export function getExportSupportError(): string | null {
  if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') {
    return 'This browser does not support WebCodecs, so exporting is unavailable. Use a recent Chrome, Edge, Safari (16.4+) or Firefox (130+).';
  }
  return null;
}
