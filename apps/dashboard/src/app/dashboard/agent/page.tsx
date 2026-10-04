'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  RefreshCw,
  Unplug,
  ExternalLink,
  Download,
  Check,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Activity,
  HardDrive,
  Copy,
  Loader2,
} from 'lucide-react';
import { API_URL, formatDate } from '../../../lib/utils';
import { useAgents } from '../../../components/useAgents';
import { ConfirmModal } from '../../../components/ConfirmModal';

export default function AgentDashboardPage() {
  const { agents, primary, online, loading, reload, startActivePolling, stopActivePolling } = useAgents();

  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [activeDeploymentsCount, setActiveDeploymentsCount] = useState<number | null>(null);

  // Auto clean pairing on online
  useEffect(() => {
    if (online) {
      setPairing(null);
      setIsExpired(false);
      stopActivePolling();
    }
  }, [online, stopActivePolling]);

  useEffect(() => {
    return () => {
      stopActivePolling();
    };
  }, [stopActivePolling]);

  // Countdown timer
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

  // Fetch project count & active deployments
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/projects`, { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setProjectCount(data.length);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/deployments`, { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          const live = data.filter((d: { status: string }) => d.status === 'READY' || d.status === 'RUNNING').length;
          setActiveDeploymentsCount(live);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

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

  const cancelPairing = () => {
    stopActivePolling();
    setPairing(null);
    setIsExpired(false);
    setPairError(null);
  };

  const copyCode = async () => {
    if (!pairing) return;
    try {
      await navigator.clipboard.writeText(pairing.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleRevoke = async () => {
    if (!primary) return;
    setRevoking(true);
    try {
      await fetch(`${API_URL}/agents/${primary.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setRevokeOpen(false);
      await reload();
    } catch {
      // Failed to revoke
    } finally {
      setRevoking(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <Link href="/dashboard" className="hover:text-white transition">
          Dashboard
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-300">Agent</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              DeployX Agent
            </h1>
            {online === true ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Online
              </span>
            ) : online === false ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                Checking...
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {online === true
              ? 'Connected to your local machine. Deployments and Docker containers run directly on your hardware.'
              : 'The background worker on your computer that builds and runs projects in Docker.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void reload()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0d0f12] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
            title="Refresh agent status"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {online === true && (
            <button
              onClick={() => setRevokeOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
              title="Unlink agent"
            >
              <Unplug size={13} />
              <span>Unlink Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {online === true && primary ? (
        <div className="mt-6 space-y-6">
          {/* Agent Spec Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                MACHINE
              </span>
              <p className="mt-1 font-mono text-sm font-semibold text-white truncate" title={primary.name || primary.hostname || 'PC'}>
                {primary.name || primary.hostname || 'DESKTOP-PC'}
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                DOCKER ENGINE
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Ready</span>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                AGENT VERSION
              </span>
              <p className="mt-1 font-mono text-sm font-semibold text-white">
                v{primary.version || '0.1.2'}
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                LAST HEARTBEAT
              </span>
              <p className="mt-1 font-mono text-xs font-medium text-zinc-300 truncate">
                {primary.lastSeenAt ? formatDate(primary.lastSeenAt) : 'Just now'}
              </p>
            </div>
          </div>

          {/* Running workloads overview */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Layers size={14} />
                <span>PROJECTS HOSTED</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {projectCount ?? '—'}
                </span>
                <span className="text-xs text-zinc-500">total projects created</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Project code stays isolated on this machine. Only the temporary public tunnel is forwarded.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Activity size={14} />
                <span>ACTIVE CONTAINERS</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {activeDeploymentsCount ?? '—'}
                </span>
                <span className="text-xs text-zinc-500">live deployments</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Containers run inside Docker Desktop with auto-allocated local ports and Cloudflare tunnels.
              </p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5">
            <h3 className="text-sm font-semibold text-white">Runtime Architecture</h3>
            <div className="mt-3 space-y-2 text-xs font-mono text-zinc-400">
              <div className="flex items-center justify-between border-b border-white/[0.04] py-2">
                <span className="text-zinc-500">Agent Local Address</span>
                <span className="text-zinc-300">http://127.0.0.1:4100</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.04] py-2">
                <span className="text-zinc-500">Target Operating System</span>
                <span className="text-zinc-300">Windows 10 / 11 (x64)</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.04] py-2">
                <span className="text-zinc-500">Tunnel Provider</span>
                <span className="text-zinc-300">Cloudflare Quick Tunnels (*.trycloudflare.com)</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-500">Container Isolation</span>
                <span className="text-zinc-300">Docker Desktop WSL2 / Hyper-V Engine</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Disconnected State */
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-8 text-center max-w-xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111317] text-zinc-400">
              <Cpu size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              DeployX Agent is offline
            </h2>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Open the DeployX Agent on your PC and pair it with your account to enable builds and temporary public URLs.
            </p>

            {/* Pairing Box */}
            <div className="mt-6">
              {pairing ? (
                <div className="rounded-lg border border-white/[0.12] bg-[#08090a] p-5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    6-DIGIT PAIRING CODE
                  </span>

                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="font-mono text-3xl font-bold tracking-[0.25em] text-white">
                      {pairing.code}
                    </span>
                    <button
                      onClick={() => void copyCode()}
                      className="p-1 text-zinc-400 hover:text-white transition"
                      title="Copy code"
                    >
                      {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <p className="mt-2 text-[11px] text-zinc-400">
                    Enter this code in your DeployX Agent window. Code expires in{' '}
                    <span className="font-mono text-zinc-200">{Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={cancelPairing}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => void generateCode()}
                    disabled={pairLoading}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50 shadow-sm"
                  >
                    {pairLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                    <span>Connect Agent</span>
                  </button>

                  <Link
                    href="/download"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#111317] px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-white/20 hover:text-white transition"
                  >
                    <Download size={13} />
                    <span>Download DeployX Agent</span>
                  </Link>
                </div>
              )}

              {pairError && (
                <div className="mt-3 text-xs text-rose-400">{pairError}</div>
              )}
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 max-w-xl mx-auto">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              HOW TO CONNECT YOUR PC
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-zinc-300">
                  1
                </span>
                <p className="text-zinc-400">
                  Install <Link href="/download" className="text-white hover:underline">DeployX Agent for Windows</Link> and ensure <a href="https://docs.docker.com/desktop/setup/install/windows-install/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Docker Desktop</a> is running.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-zinc-300">
                  2
                </span>
                <p className="text-zinc-400">
                  Launch the DeployX Agent on your PC from your desktop shortcut or Start menu.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-zinc-300">
                  3
                </span>
                <p className="text-zinc-400">
                  Click <strong>Connect Agent</strong> above to generate a 6-digit pairing code and enter it into the Agent prompt.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-zinc-300">
                  4
                </span>
                <p className="text-zinc-400">
                  DeployX will verify Docker and automatically connect. Your computer is then ready to deploy projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Revoke Modal */}
      <ConfirmModal
        isOpen={revokeOpen}
        title="Unlink DeployX Agent"
        description="Are you sure you want to unlink this Agent? You will need to pair it again with a 6-digit code before creating new deployments on this PC."
        confirmText="Unlink Agent"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={revoking}
        onConfirm={() => void handleRevoke()}
        onCancel={() => setRevokeOpen(false)}
      />
    </main>
  );
}
