'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Pause,
  Play,
  Rocket,
  Loader2,
  AlertCircle,
  Cpu,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { API_URL, formatDate, formatDayOnly, truncateId } from '../../../../lib/utils';
import { StatusBadge } from '../../../../components/StatusBadge';
import { ConfirmModal } from '../../../../components/ConfirmModal';

type DeploymentItem = {
  id: string;
  projectId: string;
  projectName?: string;
  status: string;
  url: string | null;
  port?: number | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectDetails = {
  id: string;
  name: string;
  slug: string;
  framework: string | null;
  branch: string;
  repository?: string | null;
  createdAt: string;
  updatedAt: string;
  deployments: DeploymentItem[];
  latestDeployment?: DeploymentItem | null;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<DeploymentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProject = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setActionError(null);

    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Project ${projectId} not found`);
      }

      const data: ProjectDetails = await res.json();
      setProject(data);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to fetch project details',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  // Pause action
  const handlePause = async (deploymentId: string) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to pause deployment');
      }

      await loadProject(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Error pausing deployment',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Resume action
  const handleResume = async (deploymentId: string) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to resume deployment');
      }

      await loadProject(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Error resuming deployment',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Delete action
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/deployments/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to delete deployment');
      }

      setDeleteTarget(null);
      await loadProject(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Error deleting deployment',
      );
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <Loader2 size={28} className="animate-spin mx-auto text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-400">Loading project details...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <AlertCircle size={36} className="mx-auto text-zinc-600 mb-3" />
        <h2 className="text-lg font-semibold text-white">Project Not Found</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The requested project "{projectId}" does not exist in the database.
        </p>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
        >
          <ChevronLeft size={14} />
          Back to Projects
        </Link>
      </main>
    );
  }

  const latest = project.latestDeployment || project.deployments?.[0];
  const isReady = latest?.status === 'READY';
  const isPaused = latest?.status === 'PAUSED';
  const history = project.deployments || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/dashboard/projects"
          className="hover:text-white transition"
        >
          Projects
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-300 font-medium truncate">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {project.name}
            </h1>
            {project.framework && (
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-zinc-300">
                {project.framework}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-mono text-zinc-500">
              <GitBranch size={13} />
              <span>{project.branch || 'main'}</span>
            </div>
            <span>•</span>
            <span className="font-mono text-zinc-500">{project.slug}</span>
            <span>•</span>
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadProject(true)}
            disabled={refreshing || actionLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
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
            <span>New Deployment</span>
          </Link>
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Latest Deployment Hero Card */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Latest Deployment
        </h2>

        {latest ? (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] p-6 shadow-xl relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Status and URL details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <StatusBadge status={latest.status} size="lg" />
                  <span className="text-xs text-zinc-500 font-mono">
                    ID: {truncateId(latest.id, 10)}
                  </span>
                </div>

                <div className="mt-2">
                  <span className="text-xs font-medium text-zinc-400 block mb-1">
                    Public URL:
                  </span>
                  {latest.url ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={latest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-mono font-medium text-emerald-400 hover:underline flex items-center gap-1.5 break-all"
                      >
                        <span>{latest.url}</span>
                        <ExternalLink size={14} className="shrink-0" />
                      </a>

                      <button
                        onClick={() => void copyUrl(latest.url!)}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-zinc-400 hover:text-white transition"
                        title="Copy public URL"
                      >
                        {copiedUrl ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-zinc-500">
                      {isPaused ? 'Deployment is paused. Resume to generate a new live URL.' : 'No active public URL'}
                    </p>
                  )}
                </div>

                {latest.port && (
                  <p className="mt-2 text-xs font-mono text-zinc-500">
                    Container Port: {latest.port}
                  </p>
                )}
              </div>

              {/* Action Buttons: Open, Pause, Resume */}
              <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                {/* Open */}
                {isReady && latest.url && (
                  <a
                    href={latest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
                  >
                    <span>Open</span>
                    <ArrowUpRight size={15} />
                  </a>
                )}

                {/* Pause Button */}
                {isReady && (
                  <button
                    onClick={() => void handlePause(latest.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin text-zinc-400" />
                    ) : (
                      <Pause size={15} />
                    )}
                    <span>Pause</span>
                  </button>
                )}

                {/* Resume Button */}
                {isPaused && (
                  <button
                    onClick={() => void handleResume(latest.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin text-emerald-400" />
                    ) : (
                      <Play size={15} />
                    )}
                    <span>Resume</span>
                  </button>
                )}

                {/* View Details Link */}
                <Link
                  href={`/dashboard/deployments/${latest.id}`}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center text-zinc-500">
            No deployments for this project yet.
          </div>
        )}
      </div>

      {/* Deployment History Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Deployment History
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {history.length} {history.length === 1 ? 'version' : 'versions'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] shadow-xl">
          {history.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No historical deployments found.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {history.map((d, index) => {
                const deploymentNumber = history.length - index;
                const isItemReady = d.status === 'READY';
                return (
                  <div
                    key={d.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: Deployment info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-zinc-400 font-mono text-xs font-semibold">
                        #{deploymentNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            Deployment #{deploymentNumber}
                          </span>
                          <StatusBadge status={d.status} size="sm" />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono">
                          <span>{truncateId(d.id, 8)}</span>
                          <span>•</span>
                          <span>{formatDate(d.createdAt)}</span>
                          {d.url && (
                            <>
                              <span>•</span>
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white transition flex items-center gap-1 truncate max-w-[200px] sm:max-w-[300px]"
                              >
                                <span className="truncate">{d.url}</span>
                                <ExternalLink size={10} />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isItemReady && d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
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

                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-1.5 text-zinc-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        title="Delete deployment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Deployment"
        description={`Are you sure you want to delete this deployment (${deleteTarget?.id})? Any associated Docker container and Cloudflare tunnel will be permanently stopped.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
