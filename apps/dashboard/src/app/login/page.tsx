'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await login(email.trim(), password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      let msg = result.error || 'Failed to sign in. Please verify your credentials.';
      const lower = msg.toLowerCase();
      if (
        lower.includes('prisma') ||
        lower.includes('internal server') ||
        lower.includes('econnrefused') ||
        lower.includes('failed to fetch')
      ) {
        msg = 'Unable to reach the authentication service. Please try again in a few moments.';
      } else if (lower.includes('unauthorized') || lower.includes('invalid credentials')) {
        msg = 'Invalid email or password. Please try again.';
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
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-[#08090a] text-[#ededef]">
      {/* Subtle subdued background vignette */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[360px]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black mb-3.5 shadow-sm transition hover:opacity-90"
          >
            <Rocket size={18} strokeWidth={2.5} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-xs text-zinc-400 mt-1">Sign in to continue to DeployX.</p>
        </div>

        {/* Compact Authentication Panel */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d0f12] p-5 shadow-2xl">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/10 bg-[#08090a] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.02] disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#08090a] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/[0.02] disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>

        {/* Footer switch link */}
        <p className="mt-5 text-center text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-white hover:underline transition font-medium underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
