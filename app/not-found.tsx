'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const isGodfatherPath = pathname.startsWith('/godfather') || pathname.startsWith('/godfatheron');

    // Fast seamless redirect to login or workspace
    const timer = setTimeout(() => {
      if (isGodfatherPath) {
        const gfAuth = typeof window !== 'undefined' && sessionStorage.getItem('fr8x_godfather_auth') === 'true';
        if (gfAuth) {
          router.replace('/godfather');
        } else {
          router.replace('/godfather/login?reason=not_found');
        }
      } else {
        if (isAuthenticated) {
          router.replace('/feeds');
        } else {
          router.replace('/login?reason=not_found');
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1d31 0%, #152c4a 100%)',
        padding: '20px',
        color: '#fff',
        fontFamily: 'inherit',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '36px 28px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="FR8X"
            style={{
              width: '50px',
              height: '50px',
              margin: '0 auto 14px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
            FR8X Workspace
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {isLoading
              ? 'Verifying session and security credentials…'
              : isAuthenticated
              ? 'Redirecting to your active freight workspace…'
              : 'Session unverified or page expired. Redirecting to login…'}
          </p>
        </div>

        {/* Loading Spinner */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0ea5e9',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}
          >
            <span>Proceed to Login</span>
            <ArrowRight size={15} />
          </Link>

          {isAuthenticated && (
            <Link
              href="/feeds"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ShieldCheck size={15} style={{ color: '#0ea5e9' }} />
              <span>Go to Workspace Feeds</span>
            </Link>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
