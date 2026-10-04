'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  Layers,
  Cpu,
  LayoutDashboard,
  Box,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useAgents } from './useAgents';

interface TopHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const { primary, online } = useAgents();
  const router = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = user?.name?.trim() || 'Sunny';
  const firstName = displayName.split(' ')[0] || 'Sunny';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S';

  const topTabs = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/projects', icon: Box },
    { label: 'Deployments', href: '/dashboard/deployments', icon: Layers },
    { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.07] bg-[#08090a]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left Area: Mobile Toggle + Top Tabs / Search */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-[#0d0f14] px-3 py-1.5 transition ${
              searchFocused
                ? 'border-white/30 ring-1 ring-white/10 w-72 md:w-80'
                : 'border-white/[0.08] hover:border-white/20 w-60 md:w-72'
            }`}
          >
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search projects, deployments..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] select-none">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Agent Status Pill */}
        <Link
          href="/dashboard/agent"
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0e1015] px-3 py-1 text-xs text-zinc-300 hover:border-white/20 transition"
          title={online ? 'DeployX Agent is online' : 'DeployX Agent is offline'}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              online
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-zinc-600'
            }`}
          />
          <span className="text-[11px] font-medium hidden xs:inline">
            {online ? 'Agent Online' : primary ? 'Agent Offline' : 'Connect Agent'}
          </span>
        </Link>

        {/* Deploy Project CTA Button */}
        <Link
          href="/dashboard/deploy"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Deploy Project</span>
        </Link>

        {/* Notifications Icon with Red Badge */}
        <button
          className="relative rounded-lg border border-white/[0.08] bg-[#0d0f14] p-1.5 text-zinc-400 hover:border-white/20 hover:text-white transition"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={14} />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-[#08090a]">
            1
          </span>
        </button>

        {/* User Profile Pill */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0d0f14] py-1 pl-1.5 pr-2.5 text-xs text-zinc-300 hover:border-white/20 transition cursor-pointer"
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              {/* Blue Avatar Circle */}
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 font-semibold text-[10px] text-white">
                {userInitials[0] || 'S'}
              </div>

              {/* User Name */}
              <span className="text-xs font-medium text-white max-w-[100px] truncate">
                {firstName}
              </span>

              <ChevronDown size={12} className="text-zinc-500" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#0d0f14] p-1.5 shadow-2xl z-50">
                <div className="border-b border-white/[0.06] px-3 py-2">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <p className="font-mono text-[10px] text-zinc-500">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <Box size={13} className="text-zinc-500" />
                    <span>My Projects</span>
                  </Link>

                  <Link
                    href="/dashboard/agent"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <Cpu size={13} className="text-zinc-500" />
                    <span>Agent & Runtime</span>
                  </Link>
                </div>

                <div className="border-t border-white/[0.06] pt-1">
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                      router.replace('/');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
