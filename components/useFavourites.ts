'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getFavouritesSnapshot,
  getServerFavouritesSnapshot,
  subscribeToFavourites,
  toggleFavourite,
  type ToggleResult,
} from '@/lib/favourites';

export interface UseFavouritesResult {
  /** Favourited route paths, in the order they were added. */
  favourites: readonly string[];
  count: number;
  isFavourite: (path: string) => boolean;
  toggle: (path: string) => ToggleResult;
}

/**
 * Reads the favourites store.
 *
 * `useSyncExternalStore` is used rather than state plus an effect: it renders the
 * server snapshot during hydration (so the markup matches, with no `mounted`
 * flag), then swaps to the stored value, and it makes cross-tab updates a
 * property of the store instead of per-component wiring.
 */
export function useFavourites(): UseFavouritesResult {
  const snapshot = useSyncExternalStore(
    subscribeToFavourites,
    getFavouritesSnapshot,
    getServerFavouritesSnapshot
  );

  const isFavourite = useCallback(
    (path: string) => snapshot.lookup.has(path),
    [snapshot]
  );

  const toggle = useCallback((path: string) => toggleFavourite(path), []);

  return {
    favourites: snapshot.items,
    count: snapshot.items.length,
    isFavourite,
    toggle,
  };
}
