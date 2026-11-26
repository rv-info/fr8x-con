'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Check } from 'lucide-react';

export function StandardCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface-card, #F6F6F6)',
        border: '1px solid var(--border-default, #E0E1E3)',
        borderRadius: 'var(--radius-card, 18px)',
        boxShadow: 'var(--shadow-card)',
        padding: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ElevatedCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface-primary, #FFFFFF)',
        border: '1px solid var(--border-default, #E0E1E3)',
        borderRadius: 'var(--radius-card, 18px)',
        boxShadow: 'var(--shadow-elevated)',
        padding: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      style={{
        background: 'var(--surface-primary, #FFFFFF)',
        border: '1px solid var(--border-default, #E0E1E3)',
        borderRadius: 'var(--radius-kpi, 14px)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary, #777B82)',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: 'var(--icon-inactive, #858A91)' }}>{icon}</span>}
      </div>
      <div
        className="ui-tabular"
        style={{
          fontSize: '23px',
          fontWeight: 600,
          lineHeight: 1.15,
          color: 'var(--text-primary, #20242B)',
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 500,
            color:
              deltaPositive === undefined
                ? 'var(--text-secondary, #777B82)'
                : deltaPositive
                ? 'var(--accent-success, #19876D)'
                : 'var(--accent-primary, #C95038)',
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12.5px',
        color: disabled ? 'var(--text-disabled, #A8ABB0)' : 'var(--text-content, #26292F)',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '18px',
          height: '18px',
          minWidth: '18px',
          padding: 0,
          borderRadius: '5px',
          border: checked
            ? '1px solid var(--accent-primary, #26313A)'
            : '1px solid var(--border-interactive, #D9DBDE)',
          background: checked ? 'var(--accent-primary, #26313A)' : 'var(--surface-primary, #FFFFFF)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={12} strokeWidth={2.5} />}
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12.5px',
        color: disabled ? 'var(--text-disabled, #A8ABB0)' : 'var(--text-content, #26292F)',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '38px',
          height: '22px',
          padding: '2px',
          borderRadius: '9999px',
          border: 'none',
          background: checked ? 'var(--accent-primary, #26313A)' : 'var(--border-strong, #C5C8CD)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
          }}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10060,
            background: 'var(--surface-primary, #FFFFFF)',
            color: 'var(--text-primary, #20242B)',
            border: '1px solid var(--border-default, #E0E1E3)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-floating)',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function ActionDropdown({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode;
  items: { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex' }}>
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            minWidth: '185px',
            zIndex: 10040,
            background: 'var(--surface-elevated, #FFFFFF)',
            border: '1px solid var(--border-default, #E0E1E3)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-floating)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onClick();
              }}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                fontSize: '12.5px',
                fontWeight: 500,
                color: item.danger ? 'var(--accent-primary, #C95038)' : 'var(--text-primary, #20242B)',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
