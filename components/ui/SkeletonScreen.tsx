'use client';

import React from 'react';

export type SkeletonType = 'card' | 'row' | 'feed' | 'table' | 'text' | 'kpi' | 'auction' | 'details';

export interface SkeletonProps {
  type?: SkeletonType;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function SkeletonScreen({
  type = 'card',
  count = 3,
  className = '',
  style,
  label = 'Loading content…',
}: SkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  const commonAccessibilityProps = {
    role: 'status' as const,
    'aria-busy': true as const,
    'aria-label': label,
  };

  const srOnlyNotice = (
    <span
      className="sr-only motion-reduce:animate-none"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {label}
    </span>
  );

  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s infinite',
  };

  if (type === 'kpi') {
    return (
      <div
        className={`skeleton-container skeleton-kpi ${className}`}
        {...commonAccessibilityProps}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          ...style,
        }}
      >
        {srOnlyNotice}
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              padding: '12px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--fr8x-outline, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '60%', height: '11px', borderRadius: '4px', ...shimmerStyle }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', ...shimmerStyle }} />
            </div>
            <div style={{ width: '40%', height: '22px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}
      >
        {srOnlyNotice}
        {items.map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              height: '42px',
              borderRadius: '6px',
              ...shimmerStyle,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'feed') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px', ...style }}
      >
        {srOnlyNotice}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  ...shimmerStyle,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ width: '35%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
                <div style={{ width: '20%', height: '9px', borderRadius: '4px', ...shimmerStyle }} />
              </div>
            </div>
            <div style={{ width: '90%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '75%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '50%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'auction') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px', ...style }}
      >
        {srOnlyNotice}
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
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '25%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
              <div style={{ width: '20%', height: '18px', borderRadius: '10px', ...shimmerStyle }} />
            </div>
            <div style={{ width: '70%', height: '16px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '90%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ width: '30%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
              <div style={{ width: '35%', height: '28px', borderRadius: '6px', ...shimmerStyle }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{
          border: '1px solid var(--fr8x-outline, #e2e8f0)',
          borderRadius: '8px',
          overflow: 'hidden',
          ...style,
        }}
      >
        {srOnlyNotice}
        <div style={{ height: '38px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '16px' }}>
          <div style={{ width: '15%', height: '11px', borderRadius: '3px', ...shimmerStyle }} />
          <div style={{ width: '25%', height: '11px', borderRadius: '3px', ...shimmerStyle }} />
          <div style={{ width: '20%', height: '11px', borderRadius: '3px', ...shimmerStyle }} />
          <div style={{ width: '20%', height: '11px', borderRadius: '3px', ...shimmerStyle }} />
          <div style={{ width: '10%', height: '11px', borderRadius: '3px', ...shimmerStyle }} />
        </div>
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
            <div style={{ width: '15%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '25%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '20%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '20%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '10%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
        ))}
      </div>
    );
  }

  // Default card
  return (
    <div
      className={`skeleton-container ${className}`}
      {...commonAccessibilityProps}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        ...style,
      }}
    >
      {srOnlyNotice}
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
            <div style={{ width: '40%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '20%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
          <div style={{ width: '80%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
          <div style={{ width: '60%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <div style={{ width: '25%', height: '20px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '30%', height: '24px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
        </div>
      ))}
    </div>
  );
}
