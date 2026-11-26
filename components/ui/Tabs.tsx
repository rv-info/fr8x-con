'use client';

import React, { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'segmented';
  className?: string;
}

export function Tabs({ items, activeId, onChange, variant = 'pill', className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        padding: variant === 'segmented' ? '4px' : '2px',
        background: variant === 'segmented' ? 'var(--surface-recessed, #ECEDEF)' : 'transparent',
        borderRadius: variant === 'segmented' ? '14px' : '0px',
        border: variant === 'segmented' ? '1px solid var(--border-default, #E0E1E3)' : 'none',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              padding: '0 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: isActive ? 600 : 500,
              background: isActive ? 'var(--surface-primary, #FFFFFF)' : 'transparent',
              color: item.disabled
                ? 'var(--text-disabled, #A8ABB0)'
                : isActive
                ? 'var(--text-primary, #20242B)'
                : 'var(--text-secondary, #777B82)',
              border: isActive
                ? '1px solid var(--border-default, #E0E1E3)'
                : '1px solid transparent',
              boxShadow: isActive ? 'var(--shadow-card)' : 'none',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  background: isActive ? 'var(--surface-secondary, #EDEDEF)' : 'var(--surface-recessed, #ECEDEF)',
                  color: 'var(--text-secondary, #777B82)',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
