'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { TopHeader } from '../../components/TopHeader';
import { useAuth } from '../../lib/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a] text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          <span className="text-xs text-zinc-500 font-mono">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#ededef] flex">
      {/* Universal Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[250px]">
        {/* Universal Top Header */}
        <TopHeader onOpenMobileMenu={() => setMobileOpen(true)} />

        {/* Main Page Content */}
        <div className="flex-1 p-5 sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
