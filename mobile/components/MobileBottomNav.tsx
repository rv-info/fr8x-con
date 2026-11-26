'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationIcon, NavIconName } from '@/components/ui/NavigationIcon';

const PRIMARY_ITEMS: { id: NavIconName; href: string; label: string }[] = [
  { id: 'dashboard', href: '/dashboard', label: 'Home' },
  { id: 'feeds', href: '/feeds', label: 'Feeds' },
  { id: 'rates', href: '/rates', label: 'Rates' },
  { id: 'auctions', href: '/auctions', label: 'Auctions' },
  { id: 'network', href: '/network', label: 'Network' },
];

export function MobileBottomNav() {
  const pathname = usePathname() || '/';

  const isItemActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/network') {
      return (
        pathname === '/network' ||
        pathname.startsWith('/network/') ||
        pathname === '/people' ||
        pathname.startsWith('/people/') ||
        pathname === '/connections' ||
        pathname.startsWith('/connections/') ||
        pathname === '/contacts' ||
        pathname.startsWith('/contacts/')
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fr8x-m-bottomnav" aria-label="Mobile Bottom Navigation">
      <div className="fr8x-m-bottomnav-inner">
        {PRIMARY_ITEMS.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`fr8x-m-bottomnav-item ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <NavigationIcon name={item.id} filled={active} size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
