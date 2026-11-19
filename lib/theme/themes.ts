/**
 * FR8X Theme Catalog
 * Color, line, typography and styling presets curated for Godfather administration,
 * national holidays, festive celebrations, and seasonal occasions.
 */

import { FR8XTheme, ThemeLineTokens, ThemeTypographyTokens } from './types';

// Standardized structural lines
export const STANDARD_LINES: ThemeLineTokens = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadiusCard: '6px',
  borderRadiusButton: '4px',
  borderRadiusInput: '4px',
  borderRadiusModal: '8px',
};

// Standardized Calibri 10px typography hierarchy
export const STANDARD_TYPOGRAPHY: ThemeTypographyTokens = {
  fontFamily: 'Calibri, sans-serif',
  fontSizeBase: '10px',
  fontSizePageTitle: '16px',
  fontSizeSectionTitle: '13px',
  fontSizeSubheading: '11px',
  fontSizeKpi: '14px',
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
};

// 1. THE GODFATHER THEME (Default Enterprise Theme)
export const GODFATHER_THEME: FR8XTheme = {
  id: 'godfather',
  name: 'Godfather Enterprise',
  displayName: 'Godfather (Default)',
  category: 'godfather_default',
  isDefault: true,
  description: 'The authoritative enterprise logistics theme. Pure white surfaces, deep green brand accents, dark charcoal typography, and subtle sage borderlines.',
  colors: {
    canvas: '#FAFBF7',
    surface: '#FFFFFF',
    surfaceSubtle: '#F4F7F5',

    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',

    primary: '#15803D',
    primaryHover: '#166534',
    primaryActive: '#14532D',
    primaryForeground: '#FFFFFF',

    activeBackground: '#E8F7EF',
    activeBorder: '#15803D',
    activeText: '#111827',

    borderPrimary: '#DDE7E1',
    borderSubtle: '#E5E7EB',
    borderFocus: '#15803D',

    statusSuccess: '#15803D',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#B45309',
    statusWarningBg: '#FEF3C7',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#1D4ED8',
    statusInfoBg: '#DBEAFE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#DDE7E1',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
};

// 2. DIWALI THEME (Festival of Lights & Prosperity)
export const DIWALI_THEME: FR8XTheme = {
  id: 'diwali',
  name: 'Diwali Lights',
  displayName: 'Diwali (Festival of Lights)',
  category: 'festival',
  isDefault: false,
  description: 'Celebrating prosperity and light. Warm golden pearl canvas, festive amber highlights, royal burgundy typography, and shimmering gold borderlines.',
  colors: {
    canvas: '#FFFDF7',
    surface: '#FFFFFF',
    surfaceSubtle: '#FEF9EE',

    textPrimary: '#2E1005',
    textSecondary: '#6A3B12',
    textMuted: '#8D6B42',
    textInverse: '#FFFFFF',

    primary: '#D97706',
    primaryHover: '#B45309',
    primaryActive: '#92400E',
    primaryForeground: '#FFFFFF',

    activeBackground: '#FEF3C7',
    activeBorder: '#D97706',
    activeText: '#2E1005',

    borderPrimary: '#FDE68A',
    borderSubtle: '#F6ECD2',
    borderFocus: '#D97706',

    statusSuccess: '#15803D',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#D97706',
    statusWarningBg: '#FEF3C7',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#B45309',
    statusInfoBg: '#FEF3C7',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#FDE68A',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Diwali',
    tagline: 'Festival of Lights & Fiscal Prosperity',
    greetingPrefix: 'Shubh Deepavali',
    accentEmoji: '🪔',
    startMonth: 10,
    startDay: 15,
    endMonth: 11,
    endDay: 20,
  },
};

// 3. HOLI THEME (Festival of Colours)
export const HOLI_THEME: FR8XTheme = {
  id: 'holi',
  name: 'Holi Colors',
  displayName: 'Holi (Festival of Colours)',
  category: 'festival',
  isDefault: false,
  description: 'Celebrating joy and vibrant new energy. Soft petal canvas, radiant gulal magenta accents, deep indigo text, and spring orchid borders.',
  colors: {
    canvas: '#FDFBFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#FAF5FF',

    textPrimary: '#1E1B4B',
    textSecondary: '#581C87',
    textMuted: '#7E22CE',
    textInverse: '#FFFFFF',

    primary: '#C026D3',
    primaryHover: '#A21CAF',
    primaryActive: '#86198F',
    primaryForeground: '#FFFFFF',

    activeBackground: '#FAE8FF',
    activeBorder: '#C026D3',
    activeText: '#1E1B4B',

    borderPrimary: '#F5D0FE',
    borderSubtle: '#E9D5FF',
    borderFocus: '#C026D3',

    statusSuccess: '#15803D',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#D97706',
    statusWarningBg: '#FEF3C7',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#0284C7',
    statusInfoBg: '#E0F2FE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#F5D0FE',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Holi',
    tagline: 'Festival of Colours & Spring Joy',
    greetingPrefix: 'Happy Holi',
    accentEmoji: '🎨',
    startMonth: 3,
    startDay: 1,
    endMonth: 3,
    endDay: 31,
  },
};

// 4. CHRISTMAS & NEW YEAR THEME (Holiday Season)
export const CHRISTMAS_THEME: FR8XTheme = {
  id: 'christmas',
  name: 'Christmas & Winter Holidays',
  displayName: 'Christmas & New Year',
  category: 'festival',
  isDefault: false,
  description: 'Holiday celebration with crisp snow canvas, pine evergreen primary accents, festive berry red details, and frosty platinum line work.',
  colors: {
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',

    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',

    primary: '#047857',
    primaryHover: '#065F46',
    primaryActive: '#064E3B',
    primaryForeground: '#FFFFFF',

    activeBackground: '#ECFDF5',
    activeBorder: '#047857',
    activeText: '#0F172A',

    borderPrimary: '#CBD5E1',
    borderSubtle: '#E2E8F0',
    borderFocus: '#047857',

    statusSuccess: '#047857',
    statusSuccessBg: '#D1FAE5',
    statusWarning: '#D97706',
    statusWarningBg: '#FEF3C7',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#0369A1',
    statusInfoBg: '#E0F2FE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#CBD5E1',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Christmas & New Year',
    tagline: 'Joyous Holiday Season & Winter Cheer',
    greetingPrefix: "Season's Greetings",
    accentEmoji: '🎄',
    startMonth: 12,
    startDay: 10,
    endMonth: 1,
    endDay: 10,
  },
};

// 5. EID THEME (Celebration of Peace & Grace)
export const EID_THEME: FR8XTheme = {
  id: 'eid',
  name: 'Eid Celebrations',
  displayName: 'Eid (Festival of Peace)',
  category: 'festival',
  isDefault: false,
  description: 'Celebrating harmony and community. Crisp pearl canvas, royal emerald green highlights, crescent gold nuances, and jade borderlines.',
  colors: {
    canvas: '#F7FCF9',
    surface: '#FFFFFF',
    surfaceSubtle: '#EEF9F2',

    textPrimary: '#062C1E',
    textSecondary: '#204E38',
    textMuted: '#476C59',
    textInverse: '#FFFFFF',

    primary: '#059669',
    primaryHover: '#047857',
    primaryActive: '#065F46',
    primaryForeground: '#FFFFFF',

    activeBackground: '#DCFCE7',
    activeBorder: '#059669',
    activeText: '#062C1E',

    borderPrimary: '#A7F3D0',
    borderSubtle: '#D1FAE5',
    borderFocus: '#059669',

    statusSuccess: '#059669',
    statusSuccessBg: '#D1FAE5',
    statusWarning: '#CA8A04',
    statusWarningBg: '#FEF9C3',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#0284C7',
    statusInfoBg: '#E0F2FE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#A7F3D0',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Eid',
    tagline: 'Celebration of Grace, Peace & Harmony',
    greetingPrefix: 'Eid Mubarak',
    accentEmoji: '🌙',
    startMonth: 3,
    startDay: 25,
    endMonth: 4,
    endDay: 20,
  },
};

// 6. INDEPENDENCE & REPUBLIC DAY THEME (Patriotic Gala)
export const INDEPENDENCE_THEME: FR8XTheme = {
  id: 'independence',
  name: 'Independence & Republic Day',
  displayName: 'Independence & Republic Day',
  category: 'occasion',
  isDefault: false,
  description: 'Honoring national unity and pride. Pure white surface, royal saffron action accents, navy chakra text tone, and subtle terracotta line borders.',
  colors: {
    canvas: '#FBFBFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F4F5F8',

    textPrimary: '#0B2545',
    textSecondary: '#1E3A8A',
    textMuted: '#475569',
    textInverse: '#FFFFFF',

    primary: '#EA580C',
    primaryHover: '#C2410C',
    primaryActive: '#9A3412',
    primaryForeground: '#FFFFFF',

    activeBackground: '#FFF7ED',
    activeBorder: '#EA580C',
    activeText: '#0B2545',

    borderPrimary: '#FED7AA',
    borderSubtle: '#E2E8F0',
    borderFocus: '#EA580C',

    statusSuccess: '#16A34A',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#EA580C',
    statusWarningBg: '#FFF7ED',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#1D4ED8',
    statusInfoBg: '#DBEAFE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#FED7AA',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Independence & Republic Day',
    tagline: 'Saluting National Progress & Global Commerce',
    greetingPrefix: 'Jai Hind',
    accentEmoji: '🇮🇳',
    startMonth: 8,
    startDay: 10,
    endMonth: 8,
    endDay: 20,
  },
};

// 7. NEW YEAR GALA THEME (Champagne & Midnight Executive)
export const NEW_YEAR_THEME: FR8XTheme = {
  id: 'newyear',
  name: 'New Year Gala',
  displayName: 'New Year Executive',
  category: 'occasion',
  isDefault: false,
  description: 'Executive celebration for calendar milestones. Platinum pearl canvas, midnight obsidian text, and luxurious champagne bronze line details.',
  colors: {
    canvas: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceSubtle: '#F5F5F4',

    textPrimary: '#18181B',
    textSecondary: '#52525B',
    textMuted: '#71717A',
    textInverse: '#FFFFFF',

    primary: '#CA8A04',
    primaryHover: '#A16207',
    primaryActive: '#854D0E',
    primaryForeground: '#FFFFFF',

    activeBackground: '#FEF9C3',
    activeBorder: '#CA8A04',
    activeText: '#18181B',

    borderPrimary: '#E4E4E7',
    borderSubtle: '#F4F4F5',
    borderFocus: '#CA8A04',

    statusSuccess: '#15803D',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#CA8A04',
    statusWarningBg: '#FEF9C3',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#0284C7',
    statusInfoBg: '#E0F2FE',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#E4E4E7',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'New Year Gala',
    tagline: 'Stepping into a Prosperous Global Trade Year',
    greetingPrefix: 'Happy New Year',
    accentEmoji: '✨',
    startMonth: 12,
    startDay: 28,
    endMonth: 1,
    endDay: 5,
  },
};

// 8. HARVEST FESTIVAL THEME (Baisakhi / Onam / Pongal / Thanksgiving)
export const HARVEST_THEME: FR8XTheme = {
  id: 'harvest',
  name: 'Harvest Festival',
  displayName: 'Harvest & Abundance',
  category: 'festival',
  isDefault: false,
  description: 'Honoring agrarian abundance and supply chain roots. Warm wheat parchment, roasted terracotta text, and golden sheaf borderlines.',
  colors: {
    canvas: '#FCFBF7',
    surface: '#FFFFFF',
    surfaceSubtle: '#F8F5EC',

    textPrimary: '#431407',
    textSecondary: '#78350F',
    textMuted: '#92400E',
    textInverse: '#FFFFFF',

    primary: '#B45309',
    primaryHover: '#92400E',
    primaryActive: '#78350F',
    primaryForeground: '#FFFFFF',

    activeBackground: '#FEF3C7',
    activeBorder: '#B45309',
    activeText: '#431407',

    borderPrimary: '#FDE68A',
    borderSubtle: '#F5EBE1',
    borderFocus: '#B45309',

    statusSuccess: '#15803D',
    statusSuccessBg: '#DCFCE7',
    statusWarning: '#B45309',
    statusWarningBg: '#FEF3C7',
    statusError: '#DC2626',
    statusErrorBg: '#FEE2E2',
    statusInfo: '#B45309',
    statusInfoBg: '#FEF3C7',

    kpiIconBg: '#FFFFFF',
    kpiIconBorder: '#FDE68A',
  },
  lines: STANDARD_LINES,
  typography: STANDARD_TYPOGRAPHY,
  occasion: {
    name: 'Harvest Festival',
    tagline: 'Celebrating the Roots of Supply Chain & Global Abundance',
    greetingPrefix: 'Happy Harvest Season',
    accentEmoji: '🌾',
    startMonth: 4,
    startDay: 10,
    endMonth: 4,
    endDay: 20,
  },
};

export const ALL_THEMES: FR8XTheme[] = [
  GODFATHER_THEME,
  DIWALI_THEME,
  HOLI_THEME,
  CHRISTMAS_THEME,
  EID_THEME,
  INDEPENDENCE_THEME,
  NEW_YEAR_THEME,
  HARVEST_THEME,
];

export const THEMES_BY_ID: Record<string, FR8XTheme> = ALL_THEMES.reduce((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {} as Record<string, FR8XTheme>);

export function getThemeById(id: string): FR8XTheme {
  return THEMES_BY_ID[id] || GODFATHER_THEME;
}
