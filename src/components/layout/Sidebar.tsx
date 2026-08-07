// FR8X-CON Sidebar — Dark Theme, Compact, icon-only by default, hover-expands
// Strict 4-color palette: Graphite nav background

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
        "hidden lg:flex flex-col bg-[#20252B] border-r border-[#333B44] transition-[width] duration-200 overflow-hidden contain-layout shrink-0 transform-gpu",
        expandedClass
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#333B44] min-h-[40px] overflow-hidden">
        <Link href={ROUTES.FEEDS} className="flex items-center gap-2 shrink-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-[#0EA5E9] text-white font-bold text-[9px] shrink-0">
            F
          </div>
          {isExpanded && (
            <span className="text-[12px] text-[#E2E8F0] font-bold tracking-tight whitespace-nowrap">
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
                "flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-[10px] transition-colors duration-150",
                isActive
                  ? "bg-[#0EA5E9]/15 text-[#7DD3FC] border border-[#0EA5E9]/30"
                  : "text-[#94A3B8] hover:bg-[#2A3038] hover:text-[#E2E8F0] border border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 flex items-center justify-center" />
              {isExpanded && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="px-1.5 py-2 border-t border-[#333B44] space-y-1 bg-[#1E2329]/50">
        <button
          onClick={toggleSidebar}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          className="flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-[10px] text-[#94A3B8] hover:bg-[#2A3038] hover:text-[#E2E8F0] transition-colors"
        >
          {isExpanded ? (
            <>
              <PanelLeftClose className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5 shrink-0 mx-auto" />
          )}
        </button>

        <button
          onClick={signOut}
          title={!isExpanded ? "Sign out" : undefined}
          className="flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-[10px] text-[#94A3B8] hover:bg-[rgba(239,68,68,0.15)] hover:text-[#FCA5A5] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {isExpanded && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
