'use client';

import Link from 'next/link';
import { ArrowLeft, Bug, MessageSquareText, Rocket } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Feedback</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Help us improve the beta.</h1>
          <p className="mt-4 text-base leading-8 text-zinc-300">
            We are running a small closed beta. Please report bugs or share ideas through the public GitHub issue tracker.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <a
              href="https://github.com/DeployX/DeployX/issues"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-[#0d0d11] p-5 transition hover:border-white/20 hover:bg-white/[0.02]"
            >
              <Bug className="text-zinc-200" size={18} />
              <h2 className="mt-4 text-lg font-semibold text-white">Report a bug</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Include the agent version, Docker version, deployment ID, and relevant logs.</p>
            </a>

            <Link href="/beta-limitations" className="rounded-2xl border border-white/10 bg-[#0d0d11] p-5 transition hover:border-white/20 hover:bg-white/[0.02]">
              <Rocket className="text-zinc-200" size={18} />
              <h2 className="mt-4 text-lg font-semibold text-white">Beta limitations</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Review the current closed-beta constraints before you deploy.</p>
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-7 text-amber-100">
            <div className="flex items-center gap-2 font-medium text-amber-200">
              <MessageSquareText size={16} />
              Keep reports safe
            </div>
            <p className="mt-2 text-amber-50/90">
              Do not include passwords, tokens, environment secrets, or database credentials in issue reports.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
