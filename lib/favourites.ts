/**
 * Favourite tools.
 *
 * A favourite is one of this app's own route paths, persisted in localStorage so
 * the suite stays entirely client side: nothing is sent anywhere, and the stored
 * payload contains no identifiers. The storage mechanics live in
 * `persistentStore`; this module owns the format and the operations.
 */
import { createPersistentStore } from './persistentStore';

export const FAVOURITES_STORAGE_KEY = 'devtools:favourites';
export const FAVOURITES_SCHEMA_VERSION = 1;

/** Bound on stored entries, so a corrupt or hand-edited value cannot grow without limit. */
export const MAX_FAVOURITES = 64;

export interface FavouritesSnapshot {
  /** Route paths, in the order they were favourited. */
  readonly items: readonly string[];
  /** The same values, for O(1) membership tests during render. */
  readonly lookup: ReadonlySet<string>;
}

export interface ToggleResult {
  /** Whether the path is a favourite after the toggle. */
  favourited: boolean;
  /** False when the browser refused the write (private mode, blocked storage, quota). */
  persisted: boolean;
}

interface StoredFavourites {
  v: number;
  items: string[];
}

function createSnapshot(items: readonly string[]): FavouritesSnapshot {
  return Object.freeze({
    items: Object.freeze([...items]) as readonly string[],
    lookup: new Set(items) as ReadonlySet<string>,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toItems(parsed: unknown): string[] {
  let candidates: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
    candidates = parsed.items;
  }

  const seen = new Set<string>();
  const items: string[] = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const path = candidate.trim();
    // Favourites are internal route paths; anything else is junk or injected.
    if (!path.startsWith('/') || seen.has(path)) continue;
    seen.add(path);
    items.push(path);
    if (items.length >= MAX_FAVOURITES) break;
  }
  return items;
}

/** Parses a stored value, tolerating corruption, old formats and bare arrays. */
export function parseFavourites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return toItems(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function serialiseFavourites(items: readonly string[]): string {
  const payload: StoredFavourites = {
    v: FAVOURITES_SCHEMA_VERSION,
    items: [...items],
  };
  return JSON.stringify(payload);
}

function sameItems(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const store = createPersistentStore<FavouritesSnapshot>({
  key: FAVOURITES_STORAGE_KEY,
  empty: createSnapshot([]),
  parse: (raw) => createSnapshot(parseFavourites(raw)),
  serialise: (snapshot) => serialiseFavourites(snapshot.items),
  equals: (a, b) => sameItems(a.items, b.items),
});

export const getFavouritesSnapshot = store.get;
export const getServerFavouritesSnapshot = store.getServer;
export const subscribeToFavourites = store.subscribe;

export function toggleFavourite(path: string): ToggleResult {
  const current = store.get().items;
  const wasFavourite = current.includes(path);
  const next = wasFavourite
    ? current.filter((value) => value !== path)
    : [...current, path].slice(-MAX_FAVOURITES);

  return { favourited: !wasFavourite, persisted: store.set(createSnapshot(next)) };
}

/**
 * Drops favourites that are no longer real routes, so a renamed or removed tool
 * does not linger in storage. Writes only when something actually changed.
 */
export function pruneFavourites(knownPaths: Iterable<string>): void {
  const known = new Set(knownPaths);
  const current = store.get().items;
  const next = current.filter((path) => known.has(path));
  if (next.length !== current.length) store.set(createSnapshot(next));
}
