'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Rocket,
  RefreshCw,
  Loader2,
  AlertCircle,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { API_URL, formatDate, truncateId } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';
import { ConfirmModal } from '../../../components/ConfirmModal';

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

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeploymentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeployments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/deployments`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch deployments from DeployX API');
      }

      const data = await res.json();
      setDeployments(Array.isArray(data) ? data : []);
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
    void fetchDeployments();
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
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

      setDeployments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'An error occurred while deleting the deployment.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesSearch =
        d.projectName.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        (d.url && d.url.toLowerCase().includes(search.toLowerCase())) ||
        (d.framework && d.framework.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'READY') return d.status === 'READY';
      if (statusFilter === 'PAUSED') return d.status === 'PAUSED';
      if (statusFilter === 'FAILED') return d.status === 'FAILED';
      if (statusFilter === 'BUILDING') {
        return (
          d.status === 'BUILDING' ||
          d.status === 'QUEUED' ||
          d.status === 'STARTING' ||
          d.status === 'RUNNING' ||
          d.status === 'CREATING_TUNNEL' ||
          d.status === 'RESUMING'
        );
      }
      return true;
    });
  }, [deployments, search, statusFilter]);

  const buildingCount = deployments.filter(
    (d) =>
      d.status === 'BUILDING' ||
      d.status === 'QUEUED' ||
      d.status === 'STARTING' ||
      d.status === 'RUNNING' ||
      d.status === 'CREATING_TUNNEL' ||
      d.status === 'RESUMING',
  ).length;
  const readyCount = deployments.filter((d) => d.status === 'READY').length;
  const pausedCount = deployments.filter((d) => d.status === 'PAUSED').length;
  const failedCount = deployments.filter((d) => d.status === 'FAILED').length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Deployments
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Builds, runtime status and deployment history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void fetchDeployments(true)}
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

      {/* Search and Tabs Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search deployments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0d0f12] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/30"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.07] bg-[#0d0f12] p-1 text-xs">
          {[
            { id: 'ALL', label: 'All', count: deployments.length },
            { id: 'BUILDING', label: 'Building', count: buildingCount },
            { id: 'READY', label: 'Ready', count: readyCount },
            { id: 'PAUSED', label: 'Paused', count: pausedCount },
            { id: 'FAILED', label: 'Failed', count: failedCount },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded px-1 py-0.2 font-mono text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deployments List */}
      <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0f12]">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            <Loader2 size={18} className="animate-spin mx-auto mb-2 text-zinc-500" />
            <p>Loading deployments...</p>
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="py-16 text-center">
            <Cpu size={30} className="mx-auto text-zinc-600 mb-2.5" />
            <h3 className="text-sm font-semibold text-zinc-200">
              No deployments yet
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Deploy your first project to see its build logs, runtime status and public URL here.
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
          <div className="divide-y divide-white/[0.05]">
            {filteredDeployments.map((d) => {
              const isReady = d.status === 'READY';
              const hasUrl = !!d.url;

              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/deployments/${d.id}`}
                        className="text-sm font-semibold text-white hover:underline truncate"
                      >
                        {d.projectName}
                      </Link>
                      <StatusBadge status={d.status} size="sm" />
                      {d.framework && (
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                          {d.framework}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {hasUrl ? (
                        <div className="flex items-center gap-1 font-mono text-emerald-400">
                          <a
                            href={d.url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate max-w-[260px] sm:max-w-[340px]"
                          >
                            {d.url}
                          </a>
                          <button
                            onClick={() => void copyToClipboard(d.url!, `url-${d.id}`)}
                            className="text-zinc-500 hover:text-white transition p-0.5"
                            title="Copy URL"
                          >
                            {copiedId === `url-${d.id}` ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[11px]">
                          No active URL
                        </span>
                      )}

                      <span className="text-zinc-700">•</span>
                      <span className="text-zinc-500 text-[11px]">
                        {formatDate(d.createdAt)}
                      </span>
                      <span className="text-zinc-700 hidden sm:inline">•</span>

                      <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                        <span>{truncateId(d.id, 8)}</span>
                        <button
                          onClick={() => void copyToClipboard(d.id, `id-${d.id}`)}
                          className="hover:text-zinc-300 transition"
                          title="Copy ID"
                        >
                          {copiedId === `id-${d.id}` ? (
                            <Check size={10} className="text-emerald-400" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isReady && hasUrl && (
                      <a
                        href={d.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                      >
                        <span>Open</span>
                        <ArrowUpRight size={12} />
                      </a>
                    )}

                    <Link
                      href={`/dashboard/deployments/${d.id}`}
                      className="rounded border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-white/[0.04] transition"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Deployment"
        description={`Are you sure you want to delete deployment for "${deleteTarget?.projectName}" (${deleteTarget?.id})? Any running container and tunnel will be terminated.`}
        confirmText="Delete Deployment"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
