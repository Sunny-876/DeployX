'use client';

import { useEffect, useState, useRef, use } from 'react';
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
  Terminal,
  Cpu,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  Globe,
  Radio,
  XCircle,
} from 'lucide-react';
import { API_URL, formatDate, truncateId } from '../../../../lib/utils';
import { StatusBadge } from '../../../../components/StatusBadge';
import { ConfirmModal } from '../../../../components/ConfirmModal';

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

  const logEndRef = useRef<HTMLDivElement | null>(null);

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

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Pause action
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

  // Resume action
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

  // Cancel action
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

  // Delete action
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

      // Navigate back to history
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
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <Loader2 size={28} className="animate-spin mx-auto text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-400">Loading deployment details...</p>
      </main>
    );
  }

  if (!deployment) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <AlertCircle size={36} className="mx-auto text-zinc-600 mb-3" />
        <h2 className="text-lg font-semibold text-white">Deployment Not Found</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The requested deployment "{deploymentId}" could not be found.
        </p>
        <Link
          href="/dashboard/deployments"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
        >
          <ChevronLeft size={14} />
          Back to Deployments
        </Link>
      </main>
    );
  }

  const currentStatus = deployment.status;
  const isReady = currentStatus === 'READY';
  const isPaused = currentStatus === 'PAUSED';
  const isFailed = currentStatus === 'FAILED';
  const isPending =
    currentStatus === 'BUILDING' ||
    currentStatus === 'QUEUED' ||
    currentStatus === 'STARTING' ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    currentStatus === 'RESUMING';

  // Pipeline check marks
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
        <span className="text-zinc-300 font-mono truncate">{truncateId(deployment.id, 10)}</span>
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {deployment.project?.name || 'Project Deployment'}
            </h1>
            <StatusBadge status={deployment.status} size="lg" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-zinc-500">ID:</span>
              <span className="text-zinc-300">{deployment.id}</span>
              <button
                onClick={() => void copyId()}
                className="hover:text-white transition p-0.5"
                title="Copy deployment ID"
              >
                {copiedId ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
            <span>•</span>
            <span>Created {formatDate(deployment.createdAt)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => void loadDeployment(true)}
            disabled={refreshing || actionLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin text-zinc-400' : ''}
            />
            <span>Refresh</span>
          </button>

          {/* Cancel Deployment */}
          {(currentStatus === 'BUILDING' || currentStatus === 'QUEUED') && (
            <button
              onClick={() => void handleCancel()}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={14} className="animate-spin text-rose-400" />
              ) : (
                <XCircle size={14} />
              )}
              <span>Cancel Deployment</span>
            </button>
          )}

          {/* Pause */}
          {isReady && (
            <button
              onClick={() => void handlePause()}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={14} className="animate-spin text-zinc-400" />
              ) : (
                <Pause size={14} />
              )}
              <span>Pause</span>
            </button>
          )}

          {/* Resume */}
          {isPaused && (
            <button
              onClick={() => void handleResume()}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={14} className="animate-spin text-emerald-400" />
              ) : (
                <Play size={14} />
              )}
              <span>Resume</span>
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-2 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
            title="Delete deployment"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Pipeline Steps: Uploaded, Built, Running, Public */}
      <div className="mt-8">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Uploaded', done: isUploaded },
            { label: 'Built', done: isBuilt },
            { label: 'Running', done: isRunning },
            { label: 'Public', done: isPublic },
          ].map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4 shadow-sm"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  step.done
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/5 text-zinc-600'
                }`}
              >
                {step.done ? (
                  <Check size={16} />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-zinc-600" />
                )}
              </div>

              <div>
                <span
                  className={`text-sm font-semibold ${
                    step.done ? 'text-zinc-200' : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </span>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {step.done ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public URL Box */}
      {deployment.url ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Globe size={14} />
                <span>Live Public URL</span>
              </div>
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-mono text-base font-semibold text-white hover:underline break-all"
              >
                {deployment.url}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void copyUrl()}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
              >
                {copiedUrl ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
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
                <span>Open URL</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      ) : isPaused ? (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause size={18} />
            <div>
              <p className="font-semibold">Deployment is currently paused</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                The Docker container is paused and the Cloudflare tunnel is stopped. Resume to generate a new URL.
              </p>
            </div>
          </div>

          <button
            onClick={() => void handleResume()}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition"
          >
            {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            <span>Resume</span>
          </button>
        </div>
      ) : null}

      {/* Meta Specs Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Port
          </span>
          <p className="mt-1 font-mono text-base font-semibold text-white">
            {deployment.port ? deployment.port : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Framework
          </span>
          <p className="mt-1 font-mono text-base font-semibold text-white">
            {deployment.project?.framework || 'Auto'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Runtime Status
          </span>
          <p className="mt-1 font-mono text-base font-semibold text-white">
            {currentStatus}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Updated
          </span>
          <p className="mt-1 text-xs font-medium text-zinc-300 truncate">
            {formatDate(deployment.updatedAt)}
          </p>
        </div>
      </div>

      {/* Live Terminal / Log Viewer */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d0d10]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
            </div>
            <Terminal size={14} className="text-zinc-500" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-400">
              Live Terminal Logs
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isPending && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono">
                <Loader2 size={13} className="animate-spin" />
                <span>Live</span>
              </div>
            )}
            <span className="text-[11px] font-mono text-zinc-600">
              {logs.length} lines
            </span>
          </div>
        </div>

        <div className="h-80 overflow-y-auto p-4 font-mono text-xs leading-6 text-zinc-300 select-text">
          {logs.length === 0 ? (
            <div className="text-zinc-600">No output logs recorded.</div>
          ) : (
            logs.map((log, index) => (
              <div key={`${index}-${log}`} className="whitespace-pre-wrap">
                <span className="mr-2 text-zinc-700 select-none">$</span>
                <span>{log}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Deployment"
        description={`Permanently delete deployment ${deployment.id}? Any running Docker container and Cloudflare tunnel will be killed immediately.`}
        confirmText="Delete Deployment"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}
