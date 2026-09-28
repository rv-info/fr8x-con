'use client';

import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'row' | 'feed' | 'table' | 'text';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonScreen({ type = 'card', count = 3, className = '', style }: SkeletonProps) {
  const items = Array.from({ length: count });

  if (type === 'row') {
    return (
      <div className={`skeleton-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
        {items.map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              height: '42px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonShimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'feed') {
    return (
      <div className={`skeleton-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...style }}>
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--fr8x-outline, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Header: avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ width: '35%', height: '12px', borderRadius: '4px', background: '#e2e8f0' }} />
                <div style={{ width: '20%', height: '9px', borderRadius: '4px', background: '#f1f5f9' }} />
              </div>
            </div>
            {/* Body */}
            <div style={{ width: '90%', height: '14px', borderRadius: '4px', background: '#f1f5f9' }} />
            <div style={{ width: '75%', height: '14px', borderRadius: '4px', background: '#f1f5f9' }} />
            <div style={{ width: '50%', height: '14px', borderRadius: '4px', background: '#f1f5f9' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`skeleton-container ${className}`} style={{ border: '1px solid var(--fr8x-outline, #e2e8f0)', borderRadius: '8px', overflow: 'hidden', ...style }}>
        <div style={{ height: '38px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} />
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              height: '46px',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none',
              background: i % 2 === 0 ? '#ffffff' : '#fcfcfc',
            }}
          >
            <div style={{ width: '15%', height: '12px', borderRadius: '4px', background: '#e2e8f0' }} />
            <div style={{ width: '30%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
            <div style={{ width: '20%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
            <div style={{ width: '15%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
          </div>
        ))}
      </div>
    );
  }

  // Default card
  return (
    <div className={`skeleton-container ${className}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', ...style }}>
      {items.map((_, i) => (
        <div
          key={i}
          style={{
            padding: '16px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--fr8x-outline, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '40%', height: '14px', borderRadius: '4px', background: '#e2e8f0' }} />
            <div style={{ width: '20%', height: '14px', borderRadius: '4px', background: '#e2e8f0' }} />
          </div>
          <div style={{ width: '80%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
          <div style={{ width: '60%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <div style={{ width: '25%', height: '20px', borderRadius: '4px', background: '#f1f5f9' }} />
            <div style={{ width: '30%', height: '24px', borderRadius: '4px', background: '#e2e8f0' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
