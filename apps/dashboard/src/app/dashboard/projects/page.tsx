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
  Cpu,
} from 'lucide-react';
import { API_URL, formatDayOnly } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';

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

  const fetchProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/projects`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load projects from API');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your apps, view multi-deployment history, and inspect tunnel status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchProjects(true)}
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

      {/* Search Input */}
      <div className="mt-8 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search projects by name or framework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111114] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 size={26} className="animate-spin mb-3" />
            <p className="text-sm">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111114] py-20 text-center">
            <Layers size={36} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              {search ? 'No projects match your search' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {search
                ? 'Try a different search keyword.'
                : 'Upload your first ZIP project to get started.'}
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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const deploymentList = p.deployments || [];
              const depCount = deploymentList.length;
              const latest = p.latestDeployment || deploymentList[0];
              const isReady = latest?.status === 'READY';
              const lastDeployedDate = formatDayOnly(latest?.createdAt || p.updatedAt);

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 transition-all hover:border-white/20 hover:bg-[#131317] shadow-xl"
                >
                  <div>
                    {/* Top Row: Title & Framework */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="text-lg font-semibold tracking-tight text-white hover:underline truncate block"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs font-mono text-zinc-500 truncate">
                          {p.slug}
                        </p>
                      </div>

                      {p.framework && (
                        <span className="shrink-0 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-zinc-300">
                          {p.framework}
                        </span>
                      )}
                    </div>

                    {/* Latest Deployment Info */}
                    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span className="text-[11px] uppercase tracking-wider font-medium text-zinc-500">
                          Latest Deployment
                        </span>
                        {latest ? (
                          <StatusBadge status={latest.status} size="sm" />
                        ) : (
                          <span className="text-zinc-600">None</span>
                        )}
                      </div>

                      {latest?.url ? (
                        <a
                          href={latest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white truncate"
                        >
                          <span className="truncate">{latest.url}</span>
                          <ExternalLink size={11} className="shrink-0 text-zinc-500" />
                        </a>
                      ) : (
                        <p className="text-xs text-zinc-600 font-mono">
                          {latest ? 'No active public URL' : 'Awaiting first build'}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={13} className="text-zinc-500" />
                        <span>
                          {depCount} {depCount === 1 ? 'deployment' : 'deployments'}
                        </span>
                      </div>
                      <div>
                        <span>Last deployed: </span>
                        <span className="text-zinc-400 font-medium">{lastDeployedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-white hover:text-zinc-300 transition"
                    >
                      <span>View</span>
                      <ChevronRight size={14} />
                    </Link>

                    <Link
                      href="/dashboard/deploy"
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition"
                    >
                      New Deploy
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
