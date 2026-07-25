// FR8X-CON Top Navigation Bar — Compact (48px)

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";
import { getInitials } from "@/lib/utils/format";

export function TopNav() {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search
  };

  return (
    <header className="flex h-9 items-center justify-between border-b border-border bg-white px-2 lg:px-3">
      {/* Mobile menu button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden p-1.5 text-foreground-secondary hover:text-foreground"
      >
        {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden">
        <Link href={ROUTES.FEEDS} className="text-body-sm font-bold text-[var(--fr8x-periwinkle)]">
          {APP_NAME}
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search auctions, users, rates..."
            className="fr8x-input pl-6 py-0.5 text-[11px] h-6"
          />
        </div>
      </form>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Search icon for mobile */}
        <button className="md:hidden p-1.5 text-foreground-secondary hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-md bg-background-card border border-border shadow-dropdown">
                <div className="p-3 border-b border-border">
                  <h3 className="text-body-sm font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="p-3">
                  <p className="text-caption text-foreground-muted text-center py-4">
                    No new notifications
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-[var(--fr8x-mist)] transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold shrink-0">
              {user?.displayName
                ? getInitials(user.displayName)
                : user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[11px] font-medium text-foreground leading-none">
                {user?.displayName || "User"}
              </p>
              <p className="text-[10px] text-foreground-muted leading-none mt-0.5">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
            <ChevronDown className="hidden md:block h-2.5 w-2.5 text-foreground-muted" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-0.5 z-50 w-44 rounded border bg-white border-border shadow-dropdown py-0.5">
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-foreground hover:bg-[var(--fr8x-mist)] transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-3 w-3 text-foreground-secondary" />
                  My Profile
                </Link>
                {user?.isGodMode && (
                  <Link
                    href={ROUTES.GODMODE}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-[var(--fr8x-mist)] transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="h-3 w-3 text-foreground-secondary" />
                    Admin Panel
                  </Link>
                )}
                <div className="my-0.5 h-px bg-border" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1 text-[11px] text-danger hover:bg-danger-light transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-background-card z-50 shadow-elevated lg:hidden">
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
              <span className="text-body-sm font-bold text-[var(--fr8x-periwinkle)]">{APP_NAME}</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 text-foreground-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="px-2 py-3 space-y-0.5">
              {[
                { label: "Feeds", href: ROUTES.FEEDS },
                { label: "Auctions", href: ROUTES.AUCTIONS },
                { label: "Rates", href: ROUTES.RATES },
                { label: "Profile", href: ROUTES.PROFILE },
                { label: "Awards", href: ROUTES.AWARDS },
                { label: "Blacklist", href: ROUTES.BLACKLIST },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="block rounded-md px-2 py-1.5 text-body-sm text-foreground-secondary hover:bg-[var(--fr8x-mist)] hover:text-[var(--fr8x-jet)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
