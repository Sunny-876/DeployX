'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  Globe,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from 'lucide-react';

const steps = [
  {
    title: 'Connect your PC',
    description: 'Install the DeployX Agent and connect your computer to your account.',
  },
  {
    title: 'Deploy your project',
    description: 'Upload your app from the dashboard and let your PC build it locally.',
  },
  {
    title: 'Share the link',
    description: 'DeployX gives you a temporary public URL that anyone can open.',
  },
];

const features = [
  {
    title: 'Local runtime',
    description: 'Your project runs on your own computer, not in a cloud VM.',
    icon: Rocket,
  },
  {
    title: 'Temporary public URL',
    description: 'Generate a shareable link with a Cloudflare Quick Tunnel in seconds.',
    icon: Globe,
  },
  {
    title: 'Student friendly',
    description: 'Built for portfolios, demos, hackathons, and class projects.',
    icon: Sparkles,
  },
  {
    title: 'Docker isolation',
    description: 'Each project runs in a clean container on the machine you control.',
    icon: Layers3,
  },
  {
    title: 'Live logs',
    description: 'Watch your build and runtime details from the dashboard as they happen.',
    icon: TimerReset,
  },
  {
    title: 'Free to start',
    description: 'No VPS or domain setup required for the standard local deployment flow.',
    icon: ShieldCheck,
  },
];

const useCases = [
  'Final-year projects',
  'Hackathon builds',
  'Portfolio projects',
  'College assignments',
  'Startup prototypes',
  'Team demos',
];

const faqs = [
  {
    question: 'What is DeployX?',
    answer: 'DeployX is a student-first platform for running local projects and sharing them with a temporary public URL from your own computer.',
  },
  {
    question: 'Where does my project run?',
    answer: 'On your own PC. DeployX coordinates the local Docker runtime and creates the public tunnel, but the project itself stays on your machine.',
  },
  {
    question: 'Do I need Docker?',
    answer: 'Yes. Docker Desktop is required to build and run your projects locally with the DeployX Agent.',
  },
  {
    question: 'Is the public URL permanent?',
    answer: 'No. The URL is temporary and is generated using Cloudflare Quick Tunnels for sharing during the active deployment.',
  },
  {
    question: 'Does DeployX host my project?',
    answer: 'No. DeployX does not host your project code in the cloud. It connects your machine to the dashboard and exposes the running app via a temporary tunnel.',
  },
  {
    question: 'What operating systems are supported?',
    answer: 'This public experience targets the Windows Agent workflow. Docker Desktop must be installed and running on the student’s PC.',
  },
];

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('https://example-123.trycloudflare.com');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-sm">
              <Rocket size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Deploy<span className="text-zinc-400">X</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/feedback" className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white sm:inline-flex">
              Feedback
            </Link>
            <Link href="/login" className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white sm:inline-flex">
              Login
            </Link>
            <Link href="/get-started" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              <Workflow size={14} />
              Student projects. One link.
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Share what you built.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              Deploy your project from your own PC, get a temporary public URL, and share it with anyone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                Start Deploying
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04]">
                See How It Works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Free to start</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Docker-based builds</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Built for students</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111114] p-5 shadow-2xl shadow-black/30">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                <span>Flow</span>
                <span>Local</span>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">Local project</div>
                  <div className="mt-2 text-sm text-white">Portfolio app / student build</div>
                </div>
                <div className="flex justify-center text-zinc-500">
                  <ChevronRight size={18} />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">DeployX Agent</div>
                  <div className="mt-2 text-sm text-white">Builds and manages Docker runtime</div>
                </div>
                <div className="flex justify-center text-zinc-500">
                  <ChevronRight size={18} />
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">Public URL</div>
                  <div className="mt-2 text-sm text-white">https://example-123.trycloudflare.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-[#101013]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Simple workflow. Real deployment.</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-[#111114] p-6">
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-black">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Why DeployX</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built for the way students ship.</h2>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/beta-limitations" className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-500/40 hover:bg-amber-500/10">
            Beta limitations
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-[#111114] p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-100">
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101013]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Built for student work</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Made for demos, portfolios, and labs.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[#111114] px-4 py-3 text-sm text-zinc-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-[#111114] p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Public URL preview</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Project is live.</h2>
            </div>

            <div className="w-full lg:max-w-xl">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Project</div>
                    <div className="mt-2 text-2xl font-semibold text-white">BluePeak</div>
                  </div>
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200">
                    Live
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#0d0d11] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Public URL</div>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-mono text-sm text-zinc-200 break-all">https://example-123.trycloudflare.com</div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                        <Copy size={13} />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <a href="https://example-123.trycloudflare.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200">
                        <Globe size={13} />
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#101013]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Your PC does the heavy lifting</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">DeployX does not need to run your app on its own servers.</h2>
              <p className="mt-5 text-base leading-8 text-zinc-300">
                The DeployX Agent runs on your PC and manages Docker, local builds, runtime health, logs, and the temporary public tunnel.
              </p>
              <div className="mt-8">
                <Link href="/download" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                  <Download size={15} />
                  Get the Agent
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#111114] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Docker</div>
                  <div className="mt-3 text-lg font-semibold text-white">Builds locally</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Tunnel</div>
                  <div className="mt-3 text-lg font-semibold text-white">Temporary URL</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Logs</div>
                  <div className="mt-3 text-lg font-semibold text-white">Live status</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Security</div>
                  <div className="mt-3 text-lg font-semibold text-white">Local-only execution</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything students need to know.</h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-2xl border border-white/10 bg-[#111114] p-5">
              <h3 className="text-base font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0b0b0d]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
                <Rocket size={16} strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-white">DeployX</span>
            </div>
            <p className="mt-3 max-w-md text-xs leading-6 text-zinc-500">
              DeployX creates temporary public URLs using Cloudflare Quick Tunnels. Your project runs on your own computer, and the public URL is only a shareable access point.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-400">
            <Link href="/get-started" className="transition hover:text-white">Get Started</Link>
            <Link href="/download" className="transition hover:text-white">Agent</Link>
            <Link href="/beta-limitations" className="transition hover:text-white">Beta limitations</Link>
            <Link href="/feedback" className="transition hover:text-white">Feedback</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
