'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Copies text to the clipboard, surfacing failures via toast
 * instead of leaking an unhandled promise rejection.
 */
export function copyTextToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {
    toast.error('Copy failed - clipboard unavailable');
  });
}

/**
 * Copy helper with per-key "copied" feedback state.
 * Returns `copiedKey` (key of last copied item) and `handleCopy(text, key)`.
 */
export function useCopyFeedback(timeout = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    copyTextToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), timeout);
  };

  return { copiedKey, handleCopy };
}

/** Triggers a plain-text file download via a blob object URL. */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
