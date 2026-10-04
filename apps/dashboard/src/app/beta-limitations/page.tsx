'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, ShieldAlert, Cpu, Globe, Check } from 'lucide-react';

const limitations = [
  {
    title: 'Temporary Public URLs',
    desc: 'Public URLs generated via Cloudflare Quick Tunnels (*.trycloudflare.com) are ephemeral. They are intended for demonstration, client testing, and portfolio reviews—not permanent production hosting.',
  },
  {
    title: 'Host PC Dependency',
    desc: 'Because project builds and containers run on your personal computer, the deployment remains accessible only while your PC is awake, connected to the internet, and running the DeployX Agent.',
  },
  {
    title: 'Docker Desktop Prerequisite',
    desc: 'DeployX builds and executes projects inside isolated Docker containers on your PC. Docker Desktop with the Linux container engine must remain running.',
  },
  {
    title: 'Windows Agent Architecture',
    desc: 'The current client release is optimized for 64-bit Windows 10 and 11. Multi-tenant cloud execution is intentionally avoided to preserve local developer ownership.',
  },
  {
    title: 'Resource Allocation',
    desc: 'Build speed and container performance depend directly on your computer hardware specifications (CPU, RAM, disk I/O, and upload bandwidth).',
  },
];

export default function BetaLimitationsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsAuthenticated(document.cookie.includes('deployx_token'));
    }
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push(isAuthenticated ? '/dashboard' : '/');
    }
  };

  return (
    <main className="min-h-screen bg-[#08090a] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>

        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              BETA NOTICE
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            DeployX Beta Architecture & Limitations
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            DeployX is engineered as a personal cloud for developers: your machine builds and hosts your project, while DeployX handles orchestration and public tunneling. Here are the core runtime constraints.
          </p>

          <div className="mt-8 space-y-3">
            {limitations.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-white/[0.06] bg-[#08090a] p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <h3 className="text-xs font-semibold text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 pl-3.5">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">
              DeployX Engine v0.1.2
            </span>
            <Link
              href="/dashboard/deploy"
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
            >
              Deploy Project
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
