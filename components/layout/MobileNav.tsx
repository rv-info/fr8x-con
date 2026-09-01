'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Rss,
  BarChart3,
  Gavel,
  Globe2,
  Briefcase,
  UserCheck,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/feeds', label: 'Feeds', icon: Rss },
    { href: '/rates', label: 'Rates', icon: BarChart3 },
    { href: '/auctions', label: 'Auctions', icon: Gavel },
    { href: '/nexus', label: 'Nexus', icon: Globe2 },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/profile', label: 'Profile', icon: UserCheck },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions') return pathname === '/auctions' || pathname.startsWith('/auctions/');
    return pathname === href;
  };

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon size={17} />
                {active && <span className="mobile-nav-active-dot" />}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
