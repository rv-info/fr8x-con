/**
 * FR8X Theme & Design System Engine
 * Separate Library for Theme, Lines, Colors, Typography & Occasion/Festival Presets
 * Controlled by Godfather Administration & User Preferences
 */

export type ThemeId =
  | 'godfather'
  | 'diwali'
  | 'holi'
  | 'christmas'
  | 'eid'
  | 'independence'
  | 'newyear'
  | 'harvest';

export type ThemeCategory = 'godfather_default' | 'festival' | 'occasion';

export interface ThemeColorTokens {
  /** Canvas / Page Background (Must remain pure/light, e.g. #FAFBF7, #FFFFFF, #FFFDF7) */
  canvas: string;
  /** Surface for Cards, Panels, Modals, Forms (#FFFFFF) */
  surface: string;
  /** Subtle background for alternating table rows or light callouts */
  surfaceSubtle: string;

  /** Primary text for headings, titles, active items (Dark, high contrast e.g. #111827) */
  textPrimary: string;
  /** Secondary text for labels, captions, subtitles (e.g. #4B5563) */
  textSecondary: string;
  /** Muted text for timestamps, subtle metadata (e.g. #6B7280) */
  textMuted: string;
  /** Text color used when placed over dark/accent backgrounds (#FFFFFF) */
  textInverse: string;

  /** Primary brand / theme action color (e.g. #15803D Money Green, #D97706 Festive Gold) */
  primary: string;
  /** Hover state for primary buttons */
  primaryHover: string;
  /** Active / pressed state for primary buttons */
  primaryActive: string;
  /** Text color inside primary buttons (#FFFFFF) */
  primaryForeground: string;

  /** Background for active navigation items, selected table rows (e.g. #E8F7EF, #FEF3C7) */
  activeBackground: string;
  /** Left indicator accent line for active navigation */
  activeBorder: string;
  /** Text color for active navigation item */
  activeText: string;

  /** Primary structural border color for cards, panels, inputs (e.g. #DDE7E1, #FDE68A) */
  borderPrimary: string;
  /** Subtle border/divider line for table rows, separators, hr (e.g. #E5E7EB, #F3E8D2) */
  borderSubtle: string;
  /** Focus indicator ring color */
  borderFocus: string;

  /** Status colors */
  statusSuccess: string;
  statusSuccessBg: string;
  statusWarning: string;
  statusWarningBg: string;
  statusError: string;
  statusErrorBg: string;
  statusInfo: string;
  statusInfoBg: string;

  /** KPI & Metric Icon Container */
  kpiIconBg: string;
  kpiIconBorder: string;
}

export interface ThemeLineTokens {
  /** Structural line border width */
  borderWidth: string;
  /** Divider and separator border style */
  borderStyle: string;
  /** Card corner radius */
  borderRadiusCard: string;
  /** Button corner radius */
  borderRadiusButton: string;
  /** Input corner radius */
  borderRadiusInput: string;
  /** Modal corner radius */
  borderRadiusModal: string;
}

export interface ThemeTypographyTokens {
  /** Mandatory Primary Font Family: Calibri */
  fontFamily: string;
  /** Standard UI text size: strictly 10px */
  fontSizeBase: string;
  /** Page Heading h1 size: 16px Bold */
  fontSizePageTitle: string;
  /** Section Heading h2 size: 13px Semibold */
  fontSizeSectionTitle: string;
  /** Subheading / Card title h3/h4 size: 11px Semibold */
  fontSizeSubheading: string;
  /** KPI Value size: 14px Bold */
  fontSizeKpi: string;

  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
}

export interface ThemeOccasion {
  name: string;
  tagline: string;
  greetingPrefix: string;
  accentEmoji: string;
  /** Month index 1-12 */
  startMonth: number;
  /** Day 1-31 */
  startDay: number;
  /** Month index 1-12 */
  endMonth: number;
  /** Day 1-31 */
  endDay: number;
}

export interface FR8XTheme {
  id: ThemeId;
  name: string;
  displayName: string;
  category: ThemeCategory;
  isDefault: boolean;
  description: string;
  colors: ThemeColorTokens;
  lines: ThemeLineTokens;
  typography: ThemeTypographyTokens;
  occasion?: ThemeOccasion;
}
