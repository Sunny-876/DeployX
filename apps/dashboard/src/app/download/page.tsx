import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Cpu, Download, ShieldCheck } from 'lucide-react';

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-white">
              <Cpu size={20} />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">DeployX Agent</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">For Windows</h1>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Run your projects locally, connect your private Docker runtime, and share a temporary public link from your own PC.
          </p>

          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-medium text-amber-200">
              <Download size={16} />
              Windows installer — coming soon
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-50/90">
              A public download artifact is not hosted yet, so this page explains the installation flow without inventing a URL.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Windows</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Designed for the standard student Windows workflow.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Docker Desktop</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Must be installed and running before the agent can build projects.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 size={16} className="text-emerald-400" /> Internet connection</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Required for the agent to reach the DeployX API and public tunnel service.</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-emerald-400" />
              <p className="text-sm leading-7 text-emerald-100">
                <span className="font-semibold text-white">Local-only execution:</span> the DeployX cloud service does not execute your project code. Builds and containers run on your own PC, while DeployX manages the dashboard and public tunnel.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              View setup steps
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04]">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
