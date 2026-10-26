'use client';

import React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = '',
  style,
}: EmptyStateProps) {
  return (
    <div
      className={`fr8x-empty-state ${className}`}
      role="region"
      aria-label={title}
      style={{
        padding: '36px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid var(--fr8x-outline, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            color: 'var(--brand, #1168d7)',
            opacity: 0.85,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className="text-slate-900"
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--ink, #0f172a)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: '0 0 10px 0',
            fontSize: '12px',
            color: 'var(--mut, #64748b)',
            maxWidth: '380px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '4px',
            flexWrap: 'wrap',
          }}
        >
          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                className="btn primary sm min-h-[44px]"
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontWeight: 600,
                }}
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="btn primary sm min-h-[44px]"
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontWeight: 600,
                }}
              >
                {actionLabel}
              </button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className="btn secondary sm min-h-[44px]"
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontWeight: 600,
                }}
              >
                {secondaryActionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="btn secondary sm min-h-[44px]"
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontWeight: 600,
                }}
              >
                {secondaryActionLabel}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
