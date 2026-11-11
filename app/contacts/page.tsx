'use client';

/**
 * /contacts — Backward-compatible redirect to unified /network CRM
 *
 * All Contacts & Network CRM features are now consolidated in /network?tab=crm.
 * This route preserves deep links and bookmarks by redirecting to /network.
 */

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ContactsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'discover') {
      router.replace('/network?tab=discover');
    } else if (tab === 'incoming' || tab === 'outgoing' || tab === 'held') {
      router.replace(`/network?tab=requests&filter=${tab}`);
    } else {
      router.replace('/network?tab=crm');
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#ffffff',
      }}
    >
      <div className="fr8x-loader" aria-label="Loading Enterprise CRM…" role="status" />
      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
        Opening Enterprise Network &amp; CRM Contacts…
      </p>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="fr8x-loader" />
        </div>
      }
    >
      <ContactsRedirect />
    </Suspense>
  );
}
