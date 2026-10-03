'use client';

import Link from 'next/link';
import { ArrowLeft, Terminal, Cpu, CheckCircle2, Download, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition mb-8"
      >
        <ArrowLeft size={14} />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header */}
      <div className="border-b border-white/[0.08] pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <Cpu size={20} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">DeployX Agent</h1>
        </div>
        <p className="text-sm text-zinc-400 max-w-2xl mt-2 leading-relaxed">
          The DeployX Agent is a lightweight local daemon that connects your computer and Docker runtime to your DeployX account. Your project builds and containers run exclusively on your PC.
        </p>
      </div>

      {/* Security note */}
      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-300 leading-relaxed">
          <span className="font-semibold text-white">Zero Cloud Execution:</span> The DeployX cloud server never executes your project code. All npm installs, Next.js/Vite builds, and Docker containers remain strictly isolated on your local machine.
        </div>
      </div>

      {/* Prerequisites */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Prerequisites</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Node.js v20+</span>
            </div>
            <p className="text-xs text-zinc-400">Required to run the local agent runtime service.</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Docker Desktop</span>
            </div>
            <p className="text-xs text-zinc-400">Must be running locally with WSL2 or native engine.</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>cloudflared</span>
            </div>
            <p className="text-xs text-zinc-400">Generates temporary public HTTPS URLs for projects.</p>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Setup & Running the Agent</h2>
        
        <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-5 font-mono text-xs text-zinc-300 space-y-4">
          <div>
            <span className="text-zinc-500"># 1. Clone or download DeployX repository</span>
            <div className="mt-1 text-emerald-400 select-all">git clone https://github.com/deployx/deployx.git</div>
          </div>

          <div>
            <span className="text-zinc-500"># 2. Install workspace dependencies</span>
            <div className="mt-1 text-emerald-400 select-all">cd deployx && pnpm install</div>
          </div>

          <div>
            <span className="text-zinc-500"># 3. Start the local Agent daemon</span>
            <div className="mt-1 text-emerald-400 select-all">pnpm --filter agent start</div>
          </div>

          <div>
            <span className="text-zinc-500"># 4. Open the local pairing interface in your browser:</span>
            <div className="mt-1 text-sky-400 select-all">http://localhost:4100</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <h3 className="text-sm font-medium text-white">Ready to connect?</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Once your agent is running on port 4100, generate a pairing code in your dashboard and paste it into the agent interface.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
        >
          <span>Open Dashboard to Pair</span>
        </Link>
      </div>
    </main>
  );
}
