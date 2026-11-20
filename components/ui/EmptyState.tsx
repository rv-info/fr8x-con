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
        border: '1px solid #D6E2DA',
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
            color: '#12372A',
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
        className="text-slate-900"
        style={{
          margin: 0,
          fontSize: '11px',
          fontWeight: 700,
          color: '#12372A',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: '0 0 10px 0',
            fontSize: '11px',
            color: '#12372A',
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
                  background: '#3FA66B',
                  color: '#FFFFFF',
                  border: '1px solid #3FA66B',
                  borderRadius: '4px',
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
                  background: '#3FA66B',
                  color: '#FFFFFF',
                  border: '1px solid #3FA66B',
                  borderRadius: '4px',
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
