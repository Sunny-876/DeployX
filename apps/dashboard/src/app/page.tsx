'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  Download,
  ExternalLink,
  Globe,
  Layers,
  Lock,
  Pause,
  Rocket,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react';

const useCases = [
  {
    title: 'Portfolio Projects',
    desc: 'Share interactive web apps on your resume without paying monthly VPS bills.',
  },
  {
    title: 'College & Class Projects',
    desc: 'Demonstrate semester work live in front of professors and classmates.',
  },
  {
    title: 'Hackathon Demos',
    desc: 'Generate a public link in seconds to present your prototype to judges.',
  },
  {
    title: 'Full-Stack Apps',
    desc: 'Run multi-tier apps with private local containers and expose only the frontend.',
  },
  {
    title: 'React & Next.js Projects',
    desc: 'Compile production bundles locally and stream live build logs to the browser.',
  },
  {
    title: 'Node.js & Python APIs',
    desc: 'Host REST or GraphQL endpoints directly from your dev machine.',
  },
];

const reasons = [
  {
    tag: 'PRIVACY',
    title: 'Your code stays on your PC',
    desc: 'DeployX manages the control plane and tunnels. Your actual source code and data never leave your computer.',
    icon: Lock,
  },
  {
    tag: 'ISOLATION',
    title: 'Local Docker runtime',
    desc: 'Every project compiles and runs inside a clean, isolated container on the hardware you already own.',
    icon: Layers,
  },
  {
    tag: 'CONNECTIVITY',
    title: 'Temporary public URL',
    desc: 'Instant Cloudflare Quick Tunnels expose your local container port to the world with a secure HTTPS link.',
    icon: Globe,
  },
  {
    tag: 'COST',
    title: 'No VPS or hosting bills',
    desc: 'Eliminate expensive cloud bills for demos and schoolwork. Zero credit card or subscription required.',
    icon: Zap,
  },
  {
    tag: 'OBSERVABILITY',
    title: 'Real-time terminal logs',
    desc: 'Watch dependency installation, compilation steps, and container logs stream live into your dashboard.',
    icon: Terminal,
  },
  {
    tag: 'CONTROL',
    title: 'Pause and resume anytime',
    desc: 'Halt containers and tunnels with one click when you finish presenting to free up laptop CPU and RAM.',
    icon: Pause,
  },
];

const faqs = [
  {
    q: 'What is DeployX?',
    a: 'DeployX is a personal deployment platform for students and developers. It connects your computer to a cloud control plane, builds your project locally in Docker, and provides a temporary public URL via Cloudflare Quick Tunnels.',
  },
  {
    q: 'Where does my project code actually run?',
    a: 'On your own computer. DeployX does not execute your project code on cloud servers. The DeployX Agent runs locally, manages Docker containers, and establishes the tunnel.',
  },
  {
    q: 'Do I need Docker Desktop?',
    a: 'Yes. Docker Desktop is required on your PC so the DeployX Agent can safely build and isolate your applications in standard containers.',
  },
  {
    q: 'Are the public URLs permanent?',
    a: 'No. The URLs are temporary Cloudflare Quick Tunnels designed for demos, grading, reviews, and hackathon judging while your computer is online.',
  },
  {
    q: 'What happens when I pause a deployment?',
    a: 'DeployX pauses the local Docker container and tears down the Cloudflare tunnel. Your computer uses zero resources while paused, and you can resume anytime with a fresh link.',
  },
  {
    q: 'What operating systems are supported?',
    a: 'DeployX officially supports Windows 10 and 11 (64-bit) with Docker Desktop. An official Windows installer is available directly on our download page.',
  },
];

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('https://bluepeak-demo.trycloudflare.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#ededef]">
      {/* 1. PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090a]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black shadow-sm">
              <Rocket size={14} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Deploy<span className="text-zinc-400">X</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden items-center gap-7 text-xs font-medium text-zinc-400 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/feedback"
              className="hidden text-xs font-medium text-zinc-400 transition hover:text-white sm:inline-block"
            >
              Feedback
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Personal Cloud for Developers</span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
              Deploy your projects <br />
              <span className="text-zinc-400">from your own PC.</span>
            </h1>

            <p className="mt-5 text-lg font-medium text-zinc-200">
              Get a temporary public URL. Share it with anyone.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              Your project runs locally on your computer using Docker. DeployX manages the dashboard, deployment lifecycle, and temporary Cloudflare Quick Tunnel. No expensive cloud hosting, no VPS, and no permanent domain required.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                See how it works
              </a>
            </div>

            {/* Value bullets */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                Local Docker runtime
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                Cloudflare Quick Tunnels
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                Zero cloud hosting fees
              </span>
            </div>
          </div>

          {/* Right Column: Sophisticated Architecture Flow */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-5 shadow-2xl">
            <div className="rounded-xl border border-white/[0.06] bg-[#08090a] p-5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                <span>Architecture</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Local Control
                </span>
              </div>

              {/* Node 1: User's PC */}
              <div className="mt-5 rounded-lg border border-white/10 bg-[#0d0f12] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">YOUR PC</span>
                  <span className="font-mono text-[10px] text-zinc-400">Local Machine</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Windows 10 / 11 with Docker Desktop running
                </p>
              </div>

              <div className="my-2 flex justify-center text-zinc-600">
                <ChevronDown size={16} />
              </div>

              {/* Node 2: Agent */}
              <div className="rounded-lg border border-white/10 bg-[#0d0f12] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">DeployX Agent</span>
                  <span className="font-mono text-[10px] text-emerald-400">v0.1.2 Online</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Communicates status & manages container lifecycle
                </p>
              </div>

              <div className="my-2 flex justify-center text-zinc-600">
                <ChevronDown size={16} />
              </div>

              {/* Node 3: Docker Runtime */}
              <div className="rounded-lg border border-white/10 bg-[#0d0f12] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Docker Container</span>
                  <span className="font-mono text-[10px] text-zinc-400">Isolated</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Next.js, Node, Python, or static project builds
                </p>
              </div>

              <div className="my-2 flex justify-center text-zinc-600">
                <ChevronDown size={16} />
              </div>

              {/* Node 4: Public URL */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300">Temporary Public URL</span>
                  <span className="font-mono text-[10px] text-emerald-400">HTTPS Live</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-emerald-200 truncate">
                  https://demo-portfolio.trycloudflare.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "YOUR COMPUTER DOES THE HEAVY LIFTING" SECTION */}
      <section id="how-it-works" className="border-t border-white/[0.07] bg-[#0b0d10] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Your computer does the heavy lifting.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Instead of renting an expensive server in the cloud, DeployX coordinates your PC’s local CPU and Docker runtime to host your application on demand.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: '01',
                title: 'Install DeployX Agent',
                desc: 'Download the lightweight Windows installer and launch it on your PC.',
              },
              {
                step: '02',
                title: 'Connect your account',
                desc: 'Pair your agent securely using the six-digit code in your dashboard.',
              },
              {
                step: '03',
                title: 'Upload your project',
                desc: 'Drop a ZIP archive of your repository straight into the web dashboard.',
              },
              {
                step: '04',
                title: 'Builds locally',
                desc: 'DeployX Agent automatically detects your framework and builds in Docker.',
              },
              {
                step: '05',
                title: 'Public URL ready',
                desc: 'Get an instant Cloudflare Quick Tunnel link to share with anyone.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-4 transition hover:border-white/15"
              >
                <span className="font-mono text-xs font-semibold text-zinc-500">
                  {item.step}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. "BUILT FOR STUDENTS & DEVELOPERS" USE CASES */}
      <section className="border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Use Cases
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Built for students and independent developers.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Everything you build deserves a live demonstration, not a static screenshot or a dead localhost link.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <div
                key={u.title}
                className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-5 transition hover:border-white/15"
              >
                <h3 className="text-sm font-semibold text-white">{u.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {u.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. "WHY DEPLOYX?" FEATURES SECTION */}
      <section id="features" className="border-t border-white/[0.07] bg-[#0b0d10] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Core Architecture
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Why DeployX?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Purpose-built tools designed for simplicity, privacy, and speed.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-5 transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                      {r.tag}
                    </span>
                    <Icon size={16} className="text-zinc-400" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. PUBLIC URL PREVIEW SHOWCASE */}
      <section className="border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  Live Preview
                </p>
                <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                  Share your link with anyone.
                </h3>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400">
                  Once your local container is healthy, DeployX creates an instant Cloudflare Quick Tunnel and provides a public HTTPS URL.
                </p>
              </div>

              <div className="w-full lg:max-w-lg">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        Project
                      </span>
                      <p className="text-base font-semibold text-white">BluePeak Portfolio</p>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                      LIVE
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#08090a] px-3.5 py-2">
                    <span className="font-mono text-xs text-zinc-300 truncate">
                      https://bluepeak-demo.trycloudflare.com
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopy}
                        className="rounded p-1 text-zinc-400 hover:text-white transition"
                        title="Copy link"
                      >
                        {copied ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <a
                        href="https://bluepeak-demo.trycloudflare.com"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-black hover:bg-zinc-200 transition"
                      >
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

      {/* 7. AGENT SECTION */}
      <section className="border-t border-white/[0.07] bg-[#0b0d10] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Windows Agent
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                DeployX Agent for Windows.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                The DeployX Agent runs silently in the background on your PC. It manages local Docker builds, reports container health, streams live logs, and connects to Cloudflare tunnels.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/download"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition shadow-sm"
                >
                  <Download size={14} />
                  <span>Download for Windows (v0.1.2)</span>
                </Link>
                <Link
                  href="/get-started"
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.04] transition"
                >
                  Setup Guide
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-5">
              <div className="divide-y divide-white/[0.06] text-xs">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-zinc-400">Release Version</span>
                  <span className="font-mono text-white">v0.1.2</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-zinc-400">Installer Format</span>
                  <span className="font-mono text-zinc-300">Inno Setup x64 (.exe)</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-zinc-400">Prerequisites</span>
                  <span className="text-zinc-300">Docker Desktop for Windows</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-zinc-400">Code Execution</span>
                  <span className="text-emerald-400 font-medium">100% Local PC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="border-t border-white/[0.07] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Questions & Answers
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Frequently asked questions.
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-white/[0.07] bg-[#0d0f12] p-5"
              >
                <h3 className="text-sm font-semibold text-white">{f.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="border-t border-white/[0.07] bg-[#0b0d10] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to deploy from your PC?
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Create an account in 30 seconds and start sharing your local projects.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <Download size={14} />
              <span>Download Agent</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-white/[0.07] py-8 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white text-black">
              <Rocket size={11} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-zinc-300">DeployX</span>
            <span className="text-zinc-600">•</span>
            <span>Local runtime. Global preview.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-zinc-400">
            <Link href="/get-started" className="hover:text-white transition">
              Get Started
            </Link>
            <Link href="/download" className="hover:text-white transition">
              Agent
            </Link>
            <Link href="/feedback" className="hover:text-white transition">
              Feedback
            </Link>
            <Link href="/beta-limitations" className="hover:text-white transition">
              Beta Limitations
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
