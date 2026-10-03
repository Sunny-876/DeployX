'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const limitations = [
  'Temporary public URLs are expected; they are not permanent hosting.',
  'The DeployX Agent must remain online while the deployment is active.',
  'The project stops when the student PC is shut down or disconnected.',
  'Docker Desktop is required for the local project runtime.',
  'Windows Agent support is the current public target, and the workflow is not a full multi-platform hosting service.',
  'Quick Tunnel URLs are designed for temporary sharing and are not custom-domain hosting.',
  'No permanent hosting, custom domain, or production availability guarantees are included in this beta.',
];

export default function BetaLimitationsPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-200">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Beta limitations</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Current closed-beta constraints</h1>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {limitations.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-[#0d0d11] p-4 text-sm leading-7 text-zinc-200">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
