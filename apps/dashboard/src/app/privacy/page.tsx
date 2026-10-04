'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, EyeOff, Server } from 'lucide-react';

export default function PrivacyPage() {
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
      <div className="mx-auto max-w-3xl">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>

        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-10 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              PRIVACY POLICY
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Privacy & Data Practices
          </h1>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            Last updated: October 2026
          </p>

          <div className="mt-8 space-y-6 text-xs leading-relaxed text-zinc-300">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock size={14} className="text-emerald-400" />
                <span>1. Local-First Code Architecture</span>
              </h2>
              <p className="text-zinc-400">
                DeployX is architected on a personal-cloud model. Your application source code, configuration files, and build artifacts reside on your local machine. DeployX cloud servers do not store, index, or inspect your source code.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                <span>2. Account Information</span>
              </h2>
              <p className="text-zinc-400">
                When you create an account, we collect your name and email address. Passwords are cryptographically hashed using salted bcrypt before storage. We use your email solely for authentication, session verification, and critical service notifications.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server size={14} className="text-purple-400" />
                <span>3. Operational Telemetry & Build Logs</span>
              </h2>
              <p className="text-zinc-400">
                To deliver the live dashboard terminal and deployment lifecycle controls, the DeployX Agent transmits ephemeral build stdout/stderr and container statuses to our API. These logs are linked to your user account and can be permanently deleted by removing the deployment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <EyeOff size={14} className="text-zinc-400" />
                <span>4. Public Tunnel Routing</span>
              </h2>
              <p className="text-zinc-400">
                When a deployment is live, requests sent to your temporary Cloudflare public URL are routed directly to your local Docker container. Neither DeployX nor Cloudflare Quick Tunnels store inbound request payload contents.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">5. Account Deletion & Rights</h2>
              <p className="text-zinc-400">
                You retain complete ownership of your projects and data. You may delete projects, deployments, or your account at any time from the dashboard.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
            <span>Questions? Open a discussion on GitHub.</span>
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              DeployX Home →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
