import type { KeyboardEvent } from 'react';

/**
 * Returns a keyboard handler that runs `action` on Enter or Space.
 * Use alongside role="button" and tabIndex on clickable non-button elements.
 */
export function onKeyActivate(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };
}
