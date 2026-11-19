/**
 * FR8X Theme CSS Runtime Engine
 * Injects and updates dynamic CSS Custom Properties on the document root
 * to re-theme the entire application synchronously with zero flash of unstyled content.
 */

import { FR8XTheme } from './types';

/**
 * Maps a theme object to a dictionary of standard and legacy CSS Custom Properties.
 */
export function themeToCssVariables(theme: FR8XTheme): Record<string, string> {
  const { colors, lines, typography } = theme;

  return {
    // Canvas & Surface
    '--color-background': colors.canvas,
    '--color-page-bg': colors.canvas,
    '--color-surface': colors.surface,
    '--color-card-bg': colors.surface,
    '--color-table-bg': colors.surface,
    '--color-input-bg': colors.surface,
    '--color-modal-bg': colors.surface,
    '--color-sidebar-bg': colors.surface,
    '--color-header-bg': colors.surface,
    '--fr8x-canvas': colors.canvas,
    '--fr8x-surface': colors.surface,
    '--fr8x-sidebar': colors.surface,
    '--fr8x-topbar': colors.surface,

    // Typography & Text
    '--font-family-primary': typography.fontFamily,
    '--font': typography.fontFamily,
    '--font-size-base': typography.fontSizeBase,
    '--font-size-body': typography.fontSizeBase,
    '--color-text-primary': colors.textPrimary,
    '--color-text-secondary': colors.textSecondary,
    '--color-text-muted': colors.textMuted,
    '--fr8x-text-primary': colors.textPrimary,
    '--fr8x-text-secondary': colors.textSecondary,
    '--fr8x-text-muted': colors.textMuted,

    // Primary Brand & Action Accent
    '--color-primary': colors.primary,
    '--color-primary-hover': colors.primaryHover,
    '--color-hover-bg': colors.activeBackground,
    '--color-active-nav-bg': colors.activeBackground,
    '--color-active-nav-text': colors.activeText,
    '--color-active-nav-accent': colors.primary,
    '--fr8x-primary': colors.primary,
    '--fr8x-accent': colors.primary,
    '--fr8x-accent-hover': colors.primaryHover,
    '--fr8x-active-bg': colors.activeBackground,
    '--fr8x-active-border': colors.activeBorder,
    '--fr8x-active-text': colors.activeText,

    // Structural Lines & Borders
    '--color-border': colors.borderPrimary,
    '--color-divider': colors.borderSubtle,
    '--color-focus': colors.borderFocus,
    '--border-standard': `${lines.borderWidth} ${lines.borderStyle} ${colors.borderPrimary}`,
    '--border-section': `${lines.borderWidth} ${lines.borderStyle} ${colors.borderPrimary}`,
    '--border-table-row': `${lines.borderWidth} ${lines.borderStyle} ${colors.borderSubtle}`,
    '--border-input': `${lines.borderWidth} ${lines.borderStyle} ${colors.borderPrimary}`,
    '--border-input-active': `${lines.borderWidth} ${lines.borderStyle} ${colors.borderFocus}`,
    '--outline-focus': `2px solid ${colors.borderFocus}`,
    '--fr8x-border': colors.borderPrimary,
    '--fr8x-border-strong': colors.borderPrimary,
    '--fr8x-border-subtle': colors.borderSubtle,
    '--fr8x-focus': colors.borderFocus,

    // Corner Radii
    '--radius-card': lines.borderRadiusCard,
    '--radius-input': lines.borderRadiusInput,
    '--radius-button': lines.borderRadiusButton,
    '--radius-modal': lines.borderRadiusModal,

    // Status Colors
    '--color-success': colors.statusSuccess,
    '--color-warning': colors.statusWarning,
    '--color-error': colors.statusError,
    '--color-info': colors.statusInfo,
    '--fr8x-success': colors.statusSuccess,
    '--fr8x-warning': colors.statusWarning,
    '--fr8x-danger': colors.statusError,
    '--fr8x-info': colors.statusInfo,

    // Dynamic Theme Identifier
    '--fr8x-theme-id': theme.id,
  };
}

/**
 * Generates raw CSS rule string for runtime <style> insertion or SSR header injection.
 */
export function generateThemeCss(theme: FR8XTheme): string {
  const vars = themeToCssVariables(theme);
  const rules = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value} !important;`)
    .join('\n');

  return `
/* [FR8X DYNAMIC THEME: ${theme.name.toUpperCase()}] */
:root, [data-theme="${theme.id}"] {
${rules}
}

/* Ensure active navigation indicator aligns with theme accent */
.nav a.on, nav a.on {
  background-color: ${theme.colors.activeBackground} !important;
  border-left-color: ${theme.colors.activeBorder} !important;
  color: ${theme.colors.activeText} !important;
}

.nav a.on .nav-icon, nav a.on .nav-icon {
  color: ${theme.colors.primary} !important;
}

/* Ensure primary button inherits theme primary background */
.btn.primary, button.btn-primary {
  background-color: ${theme.colors.primary} !important;
  border-color: ${theme.colors.primary} !important;
  color: ${theme.colors.primaryForeground} !important;
}

.btn.primary:hover, button.btn-primary:hover {
  background-color: ${theme.colors.primaryHover} !important;
  border-color: ${theme.colors.primaryHover} !important;
}

/* Structural dividers and borders */
hr, .divider, .separator {
  border-color: ${theme.colors.borderSubtle} !important;
}
`;
}

/**
 * Applies the given theme to the live DOM document at runtime.
 */
export function applyThemeToDom(theme: FR8XTheme): void {
  if (typeof document === 'undefined') return;

  const styleId = 'fr8x-theme-runtime';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = generateThemeCss(theme);
  document.documentElement.setAttribute('data-theme', theme.id);
}
