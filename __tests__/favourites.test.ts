type FavouritesModule = typeof import('../lib/favourites');

/** Fresh module instance, so the store's internal cache does not leak between tests. */
async function loadStore(): Promise<FavouritesModule> {
  jest.resetModules();
  return import('../lib/favourites');
}

describe('favourites store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('parseFavourites', () => {
    it('returns an empty list for missing or blank values', async () => {
      const { parseFavourites } = await loadStore();
      expect(parseFavourites(null)).toEqual([]);
      expect(parseFavourites('')).toEqual([]);
    });

    it('returns an empty list for corrupt JSON instead of throwing', async () => {
      const { parseFavourites } = await loadStore();
      expect(parseFavourites('{not json')).toEqual([]);
    });

    it('reads the versioned envelope format', async () => {
      const { parseFavourites } = await loadStore();
      expect(parseFavourites('{"v":1,"items":["/jwt-decoder","/uuid-generator"]}'))
        .toEqual(['/jwt-decoder', '/uuid-generator']);
    });

    it('tolerates a bare array for forward compatibility', async () => {
      const { parseFavourites } = await loadStore();
      expect(parseFavourites('["/jwt-decoder"]')).toEqual(['/jwt-decoder']);
    });

    it('discards entries that are not internal route paths', async () => {
      const { parseFavourites } = await loadStore();
      const raw = JSON.stringify({
        v: 1,
        items: ['/jwt-decoder', 'https://evil.example', 42, null, '', 'relative'],
      });
      expect(parseFavourites(raw)).toEqual(['/jwt-decoder']);
    });

    it('removes duplicates and keeps the first occurrence', async () => {
      const { parseFavourites } = await loadStore();
      const raw = JSON.stringify({ v: 1, items: ['/a', '/b', '/a'] });
      expect(parseFavourites(raw)).toEqual(['/a', '/b']);
    });

    it('caps the number of stored entries', async () => {
      const { parseFavourites, MAX_FAVOURITES } = await loadStore();
      const items = Array.from({ length: MAX_FAVOURITES + 25 }, (_, i) => `/tool-${i}`);
      expect(parseFavourites(JSON.stringify({ v: 1, items }))).toHaveLength(MAX_FAVOURITES);
    });
  });

  describe('serialiseFavourites', () => {
    it('writes the schema version alongside the items', async () => {
      const { serialiseFavourites, FAVOURITES_SCHEMA_VERSION } = await loadStore();
      expect(JSON.parse(serialiseFavourites(['/a']))).toEqual({
        v: FAVOURITES_SCHEMA_VERSION,
        items: ['/a'],
      });
    });
  });

  describe('getFavouritesSnapshot', () => {
    it('reads what is already in storage', async () => {
      const store = await loadStore();
      window.localStorage.setItem(
        store.FAVOURITES_STORAGE_KEY,
        JSON.stringify({ v: 1, items: ['/jwt-decoder'] })
      );
      expect(store.getFavouritesSnapshot().items).toEqual(['/jwt-decoder']);
    });

    it('exposes a lookup set for membership tests', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      expect(store.getFavouritesSnapshot().lookup.has('/jwt-decoder')).toBe(true);
      expect(store.getFavouritesSnapshot().lookup.has('/uuid-generator')).toBe(false);
    });

    it('returns a stable reference while nothing changes', async () => {
      const store = await loadStore();
      const first = store.getFavouritesSnapshot();
      expect(store.getFavouritesSnapshot()).toBe(first);
    });

    it('returns a new reference once the contents change', async () => {
      const store = await loadStore();
      const first = store.getFavouritesSnapshot();
      store.toggleFavourite('/jwt-decoder');
      expect(store.getFavouritesSnapshot()).not.toBe(first);
    });

    it('keeps the reference when a rewrite leaves the contents equal', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      const first = store.getFavouritesSnapshot();
      window.localStorage.setItem(
        store.FAVOURITES_STORAGE_KEY,
        JSON.stringify({ v: 1, items: ['/jwt-decoder'], extra: 'ignored' })
      );
      expect(store.getFavouritesSnapshot()).toBe(first);
    });

    it('picks up a value written directly to storage', async () => {
      const store = await loadStore();
      expect(store.getFavouritesSnapshot().items).toEqual([]);
      window.localStorage.setItem(
        store.FAVOURITES_STORAGE_KEY,
        JSON.stringify({ v: 1, items: ['/pkce-generator'] })
      );
      expect(store.getFavouritesSnapshot().items).toEqual(['/pkce-generator']);
    });

    it('falls back to an empty list when reading storage throws', async () => {
      const store = await loadStore();
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(store.getFavouritesSnapshot().items).toEqual([]);
    });

    it('returns an empty snapshot for the server render', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      expect(store.getServerFavouritesSnapshot().items).toEqual([]);
    });
  });

  describe('toggleFavourite', () => {
    it('adds a path and reports it as favourited', async () => {
      const store = await loadStore();
      expect(store.toggleFavourite('/jwt-decoder')).toEqual({
        favourited: true,
        persisted: true,
      });
      expect(store.getFavouritesSnapshot().items).toEqual(['/jwt-decoder']);
    });

    it('removes a path that is already favourited', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      expect(store.toggleFavourite('/jwt-decoder').favourited).toBe(false);
      expect(store.getFavouritesSnapshot().items).toEqual([]);
    });

    it('appends in the order items were added', async () => {
      const store = await loadStore();
      store.toggleFavourite('/a');
      store.toggleFavourite('/b');
      expect(store.getFavouritesSnapshot().items).toEqual(['/a', '/b']);
    });

    it('persists through the versioned envelope', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      const raw = window.localStorage.getItem(store.FAVOURITES_STORAGE_KEY);
      expect(JSON.parse(raw as string)).toEqual({ v: 1, items: ['/jwt-decoder'] });
    });

    it('reports persisted false but still applies when the write is refused', async () => {
      const store = await loadStore();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });

      const result = store.toggleFavourite('/jwt-decoder');
      expect(result).toEqual({ favourited: true, persisted: false });
      expect(store.getFavouritesSnapshot().items).toEqual(['/jwt-decoder']);
    });

    it('drops the oldest entry once the cap is reached', async () => {
      const store = await loadStore();
      for (let i = 0; i < store.MAX_FAVOURITES; i += 1) {
        store.toggleFavourite(`/tool-${i}`);
      }
      store.toggleFavourite('/one-more');

      const { items } = store.getFavouritesSnapshot();
      expect(items).toHaveLength(store.MAX_FAVOURITES);
      expect(items).not.toContain('/tool-0');
      expect(items).toContain('/one-more');
    });
  });

  describe('pruneFavourites', () => {
    it('removes favourites that are no longer known routes', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');
      store.toggleFavourite('/removed-tool');

      store.pruneFavourites(['/jwt-decoder', '/uuid-generator']);

      expect(store.getFavouritesSnapshot().items).toEqual(['/jwt-decoder']);
    });

    it('does not write when every favourite is still valid', async () => {
      const store = await loadStore();
      store.toggleFavourite('/jwt-decoder');

      const setItem = jest.spyOn(Storage.prototype, 'setItem');
      store.pruneFavourites(['/jwt-decoder']);

      expect(setItem).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToFavourites', () => {
    it('notifies subscribers when favourites change', async () => {
      const store = await loadStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribeToFavourites(listener);

      store.toggleFavourite('/jwt-decoder');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.toggleFavourite('/uuid-generator');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('reacts to a change made in another tab', async () => {
      const store = await loadStore();
      const listener = jest.fn();
      store.subscribeToFavourites(listener);

      window.localStorage.setItem(
        store.FAVOURITES_STORAGE_KEY,
        JSON.stringify({ v: 1, items: ['/list-compare'] })
      );
      window.dispatchEvent(
        new StorageEvent('storage', { key: store.FAVOURITES_STORAGE_KEY })
      );

      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getFavouritesSnapshot().items).toEqual(['/list-compare']);
    });

    it('ignores storage events for unrelated keys', async () => {
      const store = await loadStore();
      const listener = jest.fn();
      store.subscribeToFavourites(listener);

      window.dispatchEvent(new StorageEvent('storage', { key: 'sidebar-collapsed' }));

      expect(listener).not.toHaveBeenCalled();
    });

    it('reacts to storage being cleared entirely', async () => {
      const store = await loadStore();
      const listener = jest.fn();
      store.subscribeToFavourites(listener);

      window.dispatchEvent(new StorageEvent('storage', { key: null }));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('detaches the storage listener once the last subscriber leaves', async () => {
      const store = await loadStore();
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const first = store.subscribeToFavourites(jest.fn());
      const second = store.subscribeToFavourites(jest.fn());
      expect(addSpy).toHaveBeenCalledTimes(1);

      first();
      expect(removeSpy).not.toHaveBeenCalled();

      second();
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });
  });
});

export {};
