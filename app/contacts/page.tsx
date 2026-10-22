'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ContactsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      router.replace(`/people?tab=${encodeURIComponent(tab)}`);
    } else {
      router.replace('/people');
    }
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontSize: '14px' }}>
      Redirecting to People Hub...
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
      <ContactsRedirectContent />
    </Suspense>
  );
}
