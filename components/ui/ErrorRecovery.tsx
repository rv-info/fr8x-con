'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorRecoveryProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  preserveWorkNotice?: boolean;
  secondaryAction?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ErrorRecovery({
  title = 'Action could not be completed',
  message,
  onRetry,
  retryLabel = 'Try Again',
  preserveWorkNotice = true,
  secondaryAction,
  className = '',
  style,
}: ErrorRecoveryProps) {
  return (
    <div
      role="alert"
      className={`fr8x-error-recovery ${className}`}
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: '13px', display: 'block', color: '#991b1b' }}>{title}</b>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#b91c1c', lineHeight: 1.4 }}>
            {message}
          </p>
          {preserveWorkNotice && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#7f1d1d', background: '#fee2e2', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>✓</span>
              <span>Work Preserved: Your form inputs and session drafts remain intact.</span>
            </div>
          )}
        </div>
      </div>

      {(onRetry || secondaryAction) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingLeft: '28px' }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn primary sm"
              style={{
                background: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff',
                minHeight: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
