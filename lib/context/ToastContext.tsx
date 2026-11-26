'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check, AlertCircle, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastOptions {
  type?: ToastType;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function inferToastType(message: string, explicit?: ToastType): ToastType {
  if (explicit) return explicit;
  const lower = message.toLowerCase();
  if (lower.includes('error') || lower.includes('failed') || lower.includes('invalid') || lower.includes('blocked')) {
    return 'error';
  }
  if (lower.includes('warning') || lower.includes('review') || lower.includes('pending')) {
    return 'warning';
  }
  if (lower.includes('saved') || lower.includes('created') || lower.includes('success') || lower.includes('updated')) {
    return 'success';
  }
  return 'info';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const type = inferToastType(message, options?.type);
    setToasts((prev) => [...prev, { id, message, description: options?.description, type }]);
    const duration = options?.duration ?? (type === 'loading' ? 6000 : 3200);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div
        className="toastbox"
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '22px',
          right: '22px',
          zIndex: 10090,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const palette =
            t.type === 'success'
              ? { bg: 'var(--accent-success-pale, #E5F1EC)', color: 'var(--accent-success, #19876D)', icon: <Check size={14} /> }
              : t.type === 'error'
              ? { bg: 'var(--accent-pale, #F6E8E4)', color: 'var(--accent-primary, #C95038)', icon: <AlertCircle size={14} /> }
              : t.type === 'warning'
              ? { bg: 'var(--accent-warning-pale, #F5F0E3)', color: 'var(--accent-warning, #C39A48)', icon: <AlertCircle size={14} /> }
              : t.type === 'loading'
              ? { bg: 'var(--accent-info-pale, #EAF0F4)', color: 'var(--accent-info, #7FA6C2)', icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> }
              : { bg: 'var(--accent-info-pale, #EAF0F4)', color: 'var(--accent-info, #7FA6C2)', icon: <Info size={14} /> };

          return (
            <div
              key={t.id}
              className="toast"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--surface-primary, #FFFFFF)',
                color: 'var(--text-primary, #20242B)',
                border: '1px solid var(--border-default, #E0E1E3)',
                borderRadius: '14px',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-floating)',
              }}
            >
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: palette.bg,
                  color: palette.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {palette.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, lineHeight: 1.3 }}>{t.message}</div>
                {t.description && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #777B82)', marginTop: '2px' }}>
                    {t.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--icon-inactive, #858A91)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
