'use client';

import React from 'react';
import { AnimatedOrb } from './LoadingSystem';
import { useDelayedLoading } from '@/lib/hooks/useDelayedLoading';
import './loading.css';

export type SkeletonType =
  | 'card'
  | 'row'
  | 'feed'
  | 'table'
  | 'text'
  | 'kpi'
  | 'auction'
  | 'details'
  | 'form'
  | 'chart'
  | 'list'
  | 'modal';

export interface SkeletonProps {
  type?: SkeletonType;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  showStatusHeader?: boolean;
  delayMs?: number;
}

export function SkeletonScreen({
  type = 'card',
  count = 3,
  className = '',
  style,
  label = 'Loading content…',
  showStatusHeader,
  delayMs = 0,
}: SkeletonProps) {
  const visible = useDelayedLoading(true, delayMs);
  if (!visible) return null;

  const items = Array.from({ length: Math.max(1, count) });
  const shouldShowHeader =
    showStatusHeader ?? (type === 'table' || type === 'feed' || type === 'auction' || type === 'form' || type === 'chart' || type === 'modal');

  const commonAccessibilityProps = {
    role: 'status' as const,
    'aria-busy': true as const,
    'aria-live': 'polite' as const,
    'aria-label': label,
  };

  const srOnlyNotice = (
    <span
      className="sr-only"
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

  const statusHeader = shouldShowHeader ? (
    <div className="fr8x-skeleton-header">
      <AnimatedOrb size="inline" />
      <span>{label}</span>
    </div>
  ) : null;

  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--surface-secondary, #F1F5F9) 25%, var(--border-subtle, #E5E7EB) 50%, var(--surface-secondary, #F1F5F9) 75%)',
    backgroundSize: '200% 100%',
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
              background: 'var(--surface-primary, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E5E7EB)',
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
        {statusHeader}
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              background: 'var(--surface-primary, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E5E7EB)',
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
        {statusHeader && <div style={{ gridColumn: '1 / -1' }}>{statusHeader}</div>}
        {statusHeader}
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              background: 'var(--surface-primary, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E5E7EB)',
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
          border: '1px solid var(--border-subtle, #E5E7EB)',
          borderRadius: '8px',
          overflow: 'hidden',
          ...style,
        }}
      >
        {srOnlyNotice}
        {statusHeader && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', background: 'var(--surface-primary, #FFFFFF)' }}>
            {statusHeader}
          </div>
        )}
        <div style={{ height: '38px', background: 'var(--surface-secondary, #F8FAFC)', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '16px' }}>
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
              borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle, #E5E7EB)' : 'none',
              background: i % 2 === 0 ? 'var(--surface-primary, #FFFFFF)' : 'var(--surface-secondary, #F8FAFC)',
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

  if (type === 'form') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{
          padding: '16px',
          background: 'var(--surface-primary, #FFFFFF)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          ...style,
        }}
      >
        {srOnlyNotice}
        {statusHeader}
        {items.map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="fr8x-skeleton-shimmer" style={{ width: '32%', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div className="fr8x-skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '8px', ...shimmerStyle }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <div className="fr8x-skeleton-shimmer" style={{ width: '132px', height: '40px', borderRadius: '8px', ...shimmerStyle }} />
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{
          padding: '16px',
          background: 'var(--surface-primary, #FFFFFF)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          ...style,
        }}
      >
        {srOnlyNotice}
        {statusHeader}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div className="fr8x-skeleton-shimmer" style={{ width: '38%', height: '16px', borderRadius: '4px', ...shimmerStyle }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="fr8x-skeleton-shimmer" style={{ width: '54px', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div className="fr8x-skeleton-shimmer" style={{ width: '54px', height: '12px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
        </div>
        <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '8px 4px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
          {[42, 74, 58, 88, 64, 92, 50, 78].map((h, idx) => (
            <div
              key={idx}
              className="fr8x-skeleton-shimmer"
              style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0', ...shimmerStyle }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="fr8x-skeleton-shimmer" style={{ width: '16%', height: '10px', borderRadius: '4px', ...shimmerStyle }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'modal') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 4px', ...style }}
      >
        {srOnlyNotice}
        {statusHeader}
        <div className="fr8x-skeleton-shimmer" style={{ width: '55%', height: '18px', borderRadius: '4px', ...shimmerStyle }} />
        <div className="fr8x-skeleton-shimmer" style={{ width: '100%', height: '64px', borderRadius: '8px', ...shimmerStyle }} />
        <div className="fr8x-skeleton-shimmer" style={{ width: '85%', height: '14px', borderRadius: '4px', ...shimmerStyle }} />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div
        className={`skeleton-container ${className}`}
        {...commonAccessibilityProps}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', ...style }}
      >
        {srOnlyNotice}
        {statusHeader}
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              background: 'var(--surface-primary, #FFFFFF)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div className="fr8x-skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0, ...shimmerStyle }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="fr8x-skeleton-shimmer" style={{ width: '48%', height: '13px', borderRadius: '4px', ...shimmerStyle }} />
              <div className="fr8x-skeleton-shimmer" style={{ width: '72%', height: '11px', borderRadius: '4px', ...shimmerStyle }} />
            </div>
            <div className="fr8x-skeleton-shimmer" style={{ width: '64px', height: '28px', borderRadius: '6px', flexShrink: 0, ...shimmerStyle }} />
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
            background: 'var(--surface-primary, #FFFFFF)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, #E5E7EB)',
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
