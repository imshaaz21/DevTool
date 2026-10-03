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
