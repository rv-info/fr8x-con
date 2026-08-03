// FR8X-CON Sidebar — Compact, icon-only by default, hover-expands
// Matches spec: tight nav, tiny avatar, compact rows

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  TrendingUp,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Feeds", href: ROUTES.FEEDS, icon: LayoutDashboard },
  { label: "Auctions", href: ROUTES.AUCTIONS, icon: Gavel },
  { label: "Rates", href: ROUTES.RATES, icon: TrendingUp },
  { label: "Profile", href: ROUTES.PROFILE, icon: User },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("fr8x_sidebar_expanded");
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    try {
      localStorage.setItem("fr8x_sidebar_expanded", String(nextState));
    } catch {
      /* ignore */
    }
  };

  const expandedClass = isMounted && isExpanded ? "w-[168px]" : "w-[44px]";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-slate-200 transition-[width] duration-200 overflow-hidden contain-layout shrink-0 transform-gpu",
        expandedClass
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-200 min-h-[40px] overflow-hidden">
        <Link href={ROUTES.FEEDS} className="flex items-center gap-2 shrink-0">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--fr8x-periwinkle)] text-white font-bold text-[9px] shrink-0 shadow-2xs">
            F
          </div>
          {isExpanded && (
            <span className="text-[12px] text-slate-900 font-bold tracking-tight whitespace-nowrap">
              {APP_NAME}
            </span>
          )}
        </Link>
      </div>

      {/* Main Navigation items */}
      <nav className="flex-1 px-1.5 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-[10px] transition-colors duration-150 font-medium",
                isActive
                  ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isExpanded && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls: Expand/Collapse Toggle Button & Sign Out */}
      <div className="px-1.5 py-2 border-t border-slate-200 space-y-1 bg-slate-50/50">
        {/* Dedicated Expand/Collapse Toggle Button directly above Sign Out */}
        <button
          onClick={toggleSidebar}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
        >
          {isExpanded ? (
            <>
              <PanelLeftClose className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="whitespace-nowrap font-semibold">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5 shrink-0 text-slate-600 mx-auto" />
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          title={!isExpanded ? "Sign out" : undefined}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {isExpanded && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

