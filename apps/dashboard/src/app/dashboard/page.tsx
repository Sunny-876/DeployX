'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Pause,
  Play,
  Box,
  MoreHorizontal,
  Plus,
  FileText,
  Code2,
} from 'lucide-react';
import { API_URL, formatDate, formatDayOnly } from '../../lib/utils';
import { useAuth } from '../../lib/auth-context';
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
  const { user } = useAuth();
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

  const totalProjects = projects.length;
  const activeDeployments = deployments.filter(
    (d) => (d.status === 'READY' || d.status === 'RUNNING') && d.url,
  ).length;
  const pausedDeployments = deployments.filter(
    (d) => d.status === 'PAUSED',
  ).length;

  const recentDeployments = deployments.slice(0, 5);
  const displayName = user?.name?.trim() || 'Sunny';
  const firstName = displayName.split(' ')[0] || 'Sunny';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-white">{firstName}</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Your projects, deployments and Agent in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
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
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Rocket size={13} />
            <span>Deploy Project</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 3 Stat Cards with Sparkline Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* RUNNING Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                RUNNING
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-[#14161f] text-emerald-400">
              <Activity size={14} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : activeDeployments}
              </p>
              <p className="mt-1 text-xs text-zinc-400">Active public URLs</p>
            </div>

            {/* Sparkline Wave Chart (Green) */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path
                  d="M0 30 Q 20 35, 40 20 T 80 15 T 100 25"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* PAUSED Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                PAUSED
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-[#14161f] text-amber-400">
              <Pause size={14} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : pausedDeployments}
              </p>
              <p className="mt-1 text-xs text-zinc-400">Stopped containers</p>
            </div>

            {/* Sparkline Wave Chart (Amber) */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path
                  d="M0 25 Q 30 35, 50 15 T 90 28 T 100 20"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* PROJECTS Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                PROJECTS
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-[#14161f] text-blue-400">
              <Layers size={14} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : totalProjects}
              </p>
              <p className="mt-1 text-xs text-zinc-400">Managed codebases</p>
            </div>

            {/* Sparkline Wave Chart (Blue) */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path
                  d="M0 32 Q 25 15, 50 28 T 80 18 T 100 22"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Activity on Left, Agent on Right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Projects & Recent Activity */}
        <div className="space-y-6">
          {/* Your Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-semibold text-white">Your projects</h2>
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
              >
                <span>All projects</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-4 animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0d0f14]/50 p-8 text-center">
                <Box size={28} className="mx-auto text-zinc-600 mb-2.5" />
                <h3 className="text-xs font-semibold text-white">No projects yet</h3>
                <p className="mt-1 text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Deploy your first project from a ZIP file to see its container status and public URL.
                </p>
                <Link
                  href="/dashboard/deploy"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                >
                  <Plus size={13} />
                  <span>Deploy Project</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.slice(0, 4).map((project) => {
                  const latest =
                    project.latestDeployment ||
                    (project.deployments && project.deployments[0]) ||
                    deployments.find((d) => d.projectId === project.id);

                  const isLive =
                    latest &&
                    (latest.status === 'READY' || latest.status === 'RUNNING') &&
                    latest.url;
                  const isPaused = latest && latest.status === 'PAUSED';

                  return (
                    <div
                      key={project.id}
                      className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 hover:border-white/20 transition"
                    >
                      <div>
                        {/* Header: Icon, Name, Framework & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#14161f] text-zinc-300">
                              <Code2 size={15} />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/projects/${project.id}`}
                                className="block font-semibold text-xs text-white hover:underline truncate"
                              >
                                {project.name}
                              </Link>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2 py-0.2 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                  {project.framework || latest?.framework || 'node'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                            >
                              <MoreHorizontal size={14} />
                            </Link>
                          </div>
                        </div>

                        {/* Status & URL info */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <div className="truncate min-w-0">
                            {isLive && latest?.url ? (
                              <a
                                href={latest.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300 hover:text-white transition truncate max-w-full"
                              >
                                <span className="truncate">{latest.url}</span>
                                <ExternalLink size={10} className="shrink-0 text-zinc-500" />
                              </a>
                            ) : (
                              <span className="font-mono text-[11px] text-zinc-500">
                                No active URL
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 ml-2">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                LIVE
                              </span>
                            ) : isPaused ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                PAUSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                                Not deployed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer: Date & View Link */}
                      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-zinc-500">
                          {formatDayOnly(project.updatedAt || project.createdAt)}
                        </span>

                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white transition"
                        >
                          <span>View</span>
                          <ArrowRight size={11} />
                        </Link>
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
              <h2 className="text-sm font-semibold text-white">Recent activity</h2>
              <Link
                href="/dashboard/deployments"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
              >
                <span>All deployments</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-2xl border border-white/[0.06] bg-[#0d0f14] animate-pulse"
                  />
                ))}
              </div>
            ) : recentDeployments.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-[#14161f] text-zinc-400 mb-2.5">
                  <FileText size={18} />
                </div>
                <h3 className="text-xs font-semibold text-white">No recent activity recorded yet.</h3>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Your deployments and agent activity will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.07] bg-[#0d0f14] overflow-hidden">
                {recentDeployments.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/deployments/${d.id}`}
                    className="flex items-center justify-between p-3.5 text-xs transition hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={d.status} size="sm" showAnimation={false} />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate text-xs">
                          {d.projectName}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500 truncate">
                          {d.url || `#${d.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] text-zinc-500 shrink-0 ml-2">
                      {formatDate(d.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Agent Card */}
        <div>
          <AgentCard />
        </div>
      </div>
    </div>
  );
}
