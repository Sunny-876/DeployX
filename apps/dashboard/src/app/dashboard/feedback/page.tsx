'use client';

import Link from 'next/link';
import {
  Bug,
  Lightbulb,
  Rocket,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

export default function DashboardFeedbackPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-zinc-300">Feedback</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Help us improve DeployX
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          DeployX is actively evolving. We prioritize feedback from developers and students to refine local containerization, live streaming terminal UX, and public tunnels.
        </p>
      </div>

      {/* 3 Core Feedback Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Report a bug */}
        <a
          href="https://github.com/Sunny-876/DeployX/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 hover:border-white/20 transition group"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
              <Bug size={18} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white group-hover:text-zinc-200">
              Report a bug
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Encountered an issue with Docker detection, agent pairing, or Cloudflare tunnels? Report it on GitHub.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-mono text-zinc-500 group-hover:text-zinc-300">
            <span>Open Issue</span>
            <ExternalLink size={12} />
          </div>
        </a>

        {/* Suggest an improvement */}
        <a
          href="https://github.com/Sunny-876/DeployX/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 hover:border-white/20 transition group"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Lightbulb size={18} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white group-hover:text-zinc-200">
              Suggest improvement
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Have suggestions for framework auto-detection, keyboard workflows, or runtime settings?
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-mono text-zinc-500 group-hover:text-zinc-300">
            <span>Share Idea</span>
            <ExternalLink size={12} />
          </div>
        </a>

        {/* Beta limitations */}
        <Link
          href="/beta-limitations"
          className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 hover:border-white/20 transition group"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Rocket size={18} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white group-hover:text-zinc-200">
              Beta limitations
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Review current single-machine agent scope, temporary public URLs, and compute requirements.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1 text-xs font-mono text-zinc-500 group-hover:text-zinc-300">
            <span>View Architecture</span>
            <ChevronRight size={13} />
          </div>
        </Link>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5">
        <ShieldAlert size={18} className="text-zinc-400 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-zinc-400">
          <span className="font-semibold text-zinc-200">Security note:</span> Never paste private passwords, API keys, environment credentials, or token secrets in issue reports.
        </div>
      </div>
    </div>
  );
}
