'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#111114] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Legal placeholder</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Privacy policy</h1>
          <p className="mt-5 text-base leading-8 text-zinc-300">
            This privacy policy is a placeholder for legal review and should be treated as draft documentation only.
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Before public launch, confirm data retention, account data handling, project metadata retention, diagnostic copying, and tunnel logging behavior with legal counsel.
          </p>
        </div>
      </div>
    </main>
  );
}
