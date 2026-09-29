'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, LifeBuoy, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalAppError({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Automatically report exception to observability pipeline
    console.error('[FR8X Enterprise Error Boundary]:', error);

    try {
      if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
        const payload = JSON.stringify({
          events: [
            {
              eventId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              eventType: 'system_error',
              actorId: 'client_exception',
              targetId: window.location.pathname,
              timestamp: new Date().toISOString(),
              metadata: {
                message: error.message,
                digest: error.digest,
                stack: error.stack?.slice(0, 1000),
                userAgent: navigator.userAgent,
                url: window.location.href,
              },
            },
          ],
        });
        navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
      }
    } catch {}
  }, [error]);

  const handleClearCacheAndReset = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    } catch {}
    reset();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b1523 0%, #112238 50%, #080f1a 100%)',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 165, 233, 0.1)',
          overflow: 'hidden',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#ef4444',
          }}
        >
          <AlertTriangle size={32} />
        </div>

        {/* Title & Subtitle */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Workspace Exception Intercepted
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          An unexpected runtime state was encountered. Our automated diagnostic telemetry has recorded this incident for engineering triage.
        </p>

        {/* Digest Reference */}
        {error.digest && (
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#38bdf8',
              marginBottom: '24px',
            }}
          >
            Incident Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={handleClearCacheAndReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            }}
          >
            <RotateCcw size={16} />
            Recover Workspace & Retry
          </button>

          <Link
            href="/feeds"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Home size={16} />
            Return to Logistics Feed
          </Link>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div style={{ textAlign: 'left', marginTop: '16px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              margin: '0 auto',
            }}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}
          </button>

          {showDetails && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#f87171',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
              }}
            >
              {error.name}: {error.message}
              {error.stack && `\n\n${error.stack.split('\n').slice(0, 5).join('\n')}`}
            </div>
          )}
        </div>

        {/* Support Link */}
        <div
          style={{
            marginTop: '28px',
            borderTop: '1px solid rgba(51, 65, 85, 0.4)',
            paddingTop: '16px',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <LifeBuoy size={14} color="#0284c7" />
          <span>Need critical assistance?</span>
          <a
            href="mailto:tech@fr8x.in?subject=FR8X%20Platform%20Exception"
            style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}
          >
            Contact tech@fr8x.in
          </a>
        </div>
      </div>
    </div>
  );
}
