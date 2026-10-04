'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal as TerminalIcon, ArrowDown, Copy, Check, Radio } from 'lucide-react';

interface DeploymentTerminalProps {
  logs: string[];
  status: string;
  projectName?: string;
  deploymentId?: string;
}

export function DeploymentTerminal({
  logs,
  status,
  projectName,
  deploymentId,
}: DeploymentTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userScrolledUpRef = useRef(false);
  const autoFollowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [copied, setCopied] = useState(false);

  const isActive =
    status === 'BUILDING' ||
    status === 'QUEUED' ||
    status === 'STARTING' ||
    status === 'RUNNING' ||
    status === 'CREATING_TUNNEL' ||
    status === 'RESUMING';

  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    userScrolledUpRef.current = false;
    setIsNearBottom(true);
  }, []);

  // Handle user scroll detection
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom < 32;
    setIsNearBottom(near);

    if (isActive) {
      if (!near) {
        userScrolledUpRef.current = true;
        // If user scrolled up during active deployment, allow them to view logs,
        // but re-engage auto-follow after 3.5s of no scroll activity so they don't miss live status
        if (autoFollowTimerRef.current) {
          clearTimeout(autoFollowTimerRef.current);
        }
        autoFollowTimerRef.current = setTimeout(() => {
          if (isActive) {
            scrollToBottom(true);
          }
        }, 3500);
      } else {
        userScrolledUpRef.current = false;
        if (autoFollowTimerRef.current) {
          clearTimeout(autoFollowTimerRef.current);
        }
      }
    }
  }, [isActive, scrollToBottom]);

  // When new logs arrive
  useEffect(() => {
    if (!isActive) return;

    // If user hasn't explicitly scrolled up, follow automatically
    if (!userScrolledUpRef.current) {
      scrollToBottom(false);
    }
  }, [logs.length, isActive, scrollToBottom]);

  // When deployment finishes, cancel any pending auto-follow timer
  useEffect(() => {
    if (!isActive) {
      if (autoFollowTimerRef.current) {
        clearTimeout(autoFollowTimerRef.current);
      }
      userScrolledUpRef.current = false;
    }
  }, [isActive]);

  const copyAllLogs = async () => {
    if (logs.length === 0) return;
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Format line styling cleanly
  const formattedLogs = useMemo(() => {
    return logs.map((raw, idx) => {
      const isCmd = raw.startsWith('$') || raw.startsWith('>');
      const isErr = raw.toLowerCase().includes('error:') || raw.toLowerCase().includes('failed');
      const isSuccess =
        raw.includes('Build completed') ||
        raw.includes('Application healthy') ||
        raw.includes('Tunnel ready') ||
        raw.includes('Container running');
      const isStage = raw.startsWith('==>') || raw.startsWith('[stage]');

      return {
        id: idx,
        raw,
        isCmd,
        isErr,
        isSuccess,
        isStage,
      };
    });
  }, [logs]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#08090a] shadow-xl">
      {/* Terminal Header */}
      <div className="flex h-11 items-center justify-between border-b border-white/[0.08] bg-[#0d0f12] px-3.5">
        <div className="flex items-center gap-2.5">
          <TerminalIcon size={14} className="text-zinc-500" />
          <span className="font-mono text-xs font-semibold tracking-wide text-zinc-300">
            {projectName ? `${projectName}` : 'DEPLOYMENT TERMINAL'}
          </span>
          {deploymentId && (
            <span className="hidden font-mono text-[11px] text-zinc-600 sm:inline">
              #{deploymentId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live indicator */}
          {isActive ? (
            <div className="flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span>STREAMING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              <span>TERMINATED</span>
            </div>
          )}

          <span className="font-mono text-[11px] text-zinc-600">
            {logs.length} {logs.length === 1 ? 'line' : 'lines'}
          </span>

          <button
            onClick={() => void copyAllLogs()}
            disabled={logs.length === 0}
            className="flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 font-mono text-[11px] text-zinc-400 hover:border-white/20 hover:text-white transition disabled:opacity-30"
            title="Copy all logs"
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-80 overflow-y-auto p-4 font-mono text-[12px] leading-5 text-zinc-300 select-text scroll-smooth"
        tabIndex={0}
        aria-label="Deployment log output"
      >
        {formattedLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-zinc-600">
            {isActive ? (
              <>
                <span className="mb-2 h-2 w-2 animate-ping rounded-full bg-blue-500" />
                <p>Waiting for build output from DeployX Agent...</p>
              </>
            ) : (
              <p>No build logs recorded for this deployment.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {formattedLogs.map((item) => (
              <div
                key={item.id}
                className={`whitespace-pre-wrap break-all ${
                  item.isErr
                    ? 'text-rose-400'
                    : item.isSuccess
                    ? 'text-emerald-400'
                    : item.isCmd
                    ? 'text-zinc-200'
                    : item.isStage
                    ? 'text-zinc-400 font-semibold'
                    : 'text-zinc-400'
                }`}
              >
                {item.raw}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating "Jump to latest" Button */}
      {!isNearBottom && logs.length > 5 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-[#111317]/95 px-3 py-1 font-mono text-[11px] font-medium text-white shadow-lg backdrop-blur hover:bg-white/10 transition"
        >
          <ArrowDown size={12} className="animate-bounce" />
          <span>Jump to latest</span>
        </button>
      )}
    </div>
  );
}
