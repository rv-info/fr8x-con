'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  headerActions?: ReactNode;
  style?: React.CSSProperties;
  zIndex?: number;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '920px',
  isFullScreen = false,
  onToggleFullScreen,
  headerActions,
  style,
  zIndex,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modalbg"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        backgroundColor: 'rgba(32, 36, 43, 0.38)',
        backdropFilter: 'blur(3px)',
        ...(isFullScreen ? { padding: 0 } : {}),
        ...(zIndex ? { zIndex } : {}),
      }}
    >
      <div
        className={`modal ${isFullScreen ? 'is-fullscreen' : ''}`}
        style={{
          maxWidth: isFullScreen ? '100vw' : maxWidth,
          width: isFullScreen ? '100vw' : '100%',
          height: isFullScreen ? '100vh' : undefined,
          maxHeight: isFullScreen ? '100vh' : '92vh',
          borderRadius: isFullScreen ? 0 : '20px',
          margin: isFullScreen ? 0 : undefined,
          display: isFullScreen ? 'flex' : undefined,
          flexDirection: isFullScreen ? 'column' : undefined,
          background: 'var(--surface-primary, #FFFFFF)',
          boxShadow: 'var(--shadow-floating)',
          ...style,
        }}
      >
        <div
          className="modalhead"
          style={{
            flexShrink: 0,
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle, #E7E7E8)',
          }}
        >
          <b style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary, #20242B)' }}>{title}</b>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headerActions}
            <button
              type="button"
              className="close"
              onClick={onClose}
              aria-label="Close modal"
              title="Close"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: '10px',
                border: '1px solid var(--border-default, #E0E1E3)',
                background: 'var(--surface-primary, #FFFFFF)',
                color: 'var(--text-secondary, #777B82)',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div
          className="modalbody"
          style={{
            ...(isFullScreen || style?.display === 'flex'
              ? { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }
              : {}),
          }}
        >
          {children}
        </div>
        {footer && <div className="modalfoot" style={{ flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}
