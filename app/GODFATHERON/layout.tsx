import React from 'react';
import type { Metadata } from 'next';
import { GodfatherAuthProvider } from '@/lib/godfather/context/GodfatherAuthContext';
import { GodfatherDataProvider } from '@/lib/godfather/context/GodfatherDataContext';

export const metadata: Metadata = {
  title: 'GODFATHER ON · FR8X Dedicated Admin Login',
  description: 'Restricted administrative portal for authorized Con.FR8X.IN operators.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DedicatedGodfatherLayout({ children }: { children: React.ReactNode }) {
  return (
    <GodfatherAuthProvider>
      <GodfatherDataProvider>
        <div className="gf-login-root">{children}</div>
      </GodfatherDataProvider>
    </GodfatherAuthProvider>
  );
}
