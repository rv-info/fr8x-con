// FR8X-CON Sidebar — Compact, icon-only by default, hover-expands
// Matches spec: tight nav, tiny avatar, compact rows

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  TrendingUp,
  User,
  Award,
  ShieldAlert,
  Settings,
  LogOut,
  Bookmark,
  FileText,
  Tag,
  Building2,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Feeds",     href: ROUTES.FEEDS,         icon: LayoutDashboard },
  { label: "Auctions",  href: ROUTES.AUCTIONS,      icon: Gavel },
  { label: "Rates",     href: ROUTES.RATES,         icon: TrendingUp },
  { label: "Profile",   href: ROUTES.PROFILE,       icon: User },
  { label: "Saved Posts", href: ROUTES.SAVED_POSTS, icon: Bookmark },
  { label: "My RFQs",   href: ROUTES.MY_RFQS,       icon: FileText },
  { label: "Followed Tags", href: ROUTES.FOLLOWED_TAGS, icon: Tag },
  { label: "Company",   href: ROUTES.COMPANY_PAGE,  icon: Building2 },
  { label: "Awards",    href: ROUTES.AWARDS,        icon: Award },
  { label: "Blacklist", href: ROUTES.BLACKLIST,     icon: ShieldAlert },
];


export function Sidebar() {
  const [hovered, setHovered] = useState(false);
  const pathname  = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-border transition-[width] duration-150 overflow-hidden contain-layout",
        hovered ? "w-[168px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-1.5 py-2 border-b border-border min-h-[36px] overflow-hidden">
        <Link href={ROUTES.FEEDS} className="flex items-center gap-1.5 shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--fr8x-periwinkle)] text-white font-bold text-[11px] shrink-0">
            F
          </div>
          {hovered && (
            <span className="text-[11px] text-[var(--fr8x-jet)] font-bold tracking-tight whitespace-nowrap">
              {APP_NAME}
            </span>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-1 py-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={!hovered ? item.label : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] transition-colors duration-100",
                isActive
                  ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] font-semibold"
                  : "text-foreground-secondary hover:bg-[var(--fr8x-mist)] hover:text-[var(--fr8x-jet)]"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {hovered && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin link — shown only to GodMode, never labelled "GodMode" in nav */}
        {user?.isGodMode && (
          <Link
            href={ROUTES.GODMODE}
            title={!hovered ? "Admin" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] transition-colors duration-100",
              pathname.startsWith("/godmode")
                ? "bg-warning-light text-warning-dark font-semibold"
                : "text-foreground-secondary hover:bg-warning-light/60 hover:text-warning-dark"
            )}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            {hovered && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-1 py-1.5 border-t border-border">
        <button
          onClick={signOut}
          title={!hovered ? "Sign out" : undefined}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-[11px] text-foreground-secondary hover:bg-danger-light hover:text-danger-dark transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {hovered && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
