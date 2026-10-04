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

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeploymentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

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
      setActionError(err instanceof Error ? err.message : 'Error pausing deployment');
    } finally {
      setActionLoading(false);
    }
  };

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
      setActionError(err instanceof Error ? err.message : 'Error resuming deployment');
    } finally {
      setActionLoading(false);
    }
  };

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
      setActionError(err instanceof Error ? err.message : 'Error deleting deployment');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to delete project');
      }
      window.location.href = '/dashboard/projects';
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error deleting project');
      setDeletingProject(false);
      setDeleteProjectOpen(false);
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
      <div className="mx-auto max-w-6xl py-20 text-center">
        <Loader2 size={24} className="animate-spin mx-auto text-zinc-500 mb-2.5" />
        <p className="text-xs text-zinc-400 font-mono">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center">
        <AlertCircle size={32} className="mx-auto text-zinc-600 mb-2.5" />
        <h2 className="text-base font-semibold text-white">Project Not Found</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The requested project "{projectId}" does not exist.
        </p>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
        >
          <ChevronLeft size={13} />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const latest = project.latestDeployment || project.deployments?.[0];
  const isReady = latest?.status === 'READY';
  const isPaused = latest?.status === 'PAUSED';
  const history = project.deployments || [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard/projects" className="hover:text-white transition">
          Projects
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-300 font-medium truncate">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {project.name}
            </h1>
            {project.framework && (
              <span className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
                {project.framework}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1 font-mono text-zinc-400 text-xs">
              <GitBranch size={13} />
              <span>{project.branch || 'main'}</span>
            </div>
            <span>•</span>
            <span className="font-mono text-xs text-zinc-500">{project.slug}</span>
            <span>•</span>
            <span className="text-xs text-zinc-500">Created {formatDate(project.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadProject(true)}
            disabled={refreshing || actionLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
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
            <Rocket size={13} strokeWidth={2.5} />
            <span>New Deployment</span>
          </Link>

          <button
            onClick={() => setDeleteProjectOpen(true)}
            className="rounded-xl border border-white/[0.08] bg-[#0d0f14] p-2 text-zinc-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
            title="Delete Project"
            aria-label="Delete Project"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Latest Deployment Hero Card */}
      <div>
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Latest Deployment
        </h2>

        {latest ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <StatusBadge status={latest.status} size="md" />
                  <span className="font-mono text-xs text-zinc-500">
                    ID: {truncateId(latest.id, 10)}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                    Public URL:
                  </span>
                  {latest.url ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={latest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-medium text-emerald-400 hover:underline flex items-center gap-1.5 break-all"
                      >
                        <span>{latest.url}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>

                      <button
                        onClick={() => void copyUrl(latest.url!)}
                        className="rounded-lg border border-white/10 bg-white/[0.04] p-1 text-zinc-400 hover:text-white transition"
                        title="Copy URL"
                      >
                        {copiedUrl ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-zinc-500">
                      {isPaused ? 'Deployment is paused. Resume to open a public URL.' : 'No active public URL'}
                    </p>
                  )}
                </div>

                {latest.port && (
                  <p className="mt-2 text-xs font-mono text-zinc-500">
                    Container Port: {latest.port}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t border-white/[0.05] md:border-0">
                {isReady && latest.url && (
                  <a
                    href={latest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
                  >
                    <span>Open</span>
                    <ArrowUpRight size={13} />
                  </a>
                )}

                {isReady && (
                  <button
                    onClick={() => void handlePause(latest.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.05] transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Pause size={12} />
                    )}
                    <span>Pause</span>
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={() => void handleResume(latest.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    <span>Resume</span>
                  </button>
                )}

                <Link
                  href={`/dashboard/deployments/${latest.id}`}
                  className="rounded-xl border border-white/10 bg-[#14161f] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-8 text-center text-xs text-zinc-500">
            No deployments recorded for this project yet.
          </div>
        )}
      </div>

      {/* Deployment History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Deployment History
          </h2>
          <span className="font-mono text-xs text-zinc-500">
            {history.length} {history.length === 1 ? 'version' : 'versions'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14]">
          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No historical deployments found.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {history.map((d, index) => {
                const deploymentNumber = history.length - index;
                const isItemReady = d.status === 'READY';
                return (
                  <div
                    key={d.id}
                    className="flex flex-col gap-2 p-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] font-mono text-xs font-semibold text-zinc-400">
                        #{deploymentNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            Deployment #{deploymentNumber}
                          </span>
                          <StatusBadge status={d.status} size="sm" />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
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
                                className="text-emerald-400 hover:underline transition truncate max-w-[220px]"
                              >
                                {d.url}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isItemReady && d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-zinc-200 transition shadow-sm"
                        >
                          Open
                        </a>
                      )}

                      <Link
                        href={`/dashboard/deployments/${d.id}`}
                        className="rounded-xl border border-white/10 bg-[#14161f] px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white transition"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition"
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

      {/* Confirmation Modal - Delete Deployment */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Deployment"
        description={`Are you sure you want to delete this deployment (${deleteTarget?.id})? Any associated Docker container and Cloudflare tunnel will be permanently stopped.`}
        confirmText="Delete Deployment"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Modal - Delete Project */}
      <ConfirmModal
        isOpen={deleteProjectOpen}
        title="Delete Project"
        description={`Are you sure you want to delete project "${project.name}" (${project.id})? All associated deployments and historical logs will be permanently removed.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deletingProject}
        onConfirm={() => void handleDeleteProject()}
        onCancel={() => setDeleteProjectOpen(false)}
      />
    </div>
  );
}
