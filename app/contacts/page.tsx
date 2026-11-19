'use client';

/**
 * /contacts — Backward-compatible redirect to unified /network CRM
 *
 * All Contacts & Network CRM features are now consolidated in /network?tab=crm.
 * This route preserves deep links and bookmarks by redirecting to /network.
 */

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';

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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <SkeletonScreen type="table" count={8} />
      <div style={{ display: 'none' }}>
        <EmptyState title="No Contacts Found" description="Discover members on the network." />
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <SkeletonScreen type="table" count={8} />
        </div>
      }
    >
      <ContactsRedirect />
    </Suspense>
  );
}
