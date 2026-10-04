'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Rocket,
  RefreshCw,
  Loader2,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { API_URL, formatDayOnly } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';
import { ConfirmModal } from '../../../components/ConfirmModal';

type DeploymentItem = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectItem = {
  id: string;
  name: string;
  slug: string;
  framework: string | null;
  branch: string;
  createdAt: string;
  updatedAt: string;
  deployments?: DeploymentItem[];
  latestDeployment?: DeploymentItem | null;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete project modal
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/projects`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load projects from DeployX API');
      }

      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to DeployX API at ' + API_URL,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const handlePause = async (deploymentId: string) => {
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchProjects(true);
      }
    } catch {}
    setActionLoading(null);
  };

  const handleResume = async (deploymentId: string) => {
    setActionLoading(deploymentId);
    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchProjects(true);
      }
    } catch {}
    setActionLoading(null);
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/projects/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {}
    setDeleting(false);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.framework && p.framework.toLowerCase().includes(q))
      );
    });
  }, [projects, search]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Projects
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Everything you're currently running with DeployX.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void fetchProjects(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0d0f12] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
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

      {/* Error banner */}
      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0d0f12] py-2 pl-9 pr-3.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/30"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border border-white/[0.06] bg-[#0d0f12] p-5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] py-16 text-center">
            <Layers size={30} className="mx-auto text-zinc-600 mb-2.5" />
            <h3 className="text-sm font-semibold text-zinc-200">
              {search ? 'No projects match your search' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              {search
                ? 'Try a different project name or framework keyword.'
                : 'Deploy your first project from your computer to get started.'}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const deploymentList = p.deployments || [];
              const latest = p.latestDeployment || deploymentList[0];
              const isRunning = latest?.status === 'READY';
              const isPaused = latest?.status === 'PAUSED';

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-white/[0.07] bg-[#0d0f12] p-5 transition hover:border-white/15"
                >
                  <div>
                    {/* Title & Framework */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="text-base font-semibold text-white hover:underline truncate block"
                        >
                          {p.name}
                        </Link>
                        <p className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                          {p.slug}
                        </p>
                      </div>

                      {p.framework && (
                        <span className="shrink-0 rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                          {p.framework}
                        </span>
                      )}
                    </div>

                    {/* Status & URL */}
                    <div className="mt-4 rounded-lg border border-white/[0.05] bg-[#08090a] p-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Status
                        </span>
                        {latest ? (
                          <StatusBadge status={latest.status} size="sm" />
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">None</span>
                        )}
                      </div>

                      {latest?.url ? (
                        <a
                          href={latest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline truncate mt-1"
                        >
                          <span className="truncate">{latest.url}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      ) : (
                        <p className="text-[11px] font-mono text-zinc-500 mt-1">
                          {isPaused ? 'Paused — no active tunnel' : 'No active URL'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">
                      {formatDayOnly(latest?.createdAt || p.updatedAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Live controls */}
                      {isRunning && latest && (
                        <>
                          <a
                            href={latest.url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-black hover:bg-zinc-200 transition"
                          >
                            <span>Open</span>
                            <ArrowUpRight size={11} />
                          </a>
                          <button
                            onClick={() => void handlePause(latest.id)}
                            disabled={actionLoading === latest.id}
                            className="rounded border border-white/10 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.05] transition disabled:opacity-50"
                          >
                            Pause
                          </button>
                        </>
                      )}

                      {/* Paused controls */}
                      {isPaused && latest && (
                        <>
                          <button
                            onClick={() => void handleResume(latest.id)}
                            disabled={actionLoading === latest.id}
                            className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                          >
                            <Play size={10} />
                            <span>Resume</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white transition ml-1"
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All associated deployments and historical logs will be permanently deleted.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDeleteProject()}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
