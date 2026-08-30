import React from 'react';
import type { Metadata } from 'next';
import { GodfatherAuthProvider } from '@/lib/godfather/context/GodfatherAuthContext';
import { GodfatherDataProvider } from '@/lib/godfather/context/GodfatherDataContext';
import { GodfatherShell } from '@/components/godfather/GodfatherShell';

export const metadata: Metadata = {
  title: 'GODFATHER · FR8X Platform Super Admin Console',
  description: 'Privileged internal governance, operations, moderation, billing and audit console for authorized Con.FR8X.IN operators.',
};

export default function GodfatherRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <GodfatherAuthProvider>
      <GodfatherDataProvider>
        <GodfatherShell>{children}</GodfatherShell>
      </GodfatherDataProvider>
    </GodfatherAuthProvider>
  );
}
