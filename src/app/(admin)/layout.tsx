// FR8X-CON GodMode Layout — Spec Page 11
// Separate GodMode Login at /godmode/login
// Brand: GodMODE
// Left Nav: Overview (Dashboard, Users & Members, Companies [Red]), Trust & Compliance (Moderation Queue, Blacklist Registry, Verification Requests), Platform (Billing & Plans, Audit Log, System Settings)
// Top Tabs Navigation + Footer "login" link

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/utils/constants";
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
} from "lucide-react";

const sidebarSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.GODMODE, icon: LayoutDashboard, isRed: false },
      { label: "Users & Members", href: ROUTES.GODMODE_USERS, icon: Users, isRed: false },
      { label: "Companies", href: ROUTES.GODMODE_COMPANIES, icon: Building2, isRed: true },
    ],
  },
  {
    title: "Trust & Compliance",
    items: [
      { label: "Moderation Queue", href: ROUTES.GODMODE_MODERATION, icon: Flag, isRed: false },
      { label: "Blacklist Registry", href: ROUTES.GODMODE_BLACKLIST, icon: ShieldAlert, isRed: false },
      { label: "Verification Requests", href: ROUTES.GODMODE_VERIFICATION, icon: CheckSquare, isRed: false },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Billing & Plans", href: ROUTES.GODMODE_BILLING, icon: CreditCard, isRed: false },
      { label: "Audit Log", href: ROUTES.GODMODE_AUDIT, icon: FileText, isRed: false },
      { label: "System Settings", href: ROUTES.GODMODE_SETTINGS, icon: Settings, isRed: false },
    ],
  },
];

const topTabs = [
  { label: "Dashboard", href: ROUTES.GODMODE, icon: LayoutDashboard },
  { label: "Users & Members", href: ROUTES.GODMODE_USERS, icon: Users },
  { label: "Moderation Queue", href: ROUTES.GODMODE_MODERATION, icon: Flag },
  { label: "Blacklist Registry", href: ROUTES.GODMODE_BLACKLIST, icon: ShieldAlert },
  { label: "Verification Requests", href: ROUTES.GODMODE_VERIFICATION, icon: CheckSquare },
  { label: "Billing & Plans", href: ROUTES.GODMODE_BILLING, icon: CreditCard },
  { label: "Audit Log", href: ROUTES.GODMODE_AUDIT, icon: FileText },
  { label: "System Settings", href: ROUTES.GODMODE_SETTINGS, icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === ROUTES.GODMODE_LOGIN || pathname === "/godmode/login";

  useEffect(() => {
    if (!isLoginPage && !isLoading && (!isAuthenticated || !user?.isGodMode)) {
      router.replace(ROUTES.GODMODE_LOGIN);
    }
  }, [isLoading, isAuthenticated, user, router, isLoginPage]);

  // If rendering GodMode login page, render children directly without admin layout frame
  if (isLoginPage) {
    return <div className="w-full min-h-screen bg-[#0F172A] text-white">{children}</div>;
  }

  if (isLoading || !user?.isGodMode) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0F172A] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-[#56C5F0]" />
          <p className="text-body-md text-slate-300 font-medium">Verifying GodMODE admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[var(--fr8x-bg)] overflow-hidden">
      {/* ═══ LEFT NAVIGATION MENU ═══ */}
      <aside className="w-64 bg-[#1E293B] text-white flex flex-col border-r border-slate-700 shrink-0">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#56C5F0]" />
          <span className="text-heading-md font-bold tracking-wide">GodMODE</span>
        </div>

        {/* Menu Sections */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {sidebarSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <p className="px-3 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm transition-colors",
                      isActive
                        ? "bg-slate-700 font-semibold text-white"
                        : item.isRed
                        ? "text-red-400 font-bold hover:bg-slate-800"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", item.isRed && !isActive ? "text-red-400" : "")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-body-sm text-slate-400">
          <Link href={ROUTES.GODMODE_LOGIN} className="hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            <LogOut className="h-4 w-4" />
            login
          </Link>
          <span className="text-[10px] text-slate-500">v1.0</span>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* TOP TABS NAVIGATION */}
        <header className="bg-white border-b border-border px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 w-full">
          <span className="text-caption font-semibold text-foreground-secondary shrink-0">[Tab]</span>
          <span className="text-foreground-muted">|</span>
          <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar">
            {topTabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-[var(--fr8x-periwinkle)] text-white"
                      : "text-foreground-secondary hover:bg-[var(--fr8x-mist)] hover:text-[var(--fr8x-jet)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </header>

        {/* PAGE CONTENT — Screenfit & Screenwide */}
        <main className="flex-1 overflow-y-auto p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
