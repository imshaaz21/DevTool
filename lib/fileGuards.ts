/**
 * Upload guards.
 *
 * Every tool in this suite runs in the browser, so an oversized or unexpected
 * file is paid for out of the visitor's own RAM: a decoded bitmap costs
 * width * height * 4 bytes for every canvas it is drawn into, and a file read
 * as text or base64 lands in React state and again in the DOM. These limits
 * stop a careless or hostile file from locking the tab, and they are deliberately
 * generous for real work while staying well inside what a modest laptop can hold.
 */

export const MB = 1024 * 1024;

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export interface UploadRule {
  /** Used in messages, for example "image" or "PDF". */
  label: string;
  /** Accepted MIME types or prefixes, for example "image/" or "application/pdf". */
  mimePrefixes: string[];
  /** Accepted extensions, used when the browser reports no MIME type at all. */
  extensions: RegExp;
  maxBytes: number;
}

export interface GuardResult {
  ok: boolean;
  error?: string;
}

/**
 * 25 megapixels is about 100 MB per RGBA canvas, and the annotator holds more
 * than one. Larger photographs are rejected rather than silently downscaled,
 * because a redaction tool should never change the pixels behind your back.
 */
export const MAX_IMAGE_PIXELS = 25_000_000;

export const IMAGE_UPLOAD_RULE: UploadRule = {
  label: 'image',
  mimePrefixes: ['image/'],
  extensions: /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/i,
  maxBytes: 25 * MB,
};

/** Base64 output is about 4/3 of the input and is rendered as text, so the cap is tighter. */
export const ENCODABLE_UPLOAD_RULE: UploadRule = {
  label: 'image or PDF',
  mimePrefixes: ['image/', 'application/pdf'],
  extensions: /\.(png|jpe?g|gif|webp|bmp|avif|svg|pdf)$/i,
  maxBytes: 10 * MB,
};

/** Markup is held in a textarea and re-rendered into a live iframe on every keystroke. */
export const MARKUP_UPLOAD_RULE: UploadRule = {
  label: 'HTML, Markdown or text',
  mimePrefixes: ['text/'],
  extensions: /\.(html?|md|markdown|txt)$/i,
  maxBytes: 2 * MB,
};

/** A certificate is a few kilobytes; anything larger is not one. */
export const CERTIFICATE_UPLOAD_RULE: UploadRule = {
  label: 'certificate',
  mimePrefixes: ['application/x-x509', 'application/pkix-cert', 'application/x-pem-file', 'text/'],
  extensions: /\.(pem|crt|cer|cert|der)$/i,
  maxBytes: MB,
};

/** A .env file is a handful of lines, and it is parsed on every keystroke. */
export const ENV_UPLOAD_RULE: UploadRule = {
  label: 'env or text',
  mimePrefixes: ['text/'],
  extensions: /(\.env(\.[\w-]+)?|\.(txt|properties|conf|ini))$/i,
  maxBytes: MB / 2,
};

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Keeps a pathological filename from taking over a toast. */
export function truncateFileName(name: string, max = 42): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function checkUpload(file: FileLike, rule: UploadRule): GuardResult {
  if (file.size === 0) {
    return { ok: false, error: `${truncateFileName(file.name)} is empty.` };
  }

  const type = file.type.toLowerCase();
  const matchesMime = type !== '' && rule.mimePrefixes.some((prefix) => type.startsWith(prefix));
  // Either signal is enough. Browsers report an empty type or application/octet-stream
  // for .md, .mov and others, so a strict MIME check rejects legitimate files. This
  // guard exists to bound memory, not to authenticate content: a file that lies about
  // what it is still fails at decode, which is the real arbiter.
  const matchesExtension = rule.extensions.test(file.name);

  if (!matchesMime && !matchesExtension) {
    return {
      ok: false,
      error: `${truncateFileName(file.name)} is not a supported ${rule.label} file.`,
    };
  }

  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      error: `${truncateFileName(file.name)} is ${formatFileSize(file.size)}. The limit is ${formatFileSize(rule.maxBytes)}, so the page stays responsive.`,
    };
  }

  return { ok: true };
}

/**
 * Checked after decode, because a small compressed file can still expand into a
 * very large bitmap. A 3 MB JPEG can decode to well over 100 MB of canvas.
 */
export function checkImagePixels(
  width: number,
  height: number,
  maxPixels = MAX_IMAGE_PIXELS
): GuardResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { ok: false, error: 'That image reported no usable dimensions.' };
  }

  const pixels = width * height;
  if (pixels > maxPixels) {
    const mp = (pixels / 1_000_000).toFixed(1);
    const limit = (maxPixels / 1_000_000).toFixed(0);
    return {
      ok: false,
      error: `That image is ${width}x${height} (${mp} MP). The limit is ${limit} MP, because the browser holds every pixel in memory.`,
    };
  }

  return { ok: true };
}
