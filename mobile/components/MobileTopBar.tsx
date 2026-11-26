'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';

interface MobileTopBarProps {
  activePageTitle: string;
  onOpenDrawer: () => void;
}

export function MobileTopBar({ activePageTitle, onOpenDrawer }: MobileTopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications } = useData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.read).length
    : 0;

  const initials = (user?.displayName || user?.email || 'FR')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('') || 'FR';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setSearchOpen(false);
    if (!trimmed) return;
    router.push(`/feeds?q=${encodeURIComponent(trimmed)}`);
    setQuery('');
  };

  return (
    <>
      <header className="fr8x-m-topbar" role="banner">
        <div className="fr8x-m-topbar-left">
          <button
            type="button"
            className="fr8x-m-icon-btn"
            onClick={onOpenDrawer}
            aria-label="Open navigation menu"
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>

          <Link href="/dashboard" className="fr8x-m-brand-badge" aria-label="FR8X Home">
            <img src="/ART/LOGOS/logo_primary.png" alt="FR8X" />
          </Link>

          <h1 className="fr8x-m-page-title">{activePageTitle}</h1>
        </div>

        <div className="fr8x-m-topbar-actions">
          <button
            type="button"
            className="fr8x-m-icon-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search workspace"
          >
            <Search size={19} strokeWidth={2.1} />
          </button>

          <Link
            href="/notifications"
            className="fr8x-m-icon-btn"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={19} strokeWidth={2.1} />
            {unreadCount > 0 && (
              <span className="fr8x-m-unread-dot">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            className="fr8x-m-avatar-btn"
            aria-label="Open profile and settings"
          >
            {initials}
          </Link>
        </div>
      </header>

      {searchOpen && (
        <div
          className="fr8x-m-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search FR8X"
          onClick={() => setSearchOpen(false)}
        >
          <div className="fr8x-m-search-sheet" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} className="fr8x-m-search-row">
              <Search size={18} color="#475569" />
              <input
                type="search"
                className="fr8x-m-search-input"
                placeholder="Search feeds, rates, auctions, members..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="fr8x-m-icon-btn"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
