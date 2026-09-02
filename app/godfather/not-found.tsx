'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import Link from 'next/link';
import { ArrowRight, Shield, ShieldCheck } from 'lucide-react';

export default function GodfatherNotFoundPage() {
  const router = useRouter();
  const { isAuthenticated } = useGodfatherAuth();

  useEffect(() => {
    // Fast seamless redirect to Godfather login or console
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/godfather');
      } else {
        router.replace('/godfather/login?reason=not_found');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        padding: '20px',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '36px 28px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
            GODFATHER · FR8X
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {isAuthenticated
              ? 'Redirecting to Super Admin Overview Console…'
              : 'Privileged session unverified or route expired. Redirecting to operator login…'}
          </p>
        </div>

        {/* Loading Spinner */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #334155',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <Link
            href="/godfather/login"
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
            <span>Proceed to Operator Login</span>
            <ArrowRight size={15} />
          </Link>

          {isAuthenticated && (
            <Link
              href="/godfather"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#334155',
                color: '#e2e8f0',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ShieldCheck size={15} style={{ color: '#38bdf8' }} />
              <span>Go to Admin Dashboard</span>
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
