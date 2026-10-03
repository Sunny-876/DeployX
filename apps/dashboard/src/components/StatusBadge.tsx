'use client';

import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

export function StatusBadge({
  status,
  size = 'md',
  showAnimation = true,
}: StatusBadgeProps) {
  const normalized = (status || 'UNKNOWN').toUpperCase();

  const isReady = normalized === 'READY';
  const isPaused = normalized === 'PAUSED';
  const isFailed = normalized === 'FAILED';
  const isPending =
    normalized === 'BUILDING' ||
    normalized === 'QUEUED' ||
    normalized === 'STARTING' ||
    normalized === 'RUNNING' ||
    normalized === 'CREATING_TUNNEL' ||
    normalized === 'RESUMING';

  let colorClasses = 'border-zinc-700/50 bg-zinc-800/40 text-zinc-400';
  let dotColor = 'bg-zinc-400';

  if (isReady) {
    colorClasses = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
    dotColor = 'bg-emerald-400';
  } else if (isPaused) {
    colorClasses = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
    dotColor = 'bg-amber-400';
  } else if (isFailed) {
    colorClasses = 'border-rose-500/20 bg-rose-500/10 text-rose-400';
    dotColor = 'bg-rose-400';
  } else if (isPending) {
    colorClasses = 'border-blue-500/20 bg-blue-500/10 text-blue-400';
    dotColor = 'bg-blue-400';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2.5 font-medium'
      : 'px-2.5 py-1 text-xs gap-2 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-mono ${colorClasses} ${sizeClasses}`}
    >
      {isPending && showAnimation ? (
        <Loader2
          size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12}
          className="animate-spin shrink-0"
        />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor} ${
            isReady && showAnimation ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{normalized}</span>
    </span>
  );
}
