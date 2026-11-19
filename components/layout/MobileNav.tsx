'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BiHouse as LayoutDashboard,
  BiRss as Rss,
  BiGlobe2 as Globe2,
  BiHammer as Gavel,
  BiPeople as Users,
} from '@/components/ui/BootstrapIcons';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/feeds', label: 'Feeds', icon: Rss },
    { href: '/nexus', label: 'Nexus', icon: Globe2 },
    { href: '/auctions', label: 'Auctions', icon: Gavel },
    { href: '/network', label: 'Network', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions') return pathname === '/auctions' || pathname.startsWith('/auctions/');
    if (href === '/network' || href === '/people' || href === '/connections' || href === '/contacts') {
      return (
        pathname === '/network' ||
        pathname.startsWith('/network/') ||
        pathname === '/people' ||
        pathname.startsWith('/people') ||
        pathname === '/connections' ||
        pathname.startsWith('/connections') ||
        pathname === '/contacts' ||
        pathname.startsWith('/contacts')
      );
    }
    if (href === '/nexus') return pathname === '/nexus' || pathname.startsWith('/nexus');
    if (href === '/rates') return pathname === '/rates' || pathname.startsWith('/rates');
    if (href === '/feeds') return pathname === '/feeds' || pathname.startsWith('/feeds');
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
