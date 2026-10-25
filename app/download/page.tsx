'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 100% Cloud Web Application - No APK downloads required
    router.replace('/login');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
      }}
    >
      <div className="fr8x-loader" aria-label="Loading..." role="status" />
    </div>
  );
}
