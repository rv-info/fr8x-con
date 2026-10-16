import localFont from 'next/font/local';

/**
 * FR8X Masterblast Brand Font Definition
 * Loaded via next/font/local from the accessories folder for zero Cumulative Layout Shift (CLS),
 * font preloading, and CSS variable injection across the entire application shell.
 * Font Family: 'masterblast.regular'
 */
export const masterblastFont = localFont({
  src: '../accessories/masterblast.regular.otf',
  variable: '--font-masterblast',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: false,
});
