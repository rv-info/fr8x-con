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
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modalbg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={isFullScreen ? { padding: 0 } : undefined}
    >
      <div
        className={`modal ${isFullScreen ? 'is-fullscreen' : ''}`}
        style={{
          maxWidth: isFullScreen ? '100vw' : maxWidth,
          width: isFullScreen ? '100vw' : '100%',
          height: isFullScreen ? '100vh' : undefined,
          maxHeight: isFullScreen ? '100vh' : '92vh',
          borderRadius: isFullScreen ? 0 : undefined,
          margin: isFullScreen ? 0 : undefined,
          display: isFullScreen ? 'flex' : undefined,
          flexDirection: isFullScreen ? 'column' : undefined,
          ...style,
        }}
      >
        <div className="modalhead" style={{ flexShrink: 0 }}>
          <b>{title}</b>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headerActions}
            <button className="close" onClick={onClose} aria-label="Close modal">
              <X size={16} />
            </button>
          </div>
        </div>
        <div
          className="modalbody"
          style={isFullScreen ? { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' } : undefined}
        >
          {children}
        </div>
        {footer && <div className="modalfoot" style={{ flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}
