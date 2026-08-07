// FR8X-CON GodMode Layout — Light Theme & Mobile/Tablet Optimized
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ADMIN_ROUTES } from "@/lib/utils/admin-routes";
import { cn } from "@/lib/utils/cn";
import {
  Shield,
  LayoutDashboard,
  Users,
  Building2,
  Flag,
  ShieldAlert,
  CheckSquare,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  MapPin,
  Archive,
  Megaphone,
  Menu,
  X,
} from "lucide-react";

const sidebarSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: ADMIN_ROUTES.GODMODE, icon: LayoutDashboard, isRed: false },
      { label: "Users & Members", href: ADMIN_ROUTES.GODMODE_USERS, icon: Users, isRed: false },
      { label: "Companies", href: ADMIN_ROUTES.GODMODE_COMPANIES, icon: Building2, isRed: true },
    ],
  },
  {
    title: "Trust & Compliance",
    items: [
      { label: "Moderation Queue", href: ADMIN_ROUTES.GODMODE_MODERATION, icon: Flag, isRed: false },
      { label: "Blacklist Registry", href: ADMIN_ROUTES.GODMODE_BLACKLIST, icon: ShieldAlert, isRed: false },
      { label: "Verification Requests", href: ADMIN_ROUTES.GODMODE_VERIFICATION, icon: CheckSquare, isRed: false },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Ad Management", href: ADMIN_ROUTES.GODMODE_ADS, icon: Megaphone, isRed: false },
      { label: "Billing & Plans", href: ADMIN_ROUTES.GODMODE_BILLING, icon: CreditCard, isRed: false },
      { label: "Audit Log", href: ADMIN_ROUTES.GODMODE_AUDIT, icon: FileText, isRed: false },
      { label: "System Settings", href: ADMIN_ROUTES.GODMODE_SETTINGS, icon: Settings, isRed: false },
      { label: "Port Locations", href: ADMIN_ROUTES.GODMODE_LOCATIONS, icon: MapPin, isRed: false },
      { label: "Backup & Recovery", href: ADMIN_ROUTES.GODMODE_BACKUPS, icon: Archive, isRed: false },
    ],
  },
];

const topTabs = [
  { label: "Dashboard", href: ADMIN_ROUTES.GODMODE, icon: LayoutDashboard },
  { label: "Users & Members", href: ADMIN_ROUTES.GODMODE_USERS, icon: Users },
  { label: "Ad Management", href: ADMIN_ROUTES.GODMODE_ADS, icon: Megaphone },
  { label: "Moderation Queue", href: ADMIN_ROUTES.GODMODE_MODERATION, icon: Flag },
  { label: "Blacklist Registry", href: ADMIN_ROUTES.GODMODE_BLACKLIST, icon: ShieldAlert },
  { label: "Verification Requests", href: ADMIN_ROUTES.GODMODE_VERIFICATION, icon: CheckSquare },
  { label: "Billing & Plans", href: ADMIN_ROUTES.GODMODE_BILLING, icon: CreditCard },
  { label: "Audit Log", href: ADMIN_ROUTES.GODMODE_AUDIT, icon: FileText },
  { label: "Locations", href: ADMIN_ROUTES.GODMODE_LOCATIONS, icon: MapPin },
  { label: "Backups", href: ADMIN_ROUTES.GODMODE_BACKUPS, icon: Archive },
  { label: "System Settings", href: ADMIN_ROUTES.GODMODE_SETTINGS, icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isLoginPage = pathname === ADMIN_ROUTES.GODMODE_LOGIN || pathname === "/godmode/login";

  useEffect(() => {
    if (!isLoading && !isLoginPage && (!isAuthenticated || !user?.isGodMode)) {
      router.replace(ADMIN_ROUTES.GODMODE_LOGIN);
    }
  }, [isLoading, isLoginPage, isAuthenticated, user, router]);

  if (isLoginPage) {
    return <div className="w-full min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  if (isLoading || (!isAuthenticated || !user?.isGodMode)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-[#56C5F0]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[var(--fr8x-bg)] overflow-hidden text-slate-900">
      {/* ═══ MOBILE / TABLET HEADER & MENU TOGGLE ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#56C5F0]" />
          <span className="text-[12px] font-bold tracking-wide text-slate-900">GodMODE</span>
        </div>
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ═══ MOBILE DRAWER OVERLAY ═══ */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ═══ DESKTOP SIDEBAR & MOBILE DRAWER PANEL ═══ */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-200 z-50",
          "fixed inset-y-0 left-0 w-64 md:static md:translate-x-0 shadow-md md:shadow-none",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#56C5F0]" />
            <span className="text-[12px] font-bold tracking-wide text-slate-900">GodMODE Control</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu Navigation Sections */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
          {sidebarSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <p className="px-2.5 text-[8px] uppercase font-bold tracking-wider text-slate-400">
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors border-l-2",
                      isActive
                        ? "bg-slate-100 border-[#56C5F0] text-slate-900 font-bold shadow-2xs"
                        : item.isRed
                        ? "border-transparent text-red-600 hover:bg-red-50"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", item.isRed && !isActive ? "text-red-500" : "")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50">
          <button
            onClick={() => {
              setMobileDrawerOpen(false);
              signOut();
            }}
            className="hover:text-red-600 transition-colors flex items-center gap-1.5 font-medium text-slate-700"
            aria-label="Sign out of GodMode"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
          <span className="text-[8px] font-mono text-slate-400">v1.0</span>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full pt-10 md:pt-0">
        {/* TOP TABS NAVIGATION — TOUCH-PAN HORIZONTAL SCROLL FOR MOBILE/TABLET */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 w-full touch-pan-x">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Tabs</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar">
            {topTabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors border",
                    isActive
                      ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] shadow-2xs font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </header>

        {/* MAIN CONTENT AREA — RESPONSIVE SCROLL VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
