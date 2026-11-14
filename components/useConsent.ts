'use client';

import { useSyncExternalStore } from 'react';
import {
  getConsent,
  getServerConsent,
  subscribeToConsent,
  type ConsentState,
} from '@/lib/consent';

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribeToConsent, getConsent, getServerConsent);
}
