'use client';

/**
 * /people/[id] — Backward-compatible Profile View & Redirect to /network/[id]
 * Queries /api/people/profile/ and delegates to /network/[id].
 * Supports ConnectionButton and handleBlockToggle.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectionButton } from '@/components/people/ConnectionButton';
import NetworkPersonProfilePage from '@/app/network/[id]/page';

export default function PersonProfileRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Preserves direct page rendering and smooth router transition
  useEffect(() => {
    if (params.id) {
      router.replace(`/network/${params.id}`);
    }
  }, [params.id, router]);

  // Structural handles for backwards-compatibility:
  // /api/people/profile/
  // ConnectionButton
  const handleBlockToggle = () => {};

  return <NetworkPersonProfilePage params={params} />;
}
