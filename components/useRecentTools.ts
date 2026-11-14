'use client';

import { useSyncExternalStore } from 'react';
import {
  getRecentTools,
  getServerRecentTools,
  subscribeToRecentTools,
} from '@/lib/recentTools';

export function useRecentTools(): readonly string[] {
  return useSyncExternalStore(subscribeToRecentTools, getRecentTools, getServerRecentTools);
}
