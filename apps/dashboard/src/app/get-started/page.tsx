'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Terminal,
  ShieldCheck,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Create Account',
    description: 'Sign up for free in seconds. No credit card or billing details required.',
  },
  {
    step: '02',
    title: 'Download Windows Agent',
    description: 'Install DeployX-Agent-Setup-0.1.2.exe on your Windows 10 or 11 computer.',
  },
  {
    step: '03',
    title: 'Start Docker Desktop',
    description: 'Ensure Docker Desktop is open and initialized to run local containers.',
  },
  {
    step: '04',
    title: 'Pair in One Click',
    description: 'Enter the 6-digit dashboard pairing code into your Agent to securely link your PC.',
  },
  {
    step: '05',
    title: 'Deploy & Share',
    description: 'Upload your project ZIP archive and get an instant, shareable Cloudflare public URL.',
  },
];

export default function GetStartedPage() {
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
      <div className="mx-auto max-w-4xl">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>

        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-10 shadow-xl">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            GET STARTED
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Deploy your first project in minutes.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Turn your laptop or desktop into your personal deployment server. Keep full ownership of your runtime while getting modern cloud dashboard management.
          </p>

          {/* 5 Steps */}
          <div className="mt-10 grid gap-3 sm:grid-cols-5">
            {steps.map((s) => (
              <div
                key={s.step}
                className="rounded-lg border border-white/[0.08] bg-[#08090a] p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-500">
                    {s.step}
                  </span>
                  <h3 className="mt-2 text-xs font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Value Highlights */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/[0.06] bg-[#08090a] p-4">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h4 className="mt-2 text-xs font-semibold text-white">Code Stays Local</h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Source code remains on your PC. DeployX never uploads or stores your code in cloud storage.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-[#08090a] p-4">
              <Terminal size={18} className="text-blue-400" />
              <h4 className="mt-2 text-xs font-semibold text-white">Docker Isolation</h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Every project builds inside dedicated Linux containers on your machine with automatic port binding.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-[#08090a] p-4">
              <Rocket size={18} className="text-purple-400" />
              <h4 className="mt-2 text-xs font-semibold text-white">Instant Public Tunnel</h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Cloudflare Quick Tunnels forward requests directly to your container with SSL enabled out of the box.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
              >
                <span>Create Account</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#08090a] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
              >
                <Download size={13} />
                <span>Download Agent</span>
              </Link>
            </div>

            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Already have an account? Log in →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
