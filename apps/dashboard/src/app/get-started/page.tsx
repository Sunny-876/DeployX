'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, LayoutGrid, Rocket, ShieldCheck } from 'lucide-react';

const steps = [
  { label: 'Step 1', title: 'Create your DeployX account', description: 'Sign up from the public site and land in the dashboard.' },
  { label: 'Step 2', title: 'Download the DeployX Agent', description: 'Get the Windows installer and install it on your PC.' },
  { label: 'Step 3', title: 'Install and open the Agent', description: 'Start the local agent and make sure Docker is running.' },
  { label: 'Step 4', title: 'Connect your account', description: 'Pair the Agent with your DeployX account using the code shown in the dashboard.' },
  { label: 'Step 5', title: 'Deploy your first project', description: 'Upload a project and let your computer build and share it.' },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Get started</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Deploy your first project in five steps.</h1>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {steps.map((step) => (
              <div key={step.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">{step.label}</div>
                <h2 className="mt-3 text-lg font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-5">
              <LayoutGrid className="text-zinc-200" size={18} />
              <h3 className="mt-4 text-lg font-semibold text-white">Create account</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Register with your email and open the dashboard.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-5">
              <Download className="text-zinc-200" size={18} />
              <h3 className="mt-4 text-lg font-semibold text-white">Install Agent</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Download the Windows Agent and make sure Docker Desktop is running.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-5">
              <ShieldCheck className="text-zinc-200" size={18} />
              <h3 className="mt-4 text-lg font-semibold text-white">Deploy safely</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Your project builds locally and is exposed through a temporary public URL.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Create account
              <ArrowRight size={16} />
            </Link>
            <Link href="/download" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04]">
              <Rocket size={15} />
              Download Agent
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
