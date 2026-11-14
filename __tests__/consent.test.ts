type ConsentModule = typeof import('../lib/consent');

async function loadStore(): Promise<ConsentModule> {
  jest.resetModules();
  return import('../lib/consent');
}

describe('analytics consent store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('parseConsent', () => {
    it('treats nothing stored as unset', async () => {
      const { parseConsent } = await loadStore();
      expect(parseConsent(null)).toBe('unset');
      expect(parseConsent('')).toBe('unset');
    });

    it('treats corrupt values as unset rather than consent', async () => {
      const { parseConsent } = await loadStore();
      expect(parseConsent('{not json')).toBe('unset');
      expect(parseConsent('"granted"')).toBe('unset');
      expect(parseConsent('{"v":1,"state":"maybe"}')).toBe('unset');
    });

    it('reads a stored decision', async () => {
      const { parseConsent } = await loadStore();
      expect(parseConsent('{"v":1,"state":"granted","at":"2026-01-01T00:00:00.000Z"}')).toBe('granted');
      expect(parseConsent('{"v":1,"state":"denied","at":"2026-01-01T00:00:00.000Z"}')).toBe('denied');
    });
  });

  it('serialises an unset state to nothing storable', async () => {
    const { serialiseConsent } = await loadStore();
    expect(serialiseConsent('unset')).toBe('');
  });

  it('defaults to unset, so nothing loads before a choice', async () => {
    const store = await loadStore();
    expect(store.getConsent()).toBe('unset');
  });

  it('never implies consent during server render', async () => {
    const store = await loadStore();
    store.setConsent('granted');
    expect(store.getServerConsent()).toBe('unset');
  });

  it('stores a grant with a version and timestamp', async () => {
    const store = await loadStore();
    expect(store.setConsent('granted')).toBe(true);
    expect(store.getConsent()).toBe('granted');

    const raw = window.localStorage.getItem(store.CONSENT_STORAGE_KEY);
    const parsed = JSON.parse(raw as string);
    expect(parsed.state).toBe('granted');
    expect(parsed.v).toBe(store.CONSENT_SCHEMA_VERSION);
    expect(typeof parsed.at).toBe('string');
  });

  it('stores a refusal', async () => {
    const store = await loadStore();
    store.setConsent('denied');
    expect(store.getConsent()).toBe('denied');
  });

  it('forgets the choice so the question can be asked again', async () => {
    const store = await loadStore();
    store.setConsent('granted');
    store.clearConsent();

    expect(store.getConsent()).toBe('unset');
    expect(window.localStorage.getItem(store.CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers when the choice changes', async () => {
    const store = await loadStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribeToConsent(listener);

    store.setConsent('granted');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setConsent('denied');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('picks up a decision made in another tab', async () => {
    const store = await loadStore();
    const listener = jest.fn();
    store.subscribeToConsent(listener);

    window.localStorage.setItem(
      store.CONSENT_STORAGE_KEY,
      JSON.stringify({ v: 1, state: 'granted', at: '2026-01-01T00:00:00.000Z' })
    );
    window.dispatchEvent(new StorageEvent('storage', { key: store.CONSENT_STORAGE_KEY }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getConsent()).toBe('granted');
  });

  it('stays unset when storage cannot be read', async () => {
    const store = await loadStore();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(store.getConsent()).toBe('unset');
  });
});

export {};
