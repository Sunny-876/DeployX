'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Layers,
  Activity,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pause,
  Play,
} from 'lucide-react';
import { API_URL, formatDate, formatDayOnly } from '../../lib/utils';
import { StatusBadge } from '../../components/StatusBadge';
import { AgentCard } from '../../components/AgentCard';

type DeploymentItem = {
  id: string;
  projectId: string;
  projectName: string;
  projectSlug?: string;
  framework?: string | null;
  status: string;
  url: string | null;
  port?: number | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectItem = {
  id: string;
  name: string;
  slug: string;
  framework: string | null;
  createdAt: string;
  updatedAt: string;
  deployments?: DeploymentItem[];
  latestDeployment?: DeploymentItem | null;
};

export default function DashboardHome() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const [projRes, depRes] = await Promise.all([
        fetch(`${API_URL}/projects`, { cache: 'no-store', credentials: 'include' }),
        fetch(`${API_URL}/deployments`, { cache: 'no-store', credentials: 'include' }),
      ]);

      if (!projRes.ok || !depRes.ok) {
        throw new Error('Failed to load dashboard data from API');
      }

      const [projData, depData] = await Promise.all([
        projRes.json(),
        depRes.json(),
      ]);

      setProjects(Array.isArray(projData) ? projData : []);
      setDeployments(Array.isArray(depData) ? depData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not connect to DeployX API at ${API_URL}.`,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Pause action directly from dashboard
  const handlePause = async (deploymentId: string) => {
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData(true);
      }
    } catch {}
    setActionLoading(null);
  };

  // Resume action directly from dashboard
  const handleResume = async (deploymentId: string) => {
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await loadData(true);
      }
    } catch {}
    setActionLoading(null);
  };

  const totalProjects = projects.length;
  const activeDeployments = deployments.filter(
    (d) =>
      d.status === 'READY' ||
      d.status === 'RUNNING' ||
      (d.url && d.url.includes('trycloudflare.com')),
  ).length;
  const pausedDeployments = deployments.filter(
    (d) => d.status === 'PAUSED',
  ).length;

  const recentDeployments = deployments.slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Your projects, deployments and Agent in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0d0f12] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw
              size={13}
              className={refreshing ? 'animate-spin text-zinc-400' : ''}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/deploy"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Rocket size={13} strokeWidth={2.5} />
            <span>Deploy Project</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Concise System Status Cards */}
      <div className="mt-6 grid grid-cols-3 gap-3.5">
        {/* Running */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Running
            </span>
            <Activity size={14} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? '—' : activeDeployments}
            </span>
            {activeDeployments > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Active public URLs</p>
        </div>

        {/* Paused */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Paused
            </span>
            <Pause size={14} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? '—' : pausedDeployments}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Stopped containers</p>
        </div>

        {/* Projects */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Projects
            </span>
            <Layers size={14} className="text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? '—' : totalProjects}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">Managed codebases</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_310px]">
        {/* Left Column: Your Projects & Recent Activity */}
        <div className="space-y-8">
          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Your projects
              </h2>
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                <span>All projects</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl border border-white/[0.06] bg-[#0d0f12] p-4 animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-8 text-center">
                <Layers size={28} className="mx-auto text-zinc-600 mb-2.5" />
                <h3 className="text-sm font-semibold text-zinc-200">
                  No projects deployed yet
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                  Deploy your first project from your computer to run it in Docker and generate a temporary public URL.
                </p>
                <Link
                  href="/dashboard/deploy"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                >
                  <Rocket size={13} />
                  <span>Deploy Project</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 4).map((p) => {
                  const latest = p.latestDeployment || p.deployments?.[0];
                  const isLive = latest?.status === 'READY';
                  const isPaused = latest?.status === 'PAUSED';

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4 transition hover:border-white/15"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="text-sm font-semibold text-white hover:underline truncate"
                          >
                            {p.name}
                          </Link>
                          {p.framework && (
                            <span className="shrink-0 rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                              {p.framework}
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center gap-2">
                          {latest ? (
                            <StatusBadge status={latest.status} size="sm" />
                          ) : (
                            <span className="text-[11px] text-zinc-500">Not deployed</span>
                          )}
                        </div>

                        {latest?.url ? (
                          <div className="mt-2">
                            <a
                              href={latest.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline truncate"
                            >
                              <span className="truncate">{latest.url}</span>
                              <ExternalLink size={10} className="shrink-0" />
                            </a>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] font-mono text-zinc-500">
                            {isPaused ? 'Paused — no active URL' : 'No active URL'}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">
                          {formatDayOnly(latest?.createdAt || p.updatedAt)}
                        </span>

                        <div className="flex items-center gap-2">
                          {isLive && latest && (
                            <button
                              onClick={() => void handlePause(latest.id)}
                              disabled={actionLoading === latest.id}
                              className="text-[11px] font-medium text-zinc-400 hover:text-white transition disabled:opacity-50"
                            >
                              Pause
                            </button>
                          )}
                          {isPaused && latest && (
                            <button
                              onClick={() => void handleResume(latest.id)}
                              disabled={actionLoading === latest.id}
                              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
                            >
                              Resume
                            </button>
                          )}
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="text-[11px] font-medium text-zinc-300 hover:text-white transition"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity Section */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Recent activity
              </h2>
              <Link
                href="/dashboard/deployments"
                className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                <span>All deployments</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0f12]">
              {loading ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  <Loader2 size={16} className="animate-spin mx-auto mb-2 text-zinc-500" />
                  <span>Loading recent activity...</span>
                </div>
              ) : recentDeployments.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500">
                  No recent activity recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {recentDeployments.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3.5 transition hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/deployments/${d.id}`}
                            className="text-xs font-semibold text-white hover:underline truncate"
                          >
                            {d.projectName}
                          </Link>
                          <StatusBadge status={d.status} size="sm" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500 font-mono truncate">
                          {d.url ? d.url : formatDate(d.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-zinc-400 hover:text-white transition"
                            title="Open URL"
                          >
                            <ArrowUpRight size={13} />
                          </a>
                        )}
                        <Link
                          href={`/dashboard/deployments/${d.id}`}
                          className="rounded border border-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.04] transition"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Agent Widget */}
        <aside className="space-y-4">
          <AgentCard />
        </aside>
      </div>
    </main>
  );
}
