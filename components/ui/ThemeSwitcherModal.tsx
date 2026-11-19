'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { Palette, X, Check, Calendar, RefreshCw } from 'lucide-react';

export function ThemeSwitcherModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    theme,
    themeId,
    setThemeId,
    allThemes,
    isGodfatherDefault,
    isAutoScheduled,
    resetToGodfather,
  } = useTheme();

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const emoji = theme.occasion?.accentEmoji || '🌿';

  return (
    <div style={{ position: 'relative' }} ref={modalRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Theme, Palette & Festival Occasion Selector"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '4px',
          background: '#FFFFFF',
          border: '1px solid #DDE7E1',
          color: '#111827',
          fontSize: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Calibri, sans-serif',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: '11px' }}>{emoji}</span>
        <span>{theme.displayName}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '320px',
            background: '#FFFFFF',
            border: '1px solid #DDE7E1',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(17, 24, 39, 0.12)',
            zIndex: 9999,
            padding: '12px',
            fontFamily: 'Calibri, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '8px',
              marginBottom: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Palette size={13} style={{ color: theme.colors.primary }} />
                <span>Theme & Occasion Studio</span>
              </div>
              <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '1px' }}>
                Curated by Godfather Sovereign Design System
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                padding: '2px',
              }}
              title="Close"
            >
              <X size={13} />
            </button>
          </div>

          {/* Quick Schedule Switcher */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              onClick={() => {
                setThemeId('auto');
                setIsOpen(false);
              }}
              style={{
                flex: 1,
                fontSize: '9px',
                fontWeight: 600,
                padding: '5px',
                borderRadius: '4px',
                background: themeId === 'auto' ? '#E8F7EF' : '#F9FAFB',
                color: themeId === 'auto' ? '#15803D' : '#374151',
                border: `1px solid ${themeId === 'auto' ? '#A7F3D0' : '#E5E7EB'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={11} /> Auto Calendar
            </button>

            <button
              onClick={() => {
                resetToGodfather();
                setIsOpen(false);
              }}
              style={{
                flex: 1,
                fontSize: '9px',
                fontWeight: 600,
                padding: '5px',
                borderRadius: '4px',
                background: isGodfatherDefault && themeId !== 'auto' ? '#E8F7EF' : '#F9FAFB',
                color: isGodfatherDefault && themeId !== 'auto' ? '#15803D' : '#374151',
                border: `1px solid ${isGodfatherDefault && themeId !== 'auto' ? '#A7F3D0' : '#E5E7EB'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={11} /> Godfather Default
            </button>
          </div>

          {/* Theme List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '280px', overflowY: 'auto' }}>
            {allThemes.map((item) => {
              const isSelected = theme.id === item.id;
              const itemEmoji = item.occasion?.accentEmoji || '🌿';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setThemeId(item.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: isSelected ? item.colors.activeBackground : '#FFFFFF',
                    border: `1px solid ${isSelected ? item.colors.primary : '#E5E7EB'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px' }}>{itemEmoji}</span>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: isSelected ? 700 : 500, color: '#111827' }}>
                        {item.displayName}
                      </div>
                      <div style={{ fontSize: '9px', color: '#6B7280' }}>
                        {item.category === 'godfather_default' ? 'Enterprise Core' : item.occasion?.tagline || item.category}
                      </div>
                    </div>
                  </div>

                  {/* Swatches */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      title={`Primary: ${item.colors.primary}`}
                      style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.colors.primary }}
                    />
                    <span
                      title={`Border: ${item.colors.borderPrimary}`}
                      style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.colors.borderPrimary, border: '1px solid #D1D5DB' }}
                    />
                    {isSelected && <Check size={12} style={{ color: item.colors.primary, marginLeft: '2px' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
