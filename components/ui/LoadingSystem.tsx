'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDelayedLoading } from '@/lib/hooks/useDelayedLoading';
import './loading.css';

export type OrbSize = 'inline' | 'compact' | 'section' | 'page';

export interface AnimatedOrbProps {
  size?: OrbSize;
  tone?: 'default' | 'on-dark';
  className?: string;
}

export function AnimatedOrb({
  size = 'section',
  tone = 'default',
  className = '',
}: AnimatedOrbProps) {
  return (
    <span
      aria-hidden="true"
      className={`fr8x-orb fr8x-orb--${size} ${tone === 'on-dark' ? 'fr8x-orb--on-dark' : ''} ${className}`.trim()}
    >
      <span className="fr8x-orb-glow" />
      <span className="fr8x-orb-ring-outer" />
      <span className="fr8x-orb-ring-inner" />
      <span className="fr8x-orb-core" />
    </span>
  );
}

export type OrbLoaderVariant = 'page' | 'section' | 'inline' | 'refresh' | 'modal' | 'upload';

export interface OrbLoaderProps {
  variant?: OrbLoaderVariant;
  message?: string;
  stage?: string;
  active?: boolean;
  delayMs?: number;
  error?: string | null;
  onRetry?: () => void;
  /** Optional real measured progress (0-100). Never fabricated. */
  progress?: number;
  className?: string;
}

export function OrbLoader({
  variant = 'section',
  message = 'Waiting for server response…',
  stage,
  active = true,
  delayMs = 180,
  error = null,
  onRetry,
  progress,
  className = '',
}: OrbLoaderProps) {
  const visible = useDelayedLoading(active && !error, delayMs);

  if (error) {
    return (
      <div
        role="alert"
        className={`fr8x-loader-section ${className}`.trim()}
        style={{
          borderColor: 'rgba(185, 28, 28, 0.25)',
          background: '#FEF2F2',
          padding: variant === 'inline' || variant === 'refresh' ? '10px 14px' : undefined,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#B91C1C', fontWeight: 700, fontSize: '13.5px' }}>
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              minHeight: '38px',
              borderRadius: '8px',
              border: 'none',
              background: '#26313A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (!active || !visible) {
    return null;
  }

  const orbSize: OrbSize =
    variant === 'page'
      ? 'page'
      : variant === 'section' || variant === 'modal'
        ? 'section'
        : variant === 'upload'
          ? 'compact'
          : 'inline';

  if (variant === 'inline') {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`fr8x-loader-inline ${className}`.trim()}
      >
        <AnimatedOrb size="inline" />
        <span>{message}</span>
      </span>
    );
  }

  if (variant === 'refresh') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`fr8x-loader-refresh ${className}`.trim()}
      >
        <AnimatedOrb size="inline" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'upload') {
    const clamped = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : null;
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`fr8x-loader-section ${className}`.trim()}
        style={{ padding: '16px' }}
      >
        <AnimatedOrb size="compact" />
        <p className="fr8x-loader-message">
          {message}
          {clamped !== null ? ` (${clamped}%)` : ''}
        </p>
        {stage && <p className="fr8x-loader-stage">{stage}</p>}
        {clamped !== null && (
          <div
            style={{
              width: '100%',
              maxWidth: '260px',
              height: '6px',
              borderRadius: '9999px',
              background: '#E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${clamped}%`,
                height: '100%',
                background: '#26313A',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${variant === 'page' ? 'fr8x-loader-page' : 'fr8x-loader-section'} ${className}`.trim()}
    >
      <AnimatedOrb size={orbSize} />
      <p className="fr8x-loader-message">{message}</p>
      {stage && <p className="fr8x-loader-stage">{stage}</p>}
    </div>
  );
}

/**
 * Restrained top route-transition bar shown only when a route transition takes
 * longer than 160ms, clearing immediately once the new route has painted.
 */
export function RouteTransitionBar() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    setTransitioning(true);
    const raf = window.requestAnimationFrame(() => {
      setTransitioning(false);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pathname]);

  const visible = useDelayedLoading(transitioning, 160);
  if (!visible) return null;

  return (
    <div className="fr8x-route-bar" role="status" aria-label="Navigating workspace">
      <div className="fr8x-route-bar-indicator" />
    </div>
  );
}
