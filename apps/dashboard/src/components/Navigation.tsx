'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Rocket, Plus, Layers, Cpu, LayoutDashboard, Menu, X, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useAgents } from './useAgents';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { online, primary, loading } = useAgents();
  const agentOnline: boolean | null = loading ? null : online;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/projects', icon: Layers },
    { label: 'Deployments', href: '/dashboard/deployments', icon: Cpu },
    ...(user?.role === 'ADMIN' ? [{ label: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0b0d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-sm">
              <Rocket size={16} strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              Deploy<span className="text-zinc-400">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-white' : 'text-zinc-500'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action & Status */}
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/feedback" className="text-xs font-medium text-zinc-300 transition hover:text-white">
            Feedback
          </Link>

          {/* Agent status — real state from GET /agents */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-xs text-zinc-400"
            title={
              agentOnline === true
                ? `DeployX Agent is online${primary ? ` (${primary.name})` : ''}`
                : primary
                  ? 'DeployX Agent is offline. Start the Agent on your PC.'
                  : 'No paired agent. Connect your DeployX Agent.'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                agentOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : agentOnline === false
                  ? 'border border-zinc-500 bg-transparent'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="font-mono text-[11px]">
              {agentOnline === true
                ? 'Agent Online'
                : agentOnline === false
                ? primary
                  ? 'Agent Offline'
                  : 'Connect Agent'
                : 'Agent Checking...'}
            </span>
          </Link>

          {/* Deploy Project CTA */}
          <Link
            href="/dashboard/deploy"
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Deploy Project</span>
          </Link>

          {/* User Menu / Logout */}
          {user && (
            <div className="flex items-center gap-2.5 border-l border-white/10 pl-3">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                  <UserIcon size={12} />
                </div>
                <span className="font-mono text-xs max-w-[150px] truncate" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => void logout()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
                title="Log out of DeployX"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-[#0e0e12] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-white/10 pt-2 flex flex-col gap-2">
              <Link href="/feedback" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-zinc-300 hover:text-white">
                Feedback
              </Link>
              <Link
                href="/dashboard/deploy"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Deploy Project</span>
              </Link>
              {user && (
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="font-mono text-xs text-zinc-400 truncate max-w-[200px]">
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void logout();
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
