'use client';

import React, { ReactNode } from 'react';

export type BadgeTone = 'success' | 'info' | 'warning' | 'review' | 'inactive';

export interface StatusBadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TONE_MAP: Record<BadgeTone, { bg: string; color: string; border: string }> = {
  success: {
    bg: 'var(--accent-success-pale, #E5F1EC)',
    color: 'var(--accent-success, #19876D)',
    border: 'rgba(25, 135, 109, 0.22)',
  },
  info: {
    bg: 'var(--accent-info-pale, #EAF0F4)',
    color: 'var(--accent-info, #5C86A4)',
    border: 'rgba(127, 166, 194, 0.28)',
  },
  warning: {
    bg: 'var(--accent-warning-pale, #F5F0E3)',
    color: 'var(--accent-warning, #A47E32)',
    border: 'rgba(195, 154, 72, 0.28)',
  },
  review: {
    bg: 'var(--accent-pale, #F6E8E4)',
    color: 'var(--accent-primary, #C95038)',
    border: 'rgba(201, 80, 56, 0.24)',
  },
  inactive: {
    bg: 'var(--accent-neutral-pale, #ECEDEF)',
    color: 'var(--text-secondary, #777B82)',
    border: 'var(--border-default, #E0E1E3)',
  },
};

export function StatusBadge({ tone = 'inactive', children, dot = false, className = '', style }: StatusBadgeProps) {
  const palette = TONE_MAP[tone];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '9.5px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.25,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: palette.color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
