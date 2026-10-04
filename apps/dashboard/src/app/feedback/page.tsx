'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Rocket,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function FeedbackPage() {
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
        {/* Sensible Back Navigation */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>

        {/* Content Box */}
        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-8 shadow-xl">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            FEEDBACK & SUPPORT
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Help us improve DeployX.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            DeployX is in active beta. We prioritize feedback from students and independent developers to make self-hosted deployments fast, reliable, and effortless.
          </p>

          {/* 3 Feedback Cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {/* Report a bug */}
            <a
              href="https://github.com/Sunny-876/DeployX/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#08090a] p-4 hover:border-white/20 transition group"
            >
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-[#111317] text-rose-400">
                  <Bug size={16} />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-white group-hover:text-zinc-200">
                  Report a bug
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Encountered an issue with the Agent, Docker, or public URLs? Open an issue on GitHub.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
                <span>Open Issue</span>
                <ExternalLink size={10} />
              </div>
            </a>

            {/* Suggest an improvement */}
            <a
              href="https://github.com/Sunny-876/DeployX/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#08090a] p-4 hover:border-white/20 transition group"
            >
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-[#111317] text-amber-400">
                  <Lightbulb size={16} />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-white group-hover:text-zinc-200">
                  Suggest improvement
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Have ideas for framework support, logging, or the desktop agent? We want to hear them.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
                <span>Share Idea</span>
                <ExternalLink size={10} />
              </div>
            </a>

            {/* Beta limitations */}
            <Link
              href="/beta-limitations"
              className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#08090a] p-4 hover:border-white/20 transition group"
            >
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-[#111317] text-blue-400">
                  <Rocket size={16} />
                </div>
                <h3 className="mt-3 text-xs font-semibold text-white group-hover:text-zinc-200">
                  Beta limitations
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Understand the current single-agent architecture, tunnel lifecycle, and resource constraints.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
                <span>View Details</span>
                <ChevronRight size={12} />
              </div>
            </Link>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-white/[0.06] bg-[#08090a] p-4">
            <ShieldAlert size={16} className="text-zinc-400 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-200">Important:</span> Never post passwords, API secret keys, environment tokens, or proprietary credentials in public GitHub issues or feedback forms.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
