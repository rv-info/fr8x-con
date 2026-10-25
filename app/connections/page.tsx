'use client';

/**
 * /connections — Unified redirect to /people hub
 *
 * Enterprise Network Contacts & Directory is now unified with People.
 * This route permanently redirects to /people with the appropriate tab
 * so both sidebar links lead to the same integrated page.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConnectionsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'connections';

  useEffect(() => {
    // Replace rather than push — avoids a dead back-button stop
    router.replace(`/people?tab=${tab}`);
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
        background: '#f8fafc',
      }}
    >
      {/* FR8X custom loader */}
      <div className="fr8x-loader" aria-label="Loading Enterprise Network…" role="status" />
      <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
        Opening Enterprise Network Contacts &amp; Directory…
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
            background: '#f8fafc',
          }}
        >
          <div className="fr8x-loader" aria-label="Loading…" role="status" />
        </div>
      }
    >
      <ConnectionsRedirect />
    </Suspense>
  );
}
