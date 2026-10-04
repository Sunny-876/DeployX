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
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Globe,
  XCircle,
} from 'lucide-react';
import { API_URL, formatDate, truncateId } from '../../../../lib/utils';
import { StatusBadge } from '../../../../components/StatusBadge';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { DeploymentTerminal } from '../../../../components/DeploymentTerminal';

type DeploymentDetails = {
  id: string;
  agentDeploymentId?: string;
  status: string;
  url: string | null;
  localUrl?: string | null;
  port?: number | null;
  logs: string[];
  project?: {
    id: string;
    name: string;
    slug: string;
    framework?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export default function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = use(params);

  const [deployment, setDeployment] = useState<DeploymentDetails | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDeployment = async (isRefresh = false): Promise<DeploymentDetails | null> => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deploymentId}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      const data: DeploymentDetails = await res.json();
      setDeployment(data);
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch deployment details',
      );
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDeployment();
  }, [deploymentId]);

  // Live polling while in transitional state
  useEffect(() => {
    if (!deployment) return;
    const s = deployment.status;
    const shouldPoll =
      s === 'BUILDING' ||
      s === 'QUEUED' ||
      s === 'STARTING' ||
      s === 'RUNNING' ||
      s === 'CREATING_TUNNEL' ||
      s === 'RESUMING';

    if (!shouldPoll) return;

    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      const updated = await loadDeployment();
      if (
        updated &&
        (updated.status === 'READY' ||
          updated.status === 'PAUSED' ||
          updated.status === 'FAILED')
      ) {
        active = false;
      }
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deployment?.status, deploymentId]);

  const handlePause = async () => {
    if (!deployment) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deployment.id}/pause`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to pause deployment');
      }

      await loadDeployment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error pausing deployment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!deployment) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deployment.id}/resume`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to resume deployment');
      }

      await loadDeployment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resuming deployment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!deployment) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/deployments/${deployment.id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to cancel deployment');
      }

      await loadDeployment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cancelling deployment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deployment) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/deployments/${deployment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to delete deployment');
      }

      window.location.href = '/dashboard/deployments';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting deployment');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const copyUrl = async () => {
    if (!deployment?.url) return;
    try {
      await navigator.clipboard.writeText(deployment.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(deploymentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-20 text-center">
        <Loader2 size={24} className="animate-spin mx-auto text-zinc-500 mb-3" />
        <p className="text-xs font-mono text-zinc-400">Loading deployment details...</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="mx-auto max-w-5xl py-20 text-center">
        <AlertCircle size={32} className="mx-auto text-zinc-600 mb-3" />
        <h2 className="text-base font-semibold text-white">Deployment Not Found</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The requested deployment ID does not exist or has been removed.
        </p>
        <Link
          href="/dashboard/deployments"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-4 py-2 text-xs font-medium text-zinc-200 hover:border-white/20 transition"
        >
          <ChevronLeft size={14} />
          Back to Deployments
        </Link>
      </div>
    );
  }

  const currentStatus = deployment.status;
  const isReady = currentStatus === 'READY';
  const isPaused = currentStatus === 'PAUSED';
  const isFailed = currentStatus === 'FAILED';

  const isUploaded = !!deployment;
  const isBuilt =
    isReady ||
    isPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some(
      (l) =>
        l.includes('Build completed') ||
        l.includes('Compiled successfully') ||
        l.includes('Build finished') ||
        l.includes('Project ready') ||
        l.includes('Application started'),
    );
  const isRunning =
    isReady ||
    isPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some(
      (l) =>
        l.includes('Application healthy') ||
        l.includes('Application started') ||
        l.includes('Container running') ||
        l.includes('Ready in') ||
        l.includes('Health check passed'),
    );
  const isPublic = isReady && !!deployment.url;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard/deployments" className="hover:text-white transition">
          Deployments
        </Link>
        <ChevronRight size={12} />
        {deployment.project ? (
          <Link
            href={`/dashboard/projects/${deployment.project.id}`}
            className="hover:text-white transition"
          >
            {deployment.project.name}
          </Link>
        ) : (
          <span>Project</span>
        )}
        <ChevronRight size={12} />
        <span className="text-zinc-300 font-mono">{truncateId(deployment.id, 8)}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {deployment.project?.name || 'Project Deployment'}
            </h1>
            <StatusBadge status={deployment.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1 font-mono">
              <span className="text-zinc-500">ID:</span>
              <span className="text-zinc-300">{deployment.id}</span>
              <button
                onClick={() => void copyId()}
                className="p-0.5 text-zinc-500 hover:text-white transition"
                title="Copy deployment ID"
                aria-label="Copy deployment ID"
              >
                {copiedId ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
            <span>•</span>
            <span>Created {formatDate(deployment.createdAt)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => void loadDeployment(true)}
            disabled={refreshing || actionLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw
              size={13}
              className={refreshing ? 'animate-spin text-zinc-400' : ''}
            />
            <span>Refresh</span>
          </button>

          {/* Cancel */}
          {(currentStatus === 'BUILDING' || currentStatus === 'QUEUED') && (
            <button
              onClick={() => void handleCancel()}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin text-rose-400" />
              ) : (
                <XCircle size={13} />
              )}
              <span>Cancel</span>
            </button>
          )}

          {/* Pause */}
          {isReady && (
            <button
              onClick={() => void handlePause()}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin text-zinc-400" />
              ) : (
                <Pause size={13} />
              )}
              <span>Pause</span>
            </button>
          )}

          {/* Resume */}
          {isPaused && (
            <button
              onClick={() => void handleResume()}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin text-emerald-400" />
              ) : (
                <Play size={13} />
              )}
              <span>Resume</span>
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl border border-white/[0.08] bg-[#0d0f14] p-2 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
            title="Delete deployment"
            aria-label="Delete deployment"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Public URL Hero */}
      {deployment.url ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-[#0d0f14] p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                <Globe size={13} />
                <span>YOUR PUBLIC URL</span>
              </div>
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block font-mono text-base sm:text-lg font-semibold text-white hover:underline break-all"
              >
                {deployment.url}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void copyUrl()}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
              >
                {copiedUrl ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition shadow-sm"
              >
                <span>Open Project</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      ) : isPaused ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-200">Deployment Paused</p>
              <p className="text-zinc-400 mt-0.5">
                The local Docker container is stopped. Resume to restore the container and generate a live public URL.
              </p>
            </div>
          </div>

          <button
            onClick={() => void handleResume()}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition shrink-0"
          >
            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            <span>Resume</span>
          </button>
        </div>
      ) : isFailed ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">Deployment Failed</p>
            <p className="text-zinc-400 mt-0.5 leading-relaxed">
              The build process or container execution encountered an error. Inspect the live terminal logs below for details.
            </p>
          </div>
        </div>
      ) : null}

      {/* Pipeline Milestones */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Uploaded', done: isUploaded },
          { label: 'Built', done: isBuilt },
          { label: 'Running', done: isRunning },
          { label: 'Public', done: isPublic },
        ].map((step) => (
          <div
            key={step.label}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0d0f14] px-4 py-3"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                step.done
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border border-white/[0.06] bg-white/[0.02] text-zinc-600'
              }`}
            >
              {step.done ? (
                <Check size={13} strokeWidth={2.5} />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              )}
            </div>

            <div>
              <span
                className={`text-xs font-semibold ${
                  step.done ? 'text-zinc-200' : 'text-zinc-500'
                }`}
              >
                {step.label}
              </span>
              <p className="font-mono text-[10px] text-zinc-500">
                {step.done ? 'Completed' : 'Pending'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Meta Specs Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            PORT
          </span>
          <p className="mt-1 font-mono text-sm font-semibold text-white">
            {deployment.port ? deployment.port : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            FRAMEWORK
          </span>
          <p className="mt-1 font-mono text-sm font-semibold text-white">
            {deployment.project?.framework || 'Auto'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            RUNTIME STATUS
          </span>
          <p className="mt-1 font-mono text-sm font-semibold text-white">
            {currentStatus}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            UPDATED
          </span>
          <p className="mt-1 font-mono text-xs font-medium text-zinc-300 truncate">
            {formatDate(deployment.updatedAt)}
          </p>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div>
        <DeploymentTerminal
          logs={logs}
          status={deployment.status}
          projectName={deployment.project?.name}
          deploymentId={deployment.id}
        />
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Deployment"
        description={`Permanently delete deployment ${deployment.id}? Any running Docker container and Cloudflare tunnel will be terminated.`}
        confirmText="Delete Deployment"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
