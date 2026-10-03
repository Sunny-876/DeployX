'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Layers,
  Cpu,
  Activity,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pause,
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

  const totalProjects = projects.length;
  const totalDeployments = deployments.length;
  const activeDeployments = deployments.filter(
    (d) =>
      d.status === 'READY' ||
      d.status === 'RUNNING' ||
      (d.url && d.url.includes('trycloudflare.com')),
  ).length;
  const pausedDeployments = deployments.filter(
    (d) => d.status === 'PAUSED',
  ).length;

  const recentDeployments = deployments.slice(0, 6);
  const recentProjects = projects.slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time overview of projects, deployments, and Cloudflare tunnels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin text-zinc-400' : ''}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/deploy"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Rocket size={15} strokeWidth={2.5} />
            <span>Deploy New Project</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Statistics Overview Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Projects count */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Projects
            </span>
            <Layers size={16} className="text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                totalProjects
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Managed codebases</p>
        </div>

        {/* Deployments count */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Deployments
            </span>
            <Cpu size={16} className="text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                totalDeployments
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Historical builds</p>
        </div>

        {/* Active deployments */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#111114] p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Active Deployments
            </span>
            <Activity size={16} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                activeDeployments
              )}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-xs text-zinc-500">Live with public URLs</p>
        </div>

        {/* Paused deployments */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#111114] p-5 shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Paused
            </span>
            <Pause size={16} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                pausedDeployments
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Tunnel stopped / ready to resume</p>
        </div>
      </div>

      {/* Recent Deployments Table */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Recent Deployments
            </h2>
            <Link
              href="/dashboard/deployments"
              className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              <span>View all deployments</span>
              <ChevronRight size={14} />
            </Link>
          </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <Loader2 size={24} className="animate-spin mb-2" />
              <p className="text-xs">Loading deployments from database...</p>
            </div>
          ) : recentDeployments.length === 0 ? (
            <div className="py-16 text-center">
              <Cpu size={32} className="mx-auto text-zinc-600 mb-3" />
              <h3 className="text-base font-medium text-zinc-300">
                No deployments yet
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Deploy your first project to see deployment history here.
              </p>
              <Link
                href="/dashboard/deploy"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
              >
                <Rocket size={14} />
                Deploy Project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentDeployments.map((d) => {
                const isReady = d.status === 'READY';
                return (
                  <div
                    key={d.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-zinc-300">
                        <Cpu size={16} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/deployments/${d.id}`}
                            className="font-medium text-white hover:underline text-sm"
                          >
                            {d.projectName}
                          </Link>
                          {d.framework && (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                              {d.framework}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          {d.url ? (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-zinc-400 hover:text-white transition font-mono truncate max-w-[260px] sm:max-w-[340px]"
                            >
                              <span>{d.url}</span>
                              <ExternalLink size={11} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="text-zinc-600 font-mono">No active URL</span>
                          )}
                          <span>•</span>
                          <span>{formatDate(d.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                      <StatusBadge status={d.status} size="sm" />

                      <div className="flex items-center gap-2">
                        {isReady && d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
                          >
                            <span>Open</span>
                            <ArrowUpRight size={12} />
                          </a>
                        )}

                        <Link
                          href={`/dashboard/deployments/${d.id}`}
                          className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
        <aside className="lg:pt-[36px]">
          <AgentCard />
        </aside>
      </div>

      {/* Recent Projects Section */}
      <div className="mt-10 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Projects
          </h2>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            <span>View all projects</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl border border-white/5 bg-[#111114] p-5 animate-pulse"
              />
            ))
          ) : recentProjects.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center text-zinc-500 text-sm">
              No projects created yet.
            </div>
          ) : (
            recentProjects.map((p) => {
              const depCount = p.deployments?.length || 0;
              const latest = p.latestDeployment;
              return (
                <div
                  key={p.id}
                  className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-5 transition hover:border-white/20 hover:bg-white/[0.02] shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white group-hover:text-zinc-200 truncate">
                        {p.name}
                      </h3>
                      {p.framework && (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
                          {p.framework}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {latest ? (
                        <StatusBadge status={latest.status} size="sm" />
                      ) : (
                        <span className="text-[11px] text-zinc-500">
                          Not deployed
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">
                        {depCount} {depCount === 1 ? 'build' : 'builds'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      Last deployed: {formatDayOnly(latest?.createdAt || p.updatedAt)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>View Project</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
