type RecentModule = typeof import('../lib/recentTools');

async function loadStore(): Promise<RecentModule> {
  jest.resetModules();
  return import('../lib/recentTools');
}

describe('recent tools store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('starts empty', async () => {
    const store = await loadStore();
    expect(store.getRecentTools()).toEqual([]);
  });

  it('records a visit', async () => {
    const store = await loadStore();
    store.recordToolVisit('/jwt-decoder');
    expect(store.getRecentTools()).toEqual(['/jwt-decoder']);
  });

  it('puts the most recent visit first', async () => {
    const store = await loadStore();
    store.recordToolVisit('/a');
    store.recordToolVisit('/b');
    expect(store.getRecentTools()).toEqual(['/b', '/a']);
  });

  it('moves a revisited tool to the front without duplicating it', async () => {
    const store = await loadStore();
    store.recordToolVisit('/a');
    store.recordToolVisit('/b');
    store.recordToolVisit('/a');
    expect(store.getRecentTools()).toEqual(['/a', '/b']);
  });

  it('does not write when the tool is already the most recent', async () => {
    const store = await loadStore();
    store.recordToolVisit('/a');

    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    store.recordToolVisit('/a');

    expect(setItem).not.toHaveBeenCalled();
  });

  it('ignores the dashboard and non-route values', async () => {
    const store = await loadStore();
    store.recordToolVisit('/');
    store.recordToolVisit('https://example.com');
    expect(store.getRecentTools()).toEqual([]);
  });

  it('keeps only the most recent few', async () => {
    const store = await loadStore();
    for (let i = 0; i < store.MAX_RECENT_TOOLS + 4; i += 1) {
      store.recordToolVisit(`/tool-${i}`);
    }

    const recents = store.getRecentTools();
    expect(recents).toHaveLength(store.MAX_RECENT_TOOLS);
    expect(recents[0]).toBe(`/tool-${store.MAX_RECENT_TOOLS + 3}`);
    expect(recents).not.toContain('/tool-0');
  });

  it('survives a corrupt stored value', async () => {
    const store = await loadStore();
    window.localStorage.setItem(store.RECENT_TOOLS_STORAGE_KEY, '{not json');
    expect(store.getRecentTools()).toEqual([]);
  });

  it('drops entries that are no longer known routes', async () => {
    const store = await loadStore();
    store.recordToolVisit('/gone');
    store.recordToolVisit('/jwt-decoder');

    store.pruneRecentTools(['/jwt-decoder']);

    expect(store.getRecentTools()).toEqual(['/jwt-decoder']);
  });

  it('does not write when every entry is still valid', async () => {
    const store = await loadStore();
    store.recordToolVisit('/jwt-decoder');

    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    store.pruneRecentTools(['/jwt-decoder']);

    expect(setItem).not.toHaveBeenCalled();
  });

  it('clears the list', async () => {
    const store = await loadStore();
    store.recordToolVisit('/jwt-decoder');
    store.clearRecentTools();
    expect(store.getRecentTools()).toEqual([]);
  });

  it('is empty during server render', async () => {
    const store = await loadStore();
    store.recordToolVisit('/jwt-decoder');
    expect(store.getServerRecentTools()).toEqual([]);
  });
});

export {};
