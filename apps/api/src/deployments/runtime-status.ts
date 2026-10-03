/**
 * Shared helpers for translating agent/Docker runtime state into the
 * current-state DeploymentStatus used by the API + dashboard.
 *
 * DeployX keeps no deployment history, so the DB status must always describe
 * what is happening in Docker *right now*:
 *   RUNNING -> container is up and reachable
 *   PAUSED  -> container exists but is paused/stopped (no public URL)
 *   OFFLINE -> expected runtime is gone / unreachable
 *   BUILDING-> transient (queued, building, creating tunnel, ...)
 *   FAILED  -> build or runtime failure
 */

export type RuntimeStatus =
  | 'BUILDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'OFFLINE'
  | 'FAILED';

/** Agent deployment states (see apps/agent DeploymentState) -> DB status. */
const AGENT_STATUS_MAP: Record<string, RuntimeStatus> = {
  QUEUED: 'BUILDING',
  BUILDING: 'BUILDING',
  STARTING: 'BUILDING',
  CREATING_TUNNEL: 'BUILDING',
  RESUMING: 'BUILDING',
  RUNNING: 'RUNNING',
  READY: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'PAUSED',
  OFFLINE: 'OFFLINE',
  FAILED: 'FAILED',
};

/** Docker container states -> DB status. */
const CONTAINER_STATE_MAP: Record<string, RuntimeStatus> = {
  running: 'RUNNING',
  paused: 'PAUSED',
  exited: 'PAUSED',
  created: 'PAUSED',
  restarting: 'BUILDING',
  removing: 'OFFLINE',
  dead: 'OFFLINE',
};

export function toRuntimeStatus(
  value?: string | null,
): RuntimeStatus | null {
  if (!value) return null;
  return AGENT_STATUS_MAP[String(value).toUpperCase()] || null;
}

export function containerStateToStatus(
  state?: string | null,
  containerExists = true,
): RuntimeStatus {
  if (!containerExists) return 'OFFLINE';
  if (!state) return 'OFFLINE';
  return CONTAINER_STATE_MAP[String(state).toLowerCase()] || 'OFFLINE';
}

/** Statuses that describe a runtime we expect to find in Docker. */
export const LIVE_STATUSES: string[] = ['RUNNING', 'READY', 'PAUSED'];

export function isLiveStatus(status?: string | null): boolean {
  return !!status && LIVE_STATUSES.includes(status);
}

/** Normalize a DB status into the status the dashboard should render. */
export function displayStatus(status?: string | null): string {
  if (!status) return 'OFFLINE';
  const normalized = String(status).toUpperCase();
  if (normalized === 'READY') return 'RUNNING';
  if (normalized === 'QUEUED') return 'BUILDING';
  return normalized;
}
