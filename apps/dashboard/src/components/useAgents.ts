'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../lib/utils';

export type AgentInfo = {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  version?: string | null;
  hostname?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  revoked?: boolean;
};

// Module-level singleton store: single source of truth across Navigation, AgentCard, etc.
let sharedAgents: AgentInfo[] = [];
let sharedLoading = true;
let isFetching = false;
let hasFetchedOnce = false;
let activePollingTimer: ReturnType<typeof setInterval> | null = null;
let backgroundPollingTimer: ReturnType<typeof setInterval> | null = null;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  }
}

/**
 * Fetch agents from the API. Updates shared state and notifies all subscribers.
 */
export async function fetchAgents(): Promise<AgentInfo[]> {
  if (isFetching) return sharedAgents;
  isFetching = true;
  try {
    const res = await fetch(`${API_URL}/agents`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      sharedAgents = Array.isArray(data) ? data : [];
    }
  } catch {
    // Keep existing agents on error
  } finally {
    hasFetchedOnce = true;
    sharedLoading = false;
    isFetching = false;
    notify();
  }
  return sharedAgents;
}

/**
 * Start active fast polling (every 3000ms by default).
 * Used when pairing flow is in progress.
 * If an agent becomes ONLINE, calls onOnline and stops active polling.
 */
export function startActivePolling(
  intervalMs = 3000,
  onOnline?: (agent: AgentInfo) => void,
) {
  stopActivePolling();

  const check = async () => {
    const list = await fetchAgents();
    const onlineAgent = list.find((a) => a.status === 'ONLINE');
    if (onlineAgent) {
      stopActivePolling();
      onOnline?.(onlineAgent);
    }
  };

  // Immediate check
  void check();

  activePollingTimer = setInterval(() => {
    void check();
  }, intervalMs);
}

/**
 * Stop active fast polling timer.
 */
export function stopActivePolling() {
  if (activePollingTimer) {
    clearInterval(activePollingTimer);
    activePollingTimer = null;
  }
}

/**
 * Background polling manager:
 * Keeps status fresh (every 8-10s) even when not actively pairing.
 */
function ensureBackgroundPolling() {
  if (!backgroundPollingTimer && typeof window !== 'undefined') {
    backgroundPollingTimer = setInterval(() => {
      // Don't duplicate requests if active fast polling is already running
      if (!activePollingTimer) {
        void fetchAgents();
      }
    }, 8000);
  }
}

export function useAgents() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);

    if (!hasFetchedOnce) {
      void fetchAgents();
    }
    ensureBackgroundPolling();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const online = sharedAgents.some((a) => a.status === 'ONLINE');
  const primary = sharedAgents[0] || null;

  const reload = useCallback(() => fetchAgents(), []);

  return {
    agents: sharedAgents,
    primary,
    online,
    loading: sharedLoading,
    reload,
    startActivePolling,
    stopActivePolling,
  };
}

