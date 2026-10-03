'use client';

import { useEffect, useState } from 'react';
import { Cpu, Loader2, RefreshCw, Unplug, Settings, ExternalLink, Download } from 'lucide-react';
import { API_URL } from '../lib/utils';
import { useAgents } from './useAgents';

export function AgentCard() {
  const { agents, primary, online, loading, reload, startActivePolling, stopActivePolling } = useAgents();

  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [revoking, setRevoking] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);

  // When agent becomes online, immediately clean up pairing state & stop polling
  useEffect(() => {
    if (online) {
      setPairing(null);
      setIsExpired(false);
      stopActivePolling();
    }
  }, [online, stopActivePolling]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      stopActivePolling();
    };
  }, [stopActivePolling]);

  // Countdown timer for active pairing session
  useEffect(() => {
    if (!pairing) return;
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(pairing.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        stopActivePolling();
        setPairing(null);
        setIsExpired(true);
      }
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [pairing, stopActivePolling]);

  // Fetch project count when connected
  useEffect(() => {
    if (!online) return;
    let active = true;
    fetch(`${API_URL}/projects`, { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setProjectCount(data.length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [online]);

  const generateCode = async () => {
    setPairLoading(true);
    setPairError(null);
    setIsExpired(false);
    try {
      const res = await fetch(`${API_URL}/agents/pair`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'Could not generate pairing code');
      setPairing({ code: data.code, expiresAt: data.expiresAt });

      // Start fast polling (every 3 seconds) while pairing flow is active
      startActivePolling(3000, () => {
        setPairing(null);
        setIsExpired(false);
      });
    } catch (err) {
      setPairError(err instanceof Error ? err.message : 'Could not generate pairing code');
    } finally {
      setPairLoading(false);
    }
  };

  const handleCancel = () => {
    stopActivePolling();
    setPairing(null);
    setIsExpired(false);
    setPairError(null);
  };

  const localAgentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:4100';

  const disconnect = async (id: string) => {
    setRevoking(true);
    try {
      await fetch(`${API_URL}/agents/${id}/revoke`, { method: 'POST', credentials: 'include' });
      // Notify local agent to unpair immediately if running
      await fetch(`${localAgentUrl}/unpair`, { method: 'POST' }).catch(() => {});
      await reload();
    } catch (err) {
      setPairError(err instanceof Error ? err.message : 'Could not disconnect agent');
    } finally {
      setRevoking(false);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const agentName = primary?.hostname || primary?.name || (online ? 'My PC' : 'No agent connected');

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-300">
            <Cpu size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Agent</h3>
            <p className="font-mono text-xs text-zinc-400 truncate max-w-[180px]">
              {agentName}
            </p>
          </div>
        </div>
        <button
          onClick={() => void reload()}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"
          title="Refresh agent status"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Online / Offline Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            loading
              ? 'bg-zinc-600'
              : online
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
              : 'border border-zinc-500 bg-transparent'
          }`}
        />
        <span className="font-mono text-xs font-medium text-zinc-200">
          {loading ? 'Checking...' : online ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* 1. CONNECTED STATE */}
      {online ? (
        <div className="mt-4 space-y-4">
          {/* Runtime Metrics */}
          <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-1 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-400">Docker</span>
              <span className="flex items-center gap-1.5 font-medium text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-zinc-400">Projects</span>
              <span className="font-mono font-medium text-white">
                {projectCount !== null ? projectCount : '1'}
              </span>
            </div>
          </div>

          {/* Connected Actions */}
          <div className="flex flex-col gap-2">
            <a
              href={localAgentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 border border-white/10"
            >
              <Settings size={13} />
              <span>Manage Agent</span>
              <ExternalLink size={12} className="text-zinc-400" />
            </a>

            {primary && (
              <button
                onClick={() => void disconnect(primary.id)}
                disabled={revoking}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition disabled:opacity-50"
              >
                <Unplug size={13} />
                <span>{revoking ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            )}
          </div>
        </div>
      ) : isExpired ? (
        /* 2. EXPIRED PAIRING CODE STATE */
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-xs font-medium text-amber-300">Pairing code expired.</p>
          <button
            onClick={() => void generateCode()}
            disabled={pairLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {pairLoading ? <Loader2 size={13} className="animate-spin" /> : null}
            <span>Generate New Code</span>
          </button>
        </div>
      ) : pairing ? (
        /* 3. ACTIVE PAIRING STATE */
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Connect your PC</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-zinc-400">
            <li>Make sure DeployX Agent is running.</li>
            <li>Copy this pairing code into the Agent:</li>
          </ol>
          <p className="mt-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-white">
            {pairing.code}
          </p>
          <p className="mt-2 text-center font-mono text-xs text-zinc-400">
            Expires in: {mm}:{ss}
          </p>
          <button
            onClick={handleCancel}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        /* 4. DISCONNECTED / OFFLINE INITIAL STATE */
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => void generateCode()}
            disabled={pairLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {pairLoading ? <Loader2 size={15} className="animate-spin" /> : null}
            <span>Connect Agent</span>
          </button>
          <a
            href="/download"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <Download size={13} />
            <span>Download DeployX Agent</span>
          </a>
        </div>
      )}

      {/* Error message (kept visible on error) */}
      {pairError && <p className="mt-2 text-xs text-red-400">{pairError}</p>}

      {/* Secondary paired agents if any */}
      {!online && agents.length > 1 && (
        <div className="mt-3 space-y-1">
          {agents.slice(1).map((a) => (
            <p key={a.id} className="text-xs text-zinc-500">
              {a.name} - {a.status === 'ONLINE' ? 'Online' : 'Offline'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
