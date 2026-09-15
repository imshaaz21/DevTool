import * as pako from 'pako';

// Safely resolve functions across various CJS/ESM bundlers
const pakoAny = pako as any;
const gzip = pako.gzip || pakoAny.default?.gzip;
const ungzip = pako.ungzip || pakoAny.default?.ungzip;
const inflate = pako.inflate || pakoAny.default?.inflate;

export interface DecompressResult {
  success: boolean;
  decompressedText: string;
  formattedJson?: string;
  isJson: boolean;
  parsedJson?: any;
  inputSize: number;
  outputSize: number;
  compressionRatio?: string;
  error?: string;
}

export interface CompressResult {
  success: boolean;
  base64Gzip: string;
  inputSize: number;
  outputSize: number;
  compressionRatio?: string;
  error?: string;
}

/**
 * Normalizes a base64 string:
 * - Trims whitespace
 * - Strips leading/trailing quotes
 * - Handles URL-safe base64 (- and _ to + and /)
 * - Adds padding '=' if needed
 */
export function normalizeBase64(input: string): string {
  let cleaned = input.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Convert URL-safe base64 characters
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' if necessary
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  return cleaned;
}

/**
 * Converts a Uint8Array into a standard Base64 string safely.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string into a Uint8Array safely.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = normalizeBase64(base64);
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(normalized, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Safely decodes UTF-8 bytes to string across browser and Node/Jest environments.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf-8');
  }
  return decodeURIComponent(escape(String.fromCharCode(...Array.from(bytes))));
}

/**
 * Safely encodes a string into UTF-8 bytes across browser and Node/Jest environments.
 */
export function encodeUtf8(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(text, 'utf-8');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = unescape(encodeURIComponent(text));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decompresses a Base64-encoded Gzip (or Deflate/Zlib) string into text,
 * automatically detecting and formatting JSON payloads.
 */
export function decompressScreenPermission(base64Gzip: string): DecompressResult {
  if (!base64Gzip || !base64Gzip.trim()) {
    return {
      success: false,
      decompressedText: '',
      isJson: false,
      inputSize: 0,
      outputSize: 0,
      error: 'Please enter a Base64-encoded Gzip string.'
    };
  }

  try {
    const inputBytes = base64ToUint8Array(base64Gzip);
    const inputSize = inputBytes.length;

    let decompressedBytes: Uint8Array;
    try {
      if (!ungzip) throw new Error('ungzip function unavailable');
      decompressedBytes = ungzip(inputBytes);
    } catch (gzipErr) {
      // Fallback: try raw inflate in case payload is zlib/deflate
      try {
        if (!inflate) throw new Error('inflate function unavailable');
        decompressedBytes = inflate(inputBytes);
      } catch {
        throw new Error('Decompression failed. The provided Base64 string is not valid Gzip or Deflate data.');
      }
    }

    const text = decodeUtf8(decompressedBytes);
    const outputSize = decompressedBytes.length;

    let isJson = false;
    let formattedJson: string | undefined;
    let parsedJson: any;

    try {
      parsedJson = JSON.parse(text);
      formattedJson = JSON.stringify(parsedJson, null, 2);
      isJson = true;
    } catch {
      isJson = false;
    }

    const ratio = outputSize > 0 
      ? (((outputSize - inputSize) / outputSize) * 100).toFixed(1) + '% compression savings' 
      : '0%';

    return {
      success: true,
      decompressedText: text,
      formattedJson,
      isJson,
      parsedJson,
      inputSize,
      outputSize,
      compressionRatio: ratio
    };
  } catch (err) {
    return {
      success: false,
      decompressedText: '',
      isJson: false,
      inputSize: 0,
      outputSize: 0,
      error: (err as Error).message || 'Failed to decompress data.'
    };
  }
}

/**
 * Compresses a plain text or JSON string into a Base64-encoded Gzip string.
 */
export function compressScreenPermission(plainText: string): CompressResult {
  if (!plainText || !plainText.trim()) {
    return {
      success: false,
      base64Gzip: '',
      inputSize: 0,
      outputSize: 0,
      error: 'Please enter text or JSON to compress.'
    };
  }

  try {
    const inputBytes = encodeUtf8(plainText);
    const inputSize = inputBytes.length;

    if (!gzip) throw new Error('gzip function unavailable');
    const compressedBytes = gzip(inputBytes);
    const outputSize = compressedBytes.length;

    const base64Gzip = uint8ArrayToBase64(compressedBytes);

    const ratio = inputSize > 0 
      ? (((inputSize - outputSize) / inputSize) * 100).toFixed(1) + '% compressed'
      : '0%';

    return {
      success: true,
      base64Gzip,
      inputSize,
      outputSize,
      compressionRatio: ratio
    };
  } catch (err) {
    return {
      success: false,
      base64Gzip: '',
      inputSize: 0,
      outputSize: 0,
      error: (err as Error).message || 'Failed to compress data.'
    };
  }
}

/**
 * Realistic sample screen permissions payload for quick testing
 */
export const SAMPLE_SCREEN_PERMISSION_JSON = JSON.stringify(
  {
    screenId: "SCR_SECURITY_ROLES_MGMT",
    screenName: "Role & Permission Management",
    module: "ACCESS_CONTROL",
    tenant: "SA-GOV-PROD-01",
    allowedActions: [
      "VIEW_PERMISSIONS",
      "ASSIGN_ROLE",
      "MODIFY_SCREEN_ACTIONS",
      "REVOKE_ACCESS",
      "EXPORT_AUDIT_LOGS"
    ],
    fieldPermissions: {
      "ssn": "MASKED",
      "salary": "HIDDEN",
      "status": "EDITABLE",
      "roleHierarchy": "VIEW_ONLY"
    },
    flags: {
      enableMfaBypass: false,
      enableBiometricAuth: true,
      requireDualApproval: true
    },
    version: "1.4.2",
    timestamp: "2026-09-15T10:45:00Z"
  },
  null,
  2
);

// Pre-compressed Base64 Gzip representation of SAMPLE_SCREEN_PERMISSION_JSON
export const SAMPLE_SCREEN_PERMISSION_BASE64_GZIP = (() => {
  try {
    if (gzip) {
      const bytes = new TextEncoder().encode(SAMPLE_SCREEN_PERMISSION_JSON);
      return uint8ArrayToBase64(gzip(bytes));
    }
  } catch {
    // fallback below
  }
  return 'H4sIAAAAAAAAA1WPQQuCQBCF7/srhj1nVHTyttQgQhnoZoeIWHQOQq2yu1kg/vdY06Lr9x7fvOkYALeFIdI8BH7MML3uRSIi3GMi+czHDZl7ZW1Va8tDODMAGJubFIXEoTWhPMbTH8BtLP/AFncokTOAy6BXt1v9pFIUbrzQfcqF0qJpTN0SD8GZB82+HF9NbdyIGUA/iO7kVKmc+ilaMn62/2w1X88X0w5HWmkXlz7IRBAd8mCx9It61r8B9cfPNRIBAAA=';
})();
