/**
 * A small localStorage-backed external store, shaped for `useSyncExternalStore`.
 *
 * Three things in this app need the same behaviour: favourites, analytics
 * consent and recently used tools. They share the awkward parts rather than
 * repeating them:
 *
 * - the snapshot reference stays stable while the contents are unchanged, or
 *   `useSyncExternalStore` re-renders forever;
 * - the stored string is compared before anything is parsed, so a render costs
 *   one string comparison rather than a JSON parse;
 * - every storage access is wrapped, because blocked site data throws on access
 *   rather than returning null;
 * - a refused write keeps the value in memory for the session instead of
 *   snapping the UI back;
 * - one `storage` listener is attached while subscribers exist, for cross-tab
 *   updates, and dropped with the last of them.
 *
 * The on-disk format belongs to the caller, through `parse` and `serialise`.
 */
export interface PersistentStore<T> {
  /** Current value. Stable reference while the contents do not change. */
  get(): T;
  /** Value used for server render and hydration. */
  getServer(): T;
  /** Replaces the value. Returns false when the browser refused to persist it. */
  set(value: T): boolean;
  /** Removes the stored key entirely and returns to `empty`. */
  clear(): void;
  subscribe(onStoreChange: () => void): () => void;
}

export interface PersistentStoreOptions<T> {
  key: string;
  /** Value before anything is stored, and during server render. */
  empty: T;
  parse(raw: string | null): T;
  serialise(value: T): string;
  equals(a: T, b: T): boolean;
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  const { key, empty, parse, serialise, equals } = options;

  const listeners = new Set<() => void>();
  let snapshot: T = empty;
  let cachedRaw: string | null = null;
  let hasReadStorage = false;
  let listenerAttached = false;
  let persistenceBlocked = false;

  function readRaw(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  function handleStorageEvent(event: StorageEvent): void {
    // A null key means storage was cleared entirely.
    if (event.key !== null && event.key !== key) return;
    hasReadStorage = false;
    emit();
  }

  function attach(): void {
    if (listenerAttached || typeof window === 'undefined') return;
    window.addEventListener('storage', handleStorageEvent);
    listenerAttached = true;
  }

  function detach(): void {
    if (!listenerAttached || typeof window === 'undefined') return;
    window.removeEventListener('storage', handleStorageEvent);
    listenerAttached = false;
  }

  function get(): T {
    if (persistenceBlocked) return snapshot;

    const raw = readRaw();
    if (hasReadStorage && raw === cachedRaw) return snapshot;

    const parsed = parse(raw);
    cachedRaw = raw;
    hasReadStorage = true;
    if (!equals(parsed, snapshot)) snapshot = parsed;
    return snapshot;
  }

  function set(value: T): boolean {
    snapshot = value;

    const raw = serialise(value);
    let persisted = false;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, raw);
        persisted = true;
      } catch {
        persisted = false;
      }
    }

    if (persisted) {
      cachedRaw = raw;
      hasReadStorage = true;
    } else {
      persistenceBlocked = true;
    }

    emit();
    return persisted;
  }

  function clear(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing stored means nothing to remove.
      }
    }
    snapshot = empty;
    cachedRaw = null;
    hasReadStorage = false;
    emit();
  }

  return {
    get,
    getServer: () => empty,
    set,
    clear,
    subscribe(onStoreChange: () => void): () => void {
      listeners.add(onStoreChange);
      if (listeners.size === 1) attach();

      return () => {
        listeners.delete(onStoreChange);
        if (listeners.size === 0) detach();
      };
    },
  };
}
