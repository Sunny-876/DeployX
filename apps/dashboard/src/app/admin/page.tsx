'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  Loader2,
  Shield,
  Users,
  Server,
  TriangleAlert,
} from 'lucide-react';
import { API_URL } from '../../lib/utils';
import { useAuth } from '../../lib/auth-context';

type AdminOverview = {
  totalUsers: number;
  totalAgents: number;
  onlineAgents: number;
  totalProjects: number;
  activeDeployments: number;
  pausedDeployments: number;
  failedDeployments: number;
  staleAgents: number;
  lastUpdatedAt: string;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
  }>;
  recentDeployments: Array<{
    id: string;
    status: string;
    url: string | null;
    projectName: string;
    projectSlug: string;
    ownerEmail: string;
    ownerName: string;
    agentName: string;
    updatedAt: string;
  }>;
  recentLogs: Array<{
    id: string;
    message: string;
    createdAt: string;
    deploymentId: string;
    deploymentStatus: string;
    projectName: string;
  }>;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      setFetching(false);
      return;
    }

    const loadOverview = async () => {
      try {
        setFetching(true);
        setError(null);

        const res = await fetch(`${API_URL}/admin/overview`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Admin access is unavailable for this account.');
        }

        const data = (await res.json()) as AdminOverview;
        setOverview(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load admin overview.',
        );
      } finally {
        setFetching(false);
      }
    };

    void loadOverview();
  }, [loading, router, user]);

  if (loading || fetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
            Loading admin console
          </span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'ADMIN') {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center text-red-400">
            <Shield className="h-12 w-12" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-300">
            Access denied
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Administrator access required</h1>
          <p className="mt-3 text-sm text-zinc-300">
            This area is reserved for DeployX operations staff and is blocked for student accounts.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft size={16} />
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Admin Console</h1>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!overview ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Users className="h-4 w-4" />} label="Users" value={overview.totalUsers} />
            <StatCard icon={<Server className="h-4 w-4" />} label="Agents" value={`${overview.onlineAgents}/${overview.totalAgents}`} />
            <StatCard icon={<Activity className="h-4 w-4" />} label="Active deploys" value={overview.activeDeployments} />
            <StatCard icon={<TriangleAlert className="h-4 w-4" />} label="Stale agents" value={overview.staleAgents} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent users</h2>
                <span className="text-xs text-zinc-500">{overview.recentUsers.length} latest</span>
              </div>
              <div className="space-y-3">
                {overview.recentUsers.length === 0 ? (
                  <p className="text-sm text-zinc-500">No users registered yet.</p>
                ) : (
                  overview.recentUsers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.email}</p>
                      </div>
                      <div className="text-right text-xs text-zinc-400">
                        <div className="font-medium text-zinc-300">{item.role}</div>
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Health</h2>
                <span className="text-xs text-zinc-500">Live snapshot</span>
              </div>
              <div className="space-y-3 text-sm">
                <HealthRow label="Projects" value={overview.totalProjects} />
                <HealthRow label="Paused" value={overview.pausedDeployments} />
                <HealthRow label="Failed" value={overview.failedDeployments} />
                <HealthRow label="Updated" value={new Date(overview.lastUpdatedAt).toLocaleTimeString()} />
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Latest deployments</h2>
              <span className="text-xs text-zinc-500">Read-only status</span>
            </div>
            <div className="space-y-3">
              {overview.recentDeployments.length === 0 ? (
                <p className="text-sm text-zinc-500">No deployments have been reported yet.</p>
              ) : (
                overview.recentDeployments.map((deployment) => (
                  <div key={deployment.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{deployment.projectName}</p>
                        <p className="text-xs text-zinc-400">{deployment.ownerName} · {deployment.ownerEmail}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-300">
                        {deployment.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span>Agent: {deployment.agentName}</span>
                      <span>•</span>
                      <span>{deployment.url ? deployment.url : 'No public URL'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent deployment logs</h2>
              <span className="text-xs text-zinc-500">Last 8 entries</span>
            </div>
            <div className="space-y-3">
              {overview.recentLogs.length === 0 ? (
                <p className="text-sm text-zinc-500">No deployment logs recorded.</p>
              ) : (
                overview.recentLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-zinc-300">
                    <p className="font-medium text-white">{log.projectName}</p>
                    <p className="mt-1 text-zinc-400">{log.message}</p>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                      {log.deploymentStatus} · {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-lg">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs font-medium uppercase tracking-[0.16em]">{label}</span>
        <div className="text-zinc-500">{icon}</div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
