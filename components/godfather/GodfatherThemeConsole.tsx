'use client';

import React, { useState } from 'react';
import { useTheme, ALL_THEMES, FR8XTheme, ThemeId, detectOccasionTheme } from '@/lib/theme';
import {
  Sparkles,
  Check,
  RefreshCw,
  Palette,
  Calendar,
  Layers,
  Sliders,
  Sun,
  Shield,
  Info,
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

export function GodfatherThemeConsole() {
  const {
    theme,
    themeId,
    setThemeId,
    allThemes,
    activeOccasion,
    isAutoScheduled,
    isGodfatherDefault,
    occasionGreeting,
    resetToGodfather,
  } = useTheme();

  const { toast } = useToast();
  const [selectedPreviewTheme, setSelectedPreviewTheme] = useState<FR8XTheme>(theme);
  const [activeTab, setActiveTab] = useState<'catalog' | 'schedule' | 'inspector'>('catalog');

  const handleSelectTheme = (id: string, name: string) => {
    setThemeId(id);
    toast(`Theme activated: ${name}`);
  };

  const handleReset = () => {
    resetToGodfather();
    toast('Reset to Godfather Enterprise Default theme');
  };

  const handleSetAuto = () => {
    setThemeId('auto');
    const autoTheme = detectOccasionTheme(new Date());
    if (autoTheme) {
      toast(`Auto-Scheduling active: Using ${autoTheme.displayName}`);
    } else {
      toast('Auto-Scheduling active: Godfather Default currently active');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner / Current Status */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #DDE7E1',
          borderRadius: '6px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isGodfatherDefault ? '#E8F7EF' : '#FEF3C7',
                  color: isGodfatherDefault ? '#15803D' : '#B45309',
                  border: `1px solid ${isGodfatherDefault ? '#A7F3D0' : '#FDE68A'}`,
                  textTransform: 'uppercase',
                }}
              >
                {isGodfatherDefault ? 'Godfather Default Active' : 'Custom / Occasion Theme Active'}
              </span>
              {isAutoScheduled && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  ⚡ Auto-Scheduled by Calendar
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '4px 0' }}>
              {theme.occasion?.accentEmoji ? `${theme.occasion.accentEmoji} ` : ''}
              {theme.name}
            </h2>
            <p style={{ fontSize: '10px', color: '#4B5563', margin: 0, maxWidth: '640px' }}>
              {theme.description}
            </p>
            {occasionGreeting && (
              <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: 600, color: theme.colors.primary }}>
                Active Festive Greeting: &ldquo;{occasionGreeting}&rdquo;
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleSetAuto}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '4px',
                background: themeId === 'auto' ? theme.colors.primary : '#FFFFFF',
                color: themeId === 'auto' ? '#FFFFFF' : '#111827',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Calendar size={12} />
              Auto-Occasion Calendar
            </button>

            <button
              onClick={handleReset}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '4px',
                background: isGodfatherDefault && themeId !== 'auto' ? theme.colors.primary : '#FFFFFF',
                color: isGodfatherDefault && themeId !== 'auto' ? '#FFFFFF' : '#111827',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <RefreshCw size={12} />
              Reset to Godfather Default
            </button>
          </div>
        </div>

        {/* Live Color Swatch Bar of Active Theme */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#111827' }}>Active Tokens:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: theme.colors.canvas, border: '1px solid #D1D5DB' }} />
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Canvas: {theme.colors.canvas}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: theme.colors.surface, border: '1px solid #D1D5DB' }} />
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Surface: {theme.colors.surface}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: theme.colors.primary, border: '1px solid #D1D5DB' }} />
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Primary: {theme.colors.primary}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: theme.colors.borderPrimary, border: '1px solid #D1D5DB' }} />
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Border: {theme.colors.borderPrimary}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: theme.colors.textPrimary, border: '1px solid #D1D5DB' }} />
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Text: {theme.colors.textPrimary}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            fontSize: '10px',
            fontWeight: activeTab === 'catalog' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: '4px',
            background: activeTab === 'catalog' ? '#E8F7EF' : 'transparent',
            color: activeTab === 'catalog' ? '#15803D' : '#4B5563',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Theme Catalog ({allThemes.length} Presets)
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            fontSize: '10px',
            fontWeight: activeTab === 'schedule' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: '4px',
            background: activeTab === 'schedule' ? '#E8F7EF' : 'transparent',
            color: activeTab === 'schedule' ? '#15803D' : '#4B5563',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Occasion & Festival Calendar
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          style={{
            fontSize: '10px',
            fontWeight: activeTab === 'inspector' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: '4px',
            background: activeTab === 'inspector' ? '#E8F7EF' : 'transparent',
            color: activeTab === 'inspector' ? '#15803D' : '#4B5563',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          CSS Variables & Token Inspector
        </button>
      </div>

      {/* TAB 1: THEME CATALOG GRID */}
      {activeTab === 'catalog' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '12px',
          }}
        >
          {allThemes.map((item) => {
            const isCurrentlyActive = theme.id === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  border: isCurrentlyActive ? `2px solid ${item.colors.primary}` : '1px solid #DDE7E1',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  position: 'relative',
                  boxShadow: isCurrentlyActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {item.occasion?.accentEmoji && (
                        <span style={{ fontSize: '13px' }}>{item.occasion.accentEmoji}</span>
                      )}
                      <h3 style={{ fontSize: '11px', fontWeight: 700, margin: 0, color: '#111827' }}>
                        {item.name}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: item.isDefault ? '#E8F7EF' : '#F3F4F6',
                        color: item.isDefault ? '#15803D' : '#4B5563',
                      }}
                    >
                      {item.isDefault ? 'Default' : item.category.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '10px', color: '#4B5563', margin: '0 0 10px', minHeight: '38px', lineHeight: 1.35 }}>
                    {item.description}
                  </p>

                  {/* Swatches Container */}
                  <div style={{ background: '#FAFBF7', padding: '8px', borderRadius: '4px', border: '1px solid #E5E7EB', marginBottom: '10px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Palette & Border Lines
                    </div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <div
                        title={`Canvas: ${item.colors.canvas}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.canvas, border: '1px solid #D1D5DB' }}
                      />
                      <div
                        title={`Surface: ${item.colors.surface}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.surface, border: '1px solid #D1D5DB' }}
                      />
                      <div
                        title={`Text Primary: ${item.colors.textPrimary}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.textPrimary, border: '1px solid #D1D5DB' }}
                      />
                      <div
                        title={`Brand Accent: ${item.colors.primary}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.primary, border: '1px solid #D1D5DB' }}
                      />
                      <div
                        title={`Active Nav Pill: ${item.colors.activeBackground}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.activeBackground, border: '1px solid #D1D5DB' }}
                      />
                      <div
                        title={`Border Line: ${item.colors.borderPrimary}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.colors.borderPrimary, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  {item.occasion && (
                    <div style={{ fontSize: '9px', color: '#4B5563', marginBottom: '6px' }}>
                      📅 <strong>Schedule:</strong> {item.occasion.startMonth}/{item.occasion.startDay} – {item.occasion.endMonth}/{item.occasion.endDay}
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div>
                  {isCurrentlyActive ? (
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: '#E8F7EF',
                        color: '#15803D',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      <Check size={12} /> Currently Active on Platform
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectTheme(item.id, item.name)}
                      style={{
                        width: '100%',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#111827',
                        border: '1px solid #D1D5DB',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Activate Theme
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: OCCASION & FESTIVAL SCHEDULE */}
      {activeTab === 'schedule' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE7E1', borderRadius: '6px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            Annual Festival & Occasion Timetable
          </h3>
          <p style={{ fontSize: '10px', color: '#4B5563', margin: '0 0 14px' }}>
            When &ldquo;Auto-Occasion Calendar&rdquo; mode is enabled, the platform automatically switches to the appropriate festival theme during its active window, and reverts to the Godfather Enterprise Default afterwards.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#FAFBF7', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: '#111827', fontWeight: 600 }}>Festival / Occasion</th>
                <th style={{ padding: '8px', color: '#111827', fontWeight: 600 }}>Active Window</th>
                <th style={{ padding: '8px', color: '#111827', fontWeight: 600 }}>Festive Greeting</th>
                <th style={{ padding: '8px', color: '#111827', fontWeight: 600 }}>Action Color</th>
                <th style={{ padding: '8px', color: '#111827', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allThemes
                .filter((t) => t.occasion)
                .map((t) => {
                  const occ = t.occasion!;
                  const isCurrent = theme.id === t.id;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#111827' }}>
                        {occ.accentEmoji} {t.name}
                      </td>
                      <td style={{ padding: '8px', color: '#4B5563' }}>
                        {occ.startMonth}/{occ.startDay} to {occ.endMonth}/{occ.endDay}
                      </td>
                      <td style={{ padding: '8px', color: '#4B5563' }}>
                        &ldquo;{occ.greetingPrefix}&rdquo;
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: t.colors.primary }} />
                          <code>{t.colors.primary}</code>
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {isCurrent ? (
                          <span style={{ fontWeight: 700, color: '#15803D' }}>● Active Now</span>
                        ) : (
                          <span style={{ color: '#6B7280' }}>Scheduled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CSS VARIABLES & TOKEN INSPECTOR */}
      {activeTab === 'inspector' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDE7E1', borderRadius: '6px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            Live CSS Custom Properties for &ldquo;{theme.name}&rdquo;
          </h3>
          <p style={{ fontSize: '10px', color: '#4B5563', margin: '0 0 12px' }}>
            All elements throughout FR8X inherit these standardized CSS tokens synchronously.
          </p>

          <pre
            style={{
              background: '#FAFBF7',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              padding: '12px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#111827',
              overflowX: 'auto',
              maxHeight: '400px',
            }}
          >
            {`/* ==========================================================================
   FR8X THEME TOKEN SPECIFICATION: ${theme.name.toUpperCase()}
   Category: ${theme.category}
   Font Family: ${theme.typography.fontFamily}
   Base Font Size: ${theme.typography.fontSizeBase}
   ========================================================================== */

:root {
  /* Surfaces & Canvas */
  --color-background: ${theme.colors.canvas};
  --color-surface: ${theme.colors.surface};
  --color-subtle-surface: ${theme.colors.surfaceSubtle};

  /* Typography Colors */
  --color-text-primary: ${theme.colors.textPrimary};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-text-muted: ${theme.colors.textMuted};

  /* Primary Brand & Actions */
  --color-primary: ${theme.colors.primary};
  --color-primary-hover: ${theme.colors.primaryHover};
  --color-active-nav-bg: ${theme.colors.activeBackground};
  --color-active-nav-accent: ${theme.colors.activeBorder};

  /* Structural Lines & Borders */
  --color-border: ${theme.colors.borderPrimary};
  --color-divider: ${theme.colors.borderSubtle};
  --color-focus: ${theme.colors.borderFocus};
  --border-standard: ${theme.lines.borderWidth} ${theme.lines.borderStyle} ${theme.colors.borderPrimary};
  --border-table-row: ${theme.lines.borderWidth} ${theme.lines.borderStyle} ${theme.colors.borderSubtle};

  /* Status Colors */
  --color-success: ${theme.colors.statusSuccess};
  --color-warning: ${theme.colors.statusWarning};
  --color-error: ${theme.colors.statusError};
  --color-info: ${theme.colors.statusInfo};
}`}
          </pre>
        </div>
      )}
    </div>
  );
}
