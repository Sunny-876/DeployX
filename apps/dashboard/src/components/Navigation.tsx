'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Rocket,
  Plus,
  Layers,
  Cpu,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  MessageSquare,
} from 'lucide-react';
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
    { label: 'Feedback', href: '/feedback', icon: MessageSquare },
    ...(user?.role === 'ADMIN' ? [{ label: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090a]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Main Nav */}
        <div className="flex items-center gap-7">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition hover:opacity-90 shrink-0"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black shadow-sm">
              <Rocket size={14} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
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
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-zinc-500'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status & Controls */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Real Agent Connection Pill */}
          <Link
            href="/dashboard/agent"
            className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-[#0d0f12] px-2.5 py-1 text-xs text-zinc-400 hover:border-white/20 transition"
            title={
              agentOnline === true
                ? `DeployX Agent is online${primary ? ` (${primary.name})` : ''}`
                : primary
                ? 'DeployX Agent is offline. Launch the Agent on your PC.'
                : 'No paired agent. Connect your DeployX Agent.'
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                agentOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : agentOnline === false
                  ? 'border border-zinc-500 bg-transparent'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="font-mono text-[11px] text-zinc-300">
              {agentOnline === true
                ? 'Agent Online'
                : agentOnline === false
                ? primary
                  ? 'Agent Offline'
                  : 'Connect Agent'
                : 'Checking...'}
            </span>
          </Link>

          {/* Deploy Project CTA */}
          <Link
            href="/dashboard/deploy"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Deploy Project</span>
          </Link>

          {/* User Account & Logout */}
          {user && (
            <div className="flex items-center gap-2 border-l border-white/[0.08] pl-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300">
                  <UserIcon size={11} />
                </div>
                <span className="font-mono text-[11px] max-w-[140px] truncate text-zinc-300" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => void logout()}
                className="rounded-md border border-white/[0.08] bg-[#0d0f12] p-1.5 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                title="Log out of DeployX"
                aria-label="Log out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-[#0d0f12] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Agent Status */}
            <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#08090a] px-3 py-2 text-xs">
              <span className="text-zinc-400 text-xs">DeployX Agent</span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    agentOnline === true
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : agentOnline === false
                      ? 'border border-zinc-500 bg-transparent'
                      : 'bg-zinc-600'
                  }`}
                />
                <span className="font-mono text-[11px] text-zinc-200">
                  {agentOnline === true
                    ? 'Online'
                    : agentOnline === false
                    ? primary
                      ? 'Offline'
                      : 'Not Paired'
                    : 'Checking...'}
                </span>
              </div>
            </div>

            <div className="my-2 border-t border-white/[0.06] pt-2 flex flex-col gap-2">
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 transition"
              >
                Download Windows Agent
              </Link>
              <Link
                href="/dashboard/deploy"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Deploy Project</span>
              </Link>
              {user && (
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 mt-1">
                  <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[200px]" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void logout();
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <LogOut size={12} />
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
