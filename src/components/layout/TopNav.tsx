// FR8X-CON Top Navigation Bar — Dark Theme, Compact (48px)
// Profile image click: opens dropdown only, NOT file picker

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";
import { getInitials } from "@/lib/utils/format";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export function TopNav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex h-9 items-center justify-between border-b border-[#333B44] bg-[#20252B] px-2 lg:px-3">
      {/* Mobile menu button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden p-1.5 text-[#94A3B8] hover:text-[#E2E8F0]"
      >
        {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden">
        <Link href={ROUTES.FEEDS} className="text-body-sm font-bold text-[#0EA5E9]">
          {APP_NAME}
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search auctions, users, rates..."
            className="w-full bg-[#2A3038] border border-[#333B44] text-[#E2E8F0] rounded-[3px] pl-8 py-0.5 text-[11px] h-6 placeholder:text-[#94A3B8]/70 focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/30 outline-none"
          />
        </div>
      </form>

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Live Currency Selector */}
        <CurrencySelector />

        {/* Search icon for mobile */}
        <button className="md:hidden p-1.5 text-[#94A3B8] hover:text-[#E2E8F0]">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-[3px] bg-[#252B33] border border-[#333B44] shadow-dropdown">
                <div className="p-3 border-b border-[#333B44]">
                  <h3 className="text-body-sm text-[#E2E8F0]">Notifications</h3>
                </div>
                <div className="p-3">
                  <p className="text-caption text-[#94A3B8] text-center py-4">
                    No new notifications
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile dropdown — Click opens menu ONLY, not file picker */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 rounded-[3px] px-1.5 py-1 hover:bg-[#2A3038] transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2A3038] text-[#0EA5E9] text-[10px] font-semibold shrink-0 border border-[#333B44]">
              {user?.displayName
                ? getInitials(user.displayName)
                : user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[11px] text-[#E2E8F0] leading-none">
                {user?.displayName || "User"}
              </p>
              <p className="text-[10px] text-[#94A3B8] leading-none mt-0.5">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
            <ChevronDown className="hidden md:block h-2.5 w-2.5 text-[#94A3B8]" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-0.5 z-50 w-44 rounded-[3px] border bg-[#252B33] border-[#333B44] shadow-dropdown py-0.5">
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-[#E2E8F0] hover:bg-[#2A3038] transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-3 w-3 text-[#94A3B8]" />
                  My Profile
                </Link>

                <div className="my-0.5 h-px bg-[#333B44]" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1 text-[11px] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
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
            className="fixed inset-0 bg-[#1E2329]/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-[#20252B] border-r border-[#333B44] z-50 shadow-xl lg:hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333B44] bg-[#1E2329]/50">
              <span className="text-[12px] font-bold text-[#0EA5E9] tracking-wide">{APP_NAME} Navigation</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1 rounded-[3px] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#2A3038] transition-colors"
                aria-label="Close mobile menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {[
                { label: "Feeds", href: ROUTES.FEEDS },
                { label: "Auctions", href: ROUTES.AUCTIONS },
                { label: "Rates", href: ROUTES.RATES },
                { label: "Contacts", href: ROUTES.CONTACTS },
                { label: "Messages", href: ROUTES.MESSAGES },
                { label: "Profile", href: ROUTES.PROFILE },
                { label: "Awards", href: ROUTES.AWARDS },
                { label: "Blacklist", href: ROUTES.BLACKLIST },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center justify-between rounded-[3px] px-3 py-2 text-[10px] text-[#94A3B8] hover:bg-[#2A3038] hover:text-[#E2E8F0] transition-colors border border-transparent hover:border-[#333B44]"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-[#333B44] bg-[#1E2329] text-[8px] text-[#94A3B8] text-center">
              FR8X-CON Mobile Platform v1.0
            </div>
          </div>
        </>
      )}
    </header>
  );
}
