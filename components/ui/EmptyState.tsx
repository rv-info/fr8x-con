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
        border: '1px solid #E2E8F0',
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
            color: '#64748B',
            opacity: 1,
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
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: '0 0 10px 0',
            fontSize: '12.5px',
            color: '#475569',
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
                className="btn primary sm min-h-[38px]"
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid #111827',
                  borderRadius: '6px',
                }}
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="btn primary sm min-h-[38px]"
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid #111827',
                  borderRadius: '6px',
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
                className="btn secondary sm min-h-[38px]"
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontWeight: 500,
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                }}
              >
                {secondaryActionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="btn secondary sm min-h-[38px]"
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontWeight: 500,
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
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
