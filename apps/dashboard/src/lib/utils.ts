export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
  'http://localhost:4000';

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const monthStr = date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return `${monthStr}, ${timeStr}`;
  } catch {
    return dateStr;
  }
}

export function formatDayOnly(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

export function truncateId(id: string, len = 10): string {
  if (!id) return '';
  if (id.length <= len) return id;
  return `${id.slice(0, len)}...`;
}

export function formatErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;

  const msg = (err as { message?: string })?.message || String(err);
  const lower = msg.toLowerCase();

  if (
    (err as { name?: string })?.name === 'TypeError' ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused 127.0.0.1:4000') ||
    lower.includes('econnrefused localhost:4000')
  ) {
    return `Cannot connect to DeployX API at ${API_URL}.`;
  }

  if (
    msg.includes('DeployX Agent is offline') ||
    lower.includes('agent is offline') ||
    lower.includes('econnrefused 127.0.0.1:4100') ||
    lower.includes('econnrefused localhost:4100')
  ) {
    return 'DeployX Agent is offline. Open DeployX Agent on your PC and reconnect.';
  }

  if (lower.includes('500') || lower.includes('internal server error')) {
    return 'DeployX API service temporarily unavailable. Please retry in a moment.';
  }

  return msg || 'An error occurred. Please try again.';
}
