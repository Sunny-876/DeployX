'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
              TERMS OF SERVICE
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            DeployX Terms of Service
          </h1>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            Effective Date: October 2026
          </p>

          <div className="mt-8 space-y-6 text-xs leading-relaxed text-zinc-300">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">1. Service Description</h2>
              <p className="text-zinc-400">
                DeployX provides a developer platform and local companion agent that enables developers to build and run containerized web applications on their own computers, and expose them via temporary public tunnels for demonstration and review purposes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">2. Acceptable Use Policy</h2>
              <p className="text-zinc-400">
                You agree not to use DeployX or its tunneling infrastructure to host malicious software, conduct denial-of-service attacks, distribute copyrighted material without authorization, host phishing pages, or violate applicable local and international laws.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">3. Local Compute Responsibility</h2>
              <p className="text-zinc-400">
                Because deployments execute on your personal computer hardware, you are solely responsible for ensuring your system has adequate capacity, firewall configuration, and Docker isolation. DeployX is not liable for local hardware strain or software incompatibilities.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">4. Beta Availability & SLA</h2>
              <p className="text-zinc-400">
                DeployX is provided on an "as is" and "as available" beta basis. We do not provide financial uptime SLAs for temporary tunnel URLs or personal runtime hosting.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-white">5. Termination</h2>
              <p className="text-zinc-400">
                We reserve the right to suspend or terminate accounts that violate our acceptable use policies or engage in abusive tunnel traffic.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
            <span>DeployX Developer Terms</span>
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              DeployX Home →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
