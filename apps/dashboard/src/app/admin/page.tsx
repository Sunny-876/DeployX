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
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            Loading admin console...
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
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-lg border border-rose-500/20 bg-[#0d0f12] p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center text-rose-400">
            <Shield className="h-10 w-10" />
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-400">
            ACCESS RESTRICTED
          </span>
          <h1 className="mt-2 text-xl font-bold text-white">Administrator Access Required</h1>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            This area is restricted to system administrators and operator accounts.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
          >
            <ArrowLeft size={13} />
            <span>Return to dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            OPERATIONS CONSOLE
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Admin Overview</h1>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0d0f12] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
        >
          <ArrowLeft size={13} />
          <span>Back to dashboard</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          {error}
        </div>
      )}

      {!overview ? null : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Users className="h-4 w-4" />} label="Users" value={overview.totalUsers} />
            <StatCard icon={<Server className="h-4 w-4" />} label="Agents" value={`${overview.onlineAgents}/${overview.totalAgents}`} />
            <StatCard icon={<Activity className="h-4 w-4" />} label="Active deploys" value={overview.activeDeployments} />
            <StatCard icon={<TriangleAlert className="h-4 w-4" />} label="Stale agents" value={overview.staleAgents} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Recent Users</h2>
                <span className="font-mono text-[11px] text-zinc-500">{overview.recentUsers.length} total</span>
              </div>
              <div className="space-y-2">
                {overview.recentUsers.length === 0 ? (
                  <p className="text-xs text-zinc-500">No users registered yet.</p>
                ) : (
                  overview.recentUsers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#08090a] px-3 py-2 text-xs">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-zinc-500 font-mono text-[11px]">{item.email}</p>
                      </div>
                      <div className="text-right text-[11px] text-zinc-400 font-mono">
                        <div className="font-semibold text-zinc-300">{item.role}</div>
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">System Health</h2>
                <span className="font-mono text-[11px] text-zinc-500">Live</span>
              </div>
              <div className="space-y-2 text-xs">
                <HealthRow label="Total Projects" value={overview.totalProjects} />
                <HealthRow label="Paused Deploys" value={overview.pausedDeployments} />
                <HealthRow label="Failed Deploys" value={overview.failedDeployments} />
                <HealthRow label="Last Telemetry Sync" value={new Date(overview.lastUpdatedAt).toLocaleTimeString()} />
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Latest Deployments</h2>
              <span className="font-mono text-[11px] text-zinc-500">Global</span>
            </div>
            <div className="space-y-2">
              {overview.recentDeployments.length === 0 ? (
                <p className="text-xs text-zinc-500">No deployments reported yet.</p>
              ) : (
                overview.recentDeployments.map((deployment) => (
                  <div key={deployment.id} className="rounded-lg border border-white/[0.04] bg-[#08090a] p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{deployment.projectName}</p>
                        <p className="text-zinc-500 text-[11px]">{deployment.ownerName} · {deployment.ownerEmail}</p>
                      </div>
                      <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-300">
                        {deployment.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span>Agent: {deployment.agentName}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{deployment.url ? deployment.url : 'No public URL'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent Deployment Activity</h2>
              <span className="font-mono text-[11px] text-zinc-500">Latest 8 entries</span>
            </div>
            <div className="space-y-2">
              {overview.recentLogs.length === 0 ? (
                <p className="text-xs text-zinc-500">No deployment logs recorded.</p>
              ) : (
                overview.recentLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-white/[0.04] bg-[#08090a] p-3 text-xs text-zinc-300">
                    <p className="font-medium text-white">{log.projectName}</p>
                    <p className="mt-1 text-zinc-400 font-mono text-[11px]">{log.message}</p>
                    <div className="mt-1.5 font-mono text-[10px] uppercase text-zinc-500">
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
    <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
        <div className="text-zinc-500">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#08090a] px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-200">{value}</span>
    </div>
  );
}
