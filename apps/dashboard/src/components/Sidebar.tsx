'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Rocket,
  LayoutDashboard,
  Box,
  Layers,
  Cpu,
  MessageSquare,
  Settings,
  HelpCircle,
  X,
  Star,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const mainNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/projects', icon: Box },
    { label: 'Deployments', href: '/dashboard/deployments', icon: Layers },
    { label: 'Agent', href: '/dashboard/agent', icon: Cpu },
    { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  ];

  const secondaryNav = [
    { label: 'Settings', href: '/dashboard/agent', icon: Settings },
    { label: 'Help & Docs', href: '/get-started', icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between p-3.5">
      <div>
        {/* Brand Header */}
        <div className="flex h-12 items-center justify-between px-2 mb-4">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen?.(false)}
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-sm">
              <Rocket size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-white">DeployX</span>
          </Link>

          {/* Mobile close button */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition duration-150 ${
                  active
                    ? 'bg-[#181920] border border-white/[0.08] font-medium text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="mt-8 space-y-1">
          {secondaryNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition duration-150 ${
                  active
                    ? 'bg-[#181920] border border-white/[0.08] font-medium text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Pro Banner */}
      <div className="pt-4">
        <Link
          href="/dashboard/deploy"
          onClick={() => setMobileOpen?.(false)}
          className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#101116] p-3 transition hover:border-white/15 hover:bg-[#14151c]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Star size={14} className="fill-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">DeployX Pro</p>
              <p className="text-[10px] text-zinc-500 truncate">Showcase. Share. Grow.</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed 250px) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-white/[0.07] bg-[#090a0d] md:block">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen?.(false)}
          />
          <aside className="relative flex w-[260px] max-w-[85vw] flex-col border-r border-white/[0.07] bg-[#090a0d] shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
