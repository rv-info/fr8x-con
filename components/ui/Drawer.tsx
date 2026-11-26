'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: 'right' | 'left';
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  side = 'right',
  width = '440px',
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        backgroundColor: 'rgba(32, 36, 43, 0.35)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          background: 'var(--surface-primary, #FFFFFF)',
          borderLeft: side === 'right' ? '1px solid var(--border-default, #E0E1E3)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--border-default, #E0E1E3)' : undefined,
          boxShadow: 'var(--shadow-floating)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: side === 'right' ? '20px 0 0 20px' : '0 20px 20px 0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle, #E7E7E8)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            {subtitle && (
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary, #777B82)',
                  marginBottom: '4px',
                }}
              >
                {subtitle}
              </div>
            )}
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-primary, #20242B)',
              }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '10px',
              border: '1px solid var(--border-default, #E0E1E3)',
              background: 'var(--surface-primary, #FFFFFF)',
              color: 'var(--text-secondary, #777B82)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-subtle, #E7E7E8)',
              background: 'var(--surface-card, #F6F6F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
