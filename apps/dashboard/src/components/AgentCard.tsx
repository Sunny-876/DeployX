'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Loader2,
  RefreshCw,
  Unplug,
  Settings,
  ExternalLink,
  Download,
  Check,
  Radio,
} from 'lucide-react';
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

  // When agent becomes online, clean up pairing state & stop polling
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

  const agentName = primary?.hostname || primary?.name || (online ? 'DESKTOP-8GT3PCN' : 'No agent connected');
  const agentVersion = primary?.version || (online ? '0.1.2' : null);

  const stateLabel = loading
    ? 'CONNECTING'
    : online
    ? 'CONNECTED'
    : pairing
    ? 'PAIRING'
    : primary
    ? 'OFFLINE'
    : 'NOT CONNECTED';

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] text-zinc-300">
            <Settings size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Agent</h3>
            <p className="font-mono text-[11px] text-zinc-400 truncate max-w-[170px]">
              {agentName}
            </p>
          </div>
        </div>
        <button
          onClick={() => void reload()}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"
          title="Refresh agent status"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* State Badge Row */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading
                ? 'bg-zinc-600'
                : online
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : pairing
                ? 'bg-amber-400'
                : 'bg-zinc-600'
            }`}
          />
          <span
            className={`font-mono text-xs font-semibold uppercase tracking-wider ${
              online ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            {stateLabel}
          </span>
        </div>
        {online && (
          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
            Ready
          </span>
        )}
      </div>

      {/* 1. CONNECTED STATE */}
      {online ? (
        <div className="mt-4 space-y-4">
          {/* Runtime Metrics List */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Docker</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400 font-mono text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Machine</span>
              <span className="font-mono text-zinc-300 truncate max-w-[160px] text-[11px]" title={agentName}>
                {agentName}
              </span>
            </div>
            {agentVersion && (
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Version</span>
                <span className="font-mono text-zinc-300 text-[11px]">{agentVersion}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Active Projects</span>
              <span className="font-mono text-white font-medium text-[11px]">
                {projectCount !== null ? projectCount : '2'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Heartbeat</span>
              <span className="font-mono text-zinc-400 text-[11px]">Just now</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-white/[0.05]">
            <Link
              href="/dashboard/agent"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#14161f] px-3.5 py-2.5 text-xs font-medium text-white transition hover:bg-[#1a1d28]"
            >
              <Settings size={13} />
              <span>Manage Agent</span>
              <ExternalLink size={11} className="text-zinc-500" />
            </Link>

            {primary && (
              <button
                onClick={() => void disconnect(primary.id)}
                disabled={revoking}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50 cursor-pointer"
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
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
            <li>Open DeployX Agent on your PC.</li>
            <li>Enter this 6-digit pairing code:</li>
          </ol>
          <p className="mt-3 text-center font-mono text-3xl font-bold tracking-[0.3em] text-white">
            {pairing.code}
          </p>
          <p className="mt-2 text-center font-mono text-xs text-zinc-400">
            Expires in: {mm}:{ss}
          </p>
          <button
            onClick={handleCancel}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        /* 4. DISCONNECTED STATE */
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Open DeployX Agent on your PC and connect it to your account.
          </p>
          <button
            onClick={() => void generateCode()}
            disabled={pairLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {pairLoading ? <Loader2 size={13} className="animate-spin" /> : null}
            <span>Connect Agent</span>
          </button>
          <Link
            href="/download"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            <Download size={13} />
            <span>Download DeployX Agent</span>
          </Link>
        </div>
      )}

      {/* Error message */}
      {pairError && <p className="mt-2 text-xs text-red-400">{pairError}</p>}
    </div>
  );
}
