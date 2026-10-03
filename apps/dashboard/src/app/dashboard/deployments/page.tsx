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

  // Filtered list
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

  const readyCount = deployments.filter((d) => d.status === 'READY').length;
  const pausedCount = deployments.filter((d) => d.status === 'PAUSED').length;
  const failedCount = deployments.filter((d) => d.status === 'FAILED').length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Deployments
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time deployment history, active tunnels, and container lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchDeployments(true)}
            disabled={loading || refreshing}
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
            <span>Deploy Project</span>
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search by project, ID, or tunnel URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111114] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition focus:border-white/30 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#111114] p-1 text-xs">
          {[
            { id: 'ALL', label: 'All', count: deployments.length },
            { id: 'READY', label: 'Ready', count: readyCount },
            { id: 'PAUSED', label: 'Paused', count: pausedCount },
            { id: 'FAILED', label: 'Failed', count: failedCount },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                  active
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
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
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 size={26} className="animate-spin mb-3" />
            <p className="text-sm">Loading deployments...</p>
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="py-20 text-center">
            <Cpu size={36} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              {search || statusFilter !== 'ALL'
                ? 'No matching deployments found'
                : 'No deployments found'}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search terms or filter criteria.'
                : 'Deploy your first project using the Deploy Project button.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredDeployments.map((d) => {
              const isReady = d.status === 'READY';
              const hasUrl = !!d.url;

              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                >
                  {/* Left: Project info + metadata */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-zinc-300">
                      <Cpu size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/deployments/${d.id}`}
                          className="font-semibold text-white hover:underline text-base truncate"
                        >
                          {d.projectName}
                        </Link>

                        <StatusBadge status={d.status} size="sm" />

                        {d.framework && (
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
                            {d.framework}
                          </span>
                        )}
                      </div>

                      {/* URL & Timestamp row */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {hasUrl ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={d.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-zinc-300 hover:text-white transition flex items-center gap-1 truncate max-w-[280px] sm:max-w-[400px]"
                            >
                              <span>{d.url}</span>
                              <ExternalLink size={12} className="shrink-0 text-zinc-500" />
                            </a>
                            <button
                              onClick={() => void copyToClipboard(d.url!, `url-${d.id}`)}
                              className="text-zinc-500 hover:text-white transition p-0.5"
                              title="Copy URL"
                            >
                              {copiedId === `url-${d.id}` ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono">
                            No active URL
                          </span>
                        )}

                        <span className="text-zinc-700">•</span>

                        <span className="text-zinc-500 font-medium">
                          {formatDate(d.createdAt)}
                        </span>

                        <span className="text-zinc-700 hidden sm:inline">•</span>

                        {/* Deployment ID badge */}
                        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                          <span>{truncateId(d.id, 8)}</span>
                          <button
                            onClick={() => void copyToClipboard(d.id, `id-${d.id}`)}
                            className="hover:text-zinc-300 transition"
                            title="Copy Deployment ID"
                          >
                            {copiedId === `id-${d.id}` ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Open Public URL button */}
                    {isReady && hasUrl && (
                      <a
                        href={d.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                      >
                        <span>Open</span>
                        <ArrowUpRight size={13} />
                      </a>
                    )}

                    {/* View Details */}
                    <Link
                      href={`/dashboard/deployments/${d.id}`}
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
                    >
                      View
                    </Link>

                    {/* Delete deployment */}
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-2 text-zinc-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      title="Delete deployment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Deployment"
        description={`Are you sure you want to delete deployment for "${deleteTarget?.projectName}" (${deleteTarget?.id})? Any running Docker container and Cloudflare tunnel will be terminated immediately.`}
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
