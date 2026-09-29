'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>FR8X System Exception</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#0a0f1d',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '90%',
            padding: '32px',
            background: '#131b2e',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px', color: '#f8fafc' }}>
            System Core Exception
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
            The application encountered a critical root exception. Our resiliency shield has prevented data corruption.
          </p>
          {error?.digest && (
            <p style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', margin: '0 0 16px' }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload Platform Core
          </button>
        </div>
      </body>
    </html>
  );
}
