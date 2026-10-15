'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/feeds');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fallback watchdog: ensure navigation never hangs indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (!isLoading) {
          if (isAuthenticated) {
            window.location.href = '/feeds';
          } else {
            window.location.href = '/login';
          }
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: 'var(--fr8x-text, #1e293b)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <img
          src="/logo.png"
          alt="FR8X"
          style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
        />
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#002b66', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
          FR8X
        </div>
        <div
          style={{
            marginTop: '8px',
            width: '24px',
            height: '24px',
            border: '2px solid #cbd5e1',
            borderTopColor: '#002b66',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fr8x-muted, #475569)', letterSpacing: '0.02em', marginTop: '4px' }}>
          Loading <span style={{ fontWeight: 'bold', color: '#002b66', textTransform: 'uppercase' }}>FR8X</span> Workspace…
        </span>
        <a
          href="/login"
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#002b66',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Taking too long? Click here to sign in
        </a>
      </div>
    </div>
  );
}
