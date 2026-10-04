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
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Zap,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#08090a] text-[#ededef] flex flex-col justify-between p-6 sm:p-10">
      {/* Background Planetary Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[25%] -top-[10%] h-[120%] w-[80%] rounded-full border-r border-blue-500/20 bg-gradient-to-r from-transparent via-[#08090a]/80 to-[#0e1320]/30 shadow-[40px_0_120px_rgba(59,130,246,0.15)]" />
        <div className="absolute -left-[40%] top-[5%] h-[100%] w-[85%] rounded-full border-r border-white/5 opacity-40 blur-[1px]" />
      </div>

      {/* Top Navbar (Screenshot 2) */}
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

      {/* Main Split Content (Screenshot 2) */}
      <div className="relative z-10 my-auto grid w-full max-w-7xl mx-auto gap-12 lg:grid-cols-2 lg:items-center py-10">
        {/* Left Column: Hero & Value Proposition */}
        <div className="flex flex-col items-start max-w-xl">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono tracking-wider uppercase text-zinc-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            <span>PERSONAL CLOUD FOR DEVELOPERS</span>
          </div>

          {/* Big Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Build.
            <br />
            Deploy.
            <br />
            <span className="text-blue-500">Share.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md">
            DeployX helps students showcase their projects with temporary public URLs — no domain, no investment, just your talent.
          </p>

          {/* Feature List */}
          <div className="mt-8 space-y-4 w-full">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Globe size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Temporary Public URLs</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Share your projects instantly</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Zap size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">No Investment Needed</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Use your own PC with Cloudflare Tunnel</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0d0f14] text-zinc-300">
                <Code2 size={16} />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-white">Showcase Your Skills</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Get noticed by peers and recruiters</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (Screenshot 2) */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#0d0e13]/95 p-8 shadow-2xl backdrop-blur-xl">
            {/* Card Header */}
            <div className="mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white mb-4">
                <Rocket size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="text-xs text-zinc-400 mt-1">Sign in to continue to DeployX</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={submitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090a] pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/20 disabled:opacity-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-[#08090a] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  href="/feedback"
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit CTA (Screenshot 2) */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <span className="relative bg-[#0d0e13] px-3 font-mono text-[10px] text-zinc-500 uppercase">
                  or continue with
                </span>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setError('Social OAuth is currently reserved for public launch. Please sign in with your email.')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#08090a] py-2.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.3l3.7 2.9C6.2 7.3 8.8 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.6 6.3C.6 8.3 0 10.6 0 13s.6 4.7 1.6 6.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.2L1.6 16C3.5 19.7 7.4 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setError('GitHub OAuth is currently reserved for public launch. Please sign in with your email.')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#08090a] py-2.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Footer Switch */}
              <p className="mt-5 text-center text-xs text-zinc-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-white hover:underline font-semibold transition"
                >
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom subtle note */}
      <div className="relative z-10 text-center text-[11px] text-zinc-600 font-mono">
        DeployX Control Plane • Local Execution Model
      </div>
    </div>
  );
}
