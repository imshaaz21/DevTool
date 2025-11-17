/**
 * Base64 Image Viewer Utilities
 * 
 * This file contains utility functions for decoding and analyzing base64 encoded images.
 */

// Interface for image metadata
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  mimeType: string;
  sizeInBytes: number;
}

// Decode a base64 string to an ArrayBuffer with chunking for large strings
export function decodeBase64(base64String: string): ArrayBuffer {
  // Remove data URL prefix if present
  const base64Data = base64String.includes('base64,')
    ? base64String.split('base64,')[1]
    : base64String;

  // Calculate the length of the output array
  const outputLength = Math.floor(base64Data.length * 0.75);
  const bytes = new Uint8Array(outputLength);

  // Process in chunks to avoid memory issues with large strings
  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const numChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

  let outputPos = 0;

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(base64Data.length, (i + 1) * CHUNK_SIZE);
    const chunk = base64Data.substring(start, end);

    // Decode this chunk
    const binaryChunk = atob(chunk);

    // Copy to the output array
    for (let j = 0; j < binaryChunk.length; j++) {
      bytes[outputPos++] = binaryChunk.charCodeAt(j);
    }
  }

  // If we didn't fill the entire array (due to padding characters in base64)
  // create a properly sized array
  if (outputPos !== outputLength) {
    const resized = new Uint8Array(outputPos);
    resized.set(bytes.subarray(0, outputPos));
    return resized.buffer;
  }

  return bytes.buffer;
}

// Extract MIME type from a data URL
export function extractMimeType(dataUrl: string): string {
  if (!dataUrl.includes('data:') || !dataUrl.includes(';base64,')) {
    // If it's not a data URL, try to guess the MIME type from the content
    return guessMimeTypeFromBase64(dataUrl);
  }

  const mimeMatch = dataUrl.match(/data:([^;]+);base64,/);
  return mimeMatch ? mimeMatch[1] : 'application/octet-stream';
}

// Guess MIME type from base64 content (simplified version)
function guessMimeTypeFromBase64(base64: string): string {
  // Check the first few characters of the decoded string to identify file type
  try {
    const prefix = atob(base64.substring(0, 8));

    // Check for common image file signatures
    if (prefix.startsWith('\xFF\xD8\xFF')) return 'image/jpeg';
    if (prefix.startsWith('\x89PNG\r\n\x1A\n')) return 'image/png';
    if (prefix.startsWith('GIF87a') || prefix.startsWith('GIF89a')) return 'image/gif';
    if (prefix.startsWith('RIFF') && prefix.substring(8, 12) === 'WEBP') return 'image/webp';
    if (prefix.startsWith('<?xml') || prefix.startsWith('<svg')) return 'image/svg+xml';

    // Default to octet-stream if unknown
    return 'application/octet-stream';
  } catch (e) {
    return 'application/octet-stream';
  }
}

// Create a blob URL from a base64 string
export function createBlobUrl(base64String: string, mimeType: string): string {
  const arrayBuffer = decodeBase64(base64String.includes('base64,')
    ? base64String.split('base64,')[1]
    : base64String);

  const blob = new Blob([arrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Get image metadata by loading the image
export async function getImageMetadata(base64String: string): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const mimeType = extractMimeType(base64String);
    const blobUrl = createBlobUrl(base64String, mimeType);

    const img = new Image();
    img.onload = () => {
      // Calculate size in bytes (approximate for base64)
      const base64Data = base64String.includes('base64,')
        ? base64String.split('base64,')[1]
        : base64String;

      const sizeInBytes = Math.floor((base64Data.length * 3) / 4);

      // Determine format from MIME type
      let format = 'unknown';
      if (mimeType === 'image/jpeg') format = 'JPEG';
      else if (mimeType === 'image/png') format = 'PNG';
      else if (mimeType === 'image/gif') format = 'GIF';
      else if (mimeType === 'image/webp') format = 'WebP';
      else if (mimeType === 'image/svg+xml') format = 'SVG';

      resolve({
        width: img.width,
        height: img.height,
        format,
        mimeType,
        sizeInBytes
      });

      // Clean up
      URL.revokeObjectURL(blobUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = blobUrl;
  });
}

// Format file size in a human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Normalize a base64 string (add data URL prefix if missing)
export function normalizeBase64(base64String: string, mimeType: string): string {
  if (base64String.includes('data:')) {
    return base64String;
  }
  return `data:${mimeType};base64,${base64String}`;
}
