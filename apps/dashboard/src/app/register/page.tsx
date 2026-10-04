'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  User,
  ArrowRight,
  Globe,
  Zap,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function RegisterPage() {
  const { user, loading: authLoading, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await register(name.trim(), email.trim(), password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      let msg = result.error || 'Failed to create account.';
      const lower = msg.toLowerCase();
      if (
        lower.includes('prisma') ||
        lower.includes('internal server') ||
        lower.includes('econnrefused') ||
        lower.includes('failed to fetch')
      ) {
        msg = 'Unable to reach the authentication service. Please try again in a few moments.';
      } else if (lower.includes('already exists') || lower.includes('unique constraint') || lower.includes('conflict')) {
        msg = 'An account with this email address already exists.';
      }
      setError(msg);
      setSubmitting(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a]">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#08090a] text-[#ededef] flex flex-col justify-between p-6 sm:p-10">
      {/* Background Planetary Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[25%] -top-[10%] h-[120%] w-[80%] rounded-full border-r border-blue-500/20 bg-gradient-to-r from-transparent via-[#08090a]/80 to-[#0e1320]/30 shadow-[40px_0_120px_rgba(59,130,246,0.15)]" />
        <div className="absolute -left-[40%] top-[5%] h-[100%] w-[85%] rounded-full border-r border-white/5 opacity-40 blur-[1px]" />
      </div>

      {/* Top Navbar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-sm">
            <Rocket size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">DeployX</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
        >
          <ArrowLeft size={13} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Split Content */}
      <div className="relative z-10 my-auto grid w-full max-w-7xl mx-auto gap-12 lg:grid-cols-2 lg:items-center py-10">
        {/* Left Column: Hero */}
        <div className="flex flex-col items-start max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono tracking-wider uppercase text-zinc-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            <span>JOIN DEPLOYX FREE</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Start.
            <br />
            Ship.
            <br />
            <span className="text-blue-500">Inspire.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md">
            Deploy fullstack codebases straight from your PC with temporary HTTPS domains. Fast setup, no cloud fees.
          </p>

          <div className="mt-8 space-y-4 w-full">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Globe size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Instant Tunnel URLs</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Automated Cloudflare tunnels for live sharing</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Zap size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Zero Cloud Invoices</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Use your local Docker compute directly</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Code2 size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Multi-Framework Ready</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Next.js, React, Node, Vite & Docker</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#0d0e13]/95 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white mb-4">
                <Rocket size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Create account</h2>
              <p className="text-xs text-zinc-400 mt-1">Get started with DeployX in seconds</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={submitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sunny"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>

              <p className="mt-5 text-center text-xs text-zinc-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-white hover:underline font-semibold transition"
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center text-[11px] text-zinc-600 font-mono">
        DeployX Control Plane • Local Execution Model
      </div>
    </div>
  );
}
