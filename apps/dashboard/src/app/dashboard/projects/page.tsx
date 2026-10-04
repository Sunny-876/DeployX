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
  Box,
  Activity,
  Cpu,
  Clock,
  Plus,
  BarChart3,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar,
  ArrowRight,
  Users,
} from 'lucide-react';
import { API_URL, formatDayOnly } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useAgents } from '../../../components/useAgents';

type DeploymentItem = {
  id: string;
  projectId: string;
  projectName: string;
  framework?: string | null;
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
  const { primary, online } = useAgents();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete project modal
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const [projRes, depRes] = await Promise.all([
        fetch(`${API_URL}/projects`, { cache: 'no-store', credentials: 'include' }),
        fetch(`${API_URL}/deployments`, { cache: 'no-store', credentials: 'include' }),
      ]);

      if (!projRes.ok) {
        throw new Error('Failed to load projects from DeployX API');
      }

      const projData = await projRes.json();
      const depData = depRes.ok ? await depRes.json() : [];

      setProjects(Array.isArray(projData) ? projData : []);
      setDeployments(Array.isArray(depData) ? depData : []);
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

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => {
    const latest =
      p.latestDeployment ||
      (p.deployments && p.deployments[0]) ||
      deployments.find((d) => d.projectId === p.id);
    return latest && (latest.status === 'READY' || latest.status === 'RUNNING') && latest.url;
  }).length;

  const todayStr = new Date().toDateString();
  const deploymentsToday = deployments.filter((d) => {
    try {
      return new Date(d.createdAt).toDateString() === todayStr;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Header Row (Screenshot 1) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Projects
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Everything you're currently running with DeployX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input with Ctrl K */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 sm:w-64 rounded-xl border border-white/[0.08] bg-[#0d0f14] pl-9 pr-14 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] select-none pointer-events-none">
              Ctrl K
            </kbd>
          </div>

          <button
            onClick={() => void fetchProjects(true)}
            disabled={loading || refreshing}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
            title="Refresh projects"
          >
            <RefreshCw
              size={12}
              className={refreshing ? 'animate-spin text-zinc-400' : ''}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/deploy"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
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

      {/* 4 Stat Cards Row (Screenshot 1) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Total Projects */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] text-zinc-300">
              <Box size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : totalProjects}
              </p>
              <p className="text-xs text-zinc-400">Total Projects</p>
            </div>
          </div>
          <BarChart3 size={16} className="text-zinc-600 hidden sm:block" />
        </div>

        {/* Card 2: Active Projects */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] text-zinc-300">
              <Play size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : activeProjects}
              </p>
              <p className="text-xs text-zinc-400">Active Projects</p>
            </div>
          </div>
        </div>

        {/* Card 3: Deployments Today */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] text-zinc-300">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white font-mono">
                {loading ? '—' : deploymentsToday}
              </p>
              <p className="text-xs text-zinc-400">Deployments Today</p>
            </div>
          </div>
        </div>

        {/* Card 4: Connected Agent */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#14161f] text-zinc-300">
              <Users size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white font-mono">
                {online ? '1' : '0'}
              </p>
              <p className="text-xs text-zinc-400">Connected Agent</p>
            </div>
          </div>
          <span
            className={`h-2 w-2 rounded-full ${
              online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'
            }`}
          />
        </div>
      </div>

      {/* Grid/List View Mode Toggle (Right aligned) */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setViewMode('grid')}
          className={`rounded-lg p-1.5 transition ${
            viewMode === 'grid'
              ? 'bg-white/[0.1] text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Grid view"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`rounded-lg p-1.5 transition ${
            viewMode === 'list'
              ? 'bg-white/[0.1] text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="List view"
        >
          <List size={16} />
        </button>
      </div>

      {/* Project Cards (Matching Screenshot 1) */}
      <div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-6 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0d0f14]/50 py-16 text-center">
            <Box size={32} className="mx-auto text-zinc-600 mb-2.5" />
            <h3 className="text-sm font-semibold text-white">
              {search ? 'No projects match your search' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-xs mx-auto">
              {search
                ? 'Try a different search keyword.'
                : 'Upload a ZIP project archive to start your first deployment.'}
            </p>
            {!search && (
              <Link
                href="/dashboard/deploy"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
              >
                <Plus size={13} />
                <span>Deploy Project</span>
              </Link>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {filteredProjects.map((project) => {
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
                  className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 hover:border-white/20 transition"
                >
                  <div>
                    {/* Header: Project Name, Framework Tag, More Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="text-base font-bold text-white hover:underline truncate"
                          >
                            {project.name}
                          </Link>
                          <span className="rounded-md bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                            {project.framework || latest?.framework || 'node'}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          {project.slug || `${project.name}-${project.id.slice(0, 8)}`}
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setDeleteTarget(project)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition"
                          title="Delete / Manage"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Status Row (No active URL / LIVE) */}
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isLive
                              ? 'bg-emerald-400'
                              : isPaused
                              ? 'bg-amber-400'
                              : 'bg-zinc-600'
                          }`}
                        />
                        {isLive && latest?.url ? (
                          <a
                            href={latest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-zinc-300 hover:text-white truncate max-w-[200px]"
                          >
                            {latest.url}
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-zinc-500">
                            No active URL
                          </span>
                        )}
                      </div>

                      <div>
                        {isLive ? (
                          <span className="font-mono text-xs font-semibold text-emerald-400">
                            LIVE
                          </span>
                        ) : isPaused ? (
                          <span className="font-mono text-xs font-semibold text-amber-400">
                            PAUSED
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-zinc-500">
                            Not deployed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Big Deploy Project CTA Button */}
                    <div className="mt-4">
                      <Link
                        href="/dashboard/deploy"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
                      >
                        <Rocket size={13} />
                        <span>Deploy Project</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Card Footer: Date on left, View Details link on right */}
                  <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar size={13} />
                      <span>{formatDayOnly(project.updatedAt || project.createdAt)}</span>
                    </div>

                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white transition"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Project"
        description={`Permanently delete "${deleteTarget?.name}"? All associated deployments and container states will be removed.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDeleteProject()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
