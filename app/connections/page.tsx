'use client';

/**
 * /connections — Unified redirect to /network hub
 *
 * Enterprise Network Contacts & Directory is consolidated into /network.
 * Supports tabbed management: 'connections' (My Contacts), 'incoming' (Received Requests), 'outgoing' (Sent Requests), and 'withdrawn' (Withdrawn Requests)
 * interacting with /api/people/connections backend.
 * Outgoing requests provide clear Withdraw action instead of generic cancel.
 * This route permanently redirects to /network with the appropriate tab.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConnectionsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'connections';

  useEffect(() => {
    if (tab === 'incoming' || tab === 'outgoing' || tab === 'withdrawn') {
      router.replace(`/network?tab=requests&filter=${tab}`);
    } else {
      router.replace(`/network?tab=connections`);
    }
  }, [router, tab]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        background: '#ffffff',
      }}
    >
      <div className="fr8x-loader" aria-label="Loading Enterprise Network…" role="status" />
      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
        Redirecting to Unified Network…
      </p>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          <div className="fr8x-loader" />
        </div>
      }
    >
      <ConnectionsRedirect />
    </Suspense>
  );
}
