/**
 * Recently used tools.
 *
 * Favourites are deliberate, recents are automatic. Stored as route paths,
 * most recent first, capped so the value stays tiny.
 */
import { createPersistentStore } from './persistentStore';

export const RECENT_TOOLS_STORAGE_KEY = 'devtools:recent-tools';
export const RECENT_TOOLS_SCHEMA_VERSION = 1;
export const MAX_RECENT_TOOLS = 6;

interface StoredRecents {
  v: number;
  items: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseRecentTools(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const candidates: unknown[] = isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : [];

    const seen = new Set<string>();
    const items: string[] = [];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const path = candidate.trim();
      if (!path.startsWith('/') || seen.has(path)) continue;
      seen.add(path);
      items.push(path);
      if (items.length >= MAX_RECENT_TOOLS) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function serialiseRecentTools(items: readonly string[]): string {
  const payload: StoredRecents = { v: RECENT_TOOLS_SCHEMA_VERSION, items: [...items] };
  return JSON.stringify(payload);
}

function sameItems(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const EMPTY: readonly string[] = Object.freeze([]);

const store = createPersistentStore<readonly string[]>({
  key: RECENT_TOOLS_STORAGE_KEY,
  empty: EMPTY,
  parse: (raw) => Object.freeze(parseRecentTools(raw)),
  serialise: serialiseRecentTools,
  equals: sameItems,
});

export const getRecentTools = store.get;
export const getServerRecentTools = store.getServer;
export const subscribeToRecentTools = store.subscribe;

/**
 * Moves a path to the front. Does nothing when it is already there, so simply
 * staying on a page never writes to storage.
 */
export function recordToolVisit(path: string): void {
  if (!path.startsWith('/') || path === '/') return;

  const current = store.get();
  if (current[0] === path) return;

  const next = [path, ...current.filter((value) => value !== path)].slice(0, MAX_RECENT_TOOLS);
  store.set(Object.freeze(next));
}

/** Drops entries that are no longer real routes. Writes only when something changed. */
export function pruneRecentTools(knownPaths: Iterable<string>): void {
  const known = new Set(knownPaths);
  const current = store.get();
  const next = current.filter((path) => known.has(path));
  if (next.length !== current.length) store.set(Object.freeze(next));
}

export function clearRecentTools(): void {
  if (store.get().length === 0) return;
  store.clear();
}
