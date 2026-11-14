/**
 * Analytics consent.
 *
 * Product analytics is not strictly necessary to run these tools, so under
 * GDPR/ePrivacy it needs prior consent, and session recording on pages where
 * people paste tokens and SQL deserves an explicit yes regardless of the law.
 * Nothing analytics related loads until `granted` is stored. The server and
 * hydration snapshot is `unset`, so a server render never implies consent.
 */
import { createPersistentStore } from './persistentStore';

export const CONSENT_STORAGE_KEY = 'devtools:analytics-consent';
export const CONSENT_SCHEMA_VERSION = 1;

export type ConsentState = 'granted' | 'denied' | 'unset';

interface StoredConsent {
  v: number;
  state: 'granted' | 'denied';
  at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Anything unrecognised reads as `unset`, which means nothing loads. */
export function parseConsent(raw: string | null): ConsentState {
  if (!raw) return 'unset';
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return 'unset';
    if (parsed.state === 'granted' || parsed.state === 'denied') return parsed.state;
    return 'unset';
  } catch {
    return 'unset';
  }
}

export function serialiseConsent(state: ConsentState): string {
  if (state === 'unset') return '';
  const payload: StoredConsent = {
    v: CONSENT_SCHEMA_VERSION,
    state,
    at: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

const store = createPersistentStore<ConsentState>({
  key: CONSENT_STORAGE_KEY,
  empty: 'unset',
  parse: parseConsent,
  serialise: serialiseConsent,
  equals: (a, b) => a === b,
});

export const getConsent = store.get;
export const getServerConsent = store.getServer;
export const subscribeToConsent = store.subscribe;

export function setConsent(state: 'granted' | 'denied'): boolean {
  return store.set(state);
}

/** Forgets the choice so the banner asks again. */
export function clearConsent(): void {
  store.clear();
}
