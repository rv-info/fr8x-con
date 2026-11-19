/**
 * FR8X Occasion & Festival Scheduler
 * Automatically detects whether today's calendar date coincides with an active festival,
 * national occasion, or seasonal celebration, with fallback to Godfather Default.
 */

import { ALL_THEMES, GODFATHER_THEME, getThemeById } from './themes';
import { FR8XTheme, ThemeId, ThemeOccasion } from './types';

/**
 * Checks if a given calendar date falls inside the [start, end] window of an occasion.
 * Handles wrap-around occasions (e.g. Christmas to New Year spanning Dec to Jan).
 */
export function isDateInsideOccasion(date: Date, occasion: ThemeOccasion): boolean {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31

  const { startMonth, startDay, endMonth, endDay } = occasion;

  // Single-month window
  if (startMonth === endMonth) {
    return month === startMonth && day >= startDay && day <= endDay;
  }

  // Cross-month window within the same calendar year (e.g. Oct 15 -> Nov 20)
  if (startMonth < endMonth) {
    if (month === startMonth) return day >= startDay;
    if (month === endMonth) return day <= endDay;
    return month > startMonth && month < endMonth;
  }

  // Year-wrap window (e.g. Dec 10 -> Jan 10)
  if (startMonth > endMonth) {
    if (month === startMonth) return day >= startDay;
    if (month === endMonth) return day <= endDay;
    return month > startMonth || month < endMonth;
  }

  return false;
}

/**
 * Automatically inspects the calendar date and returns the matching festival/occasion theme,
 * or null if no occasion is currently active.
 */
export function detectOccasionTheme(date: Date = new Date()): FR8XTheme | null {
  for (const theme of ALL_THEMES) {
    if (theme.occasion && isDateInsideOccasion(date, theme.occasion)) {
      return theme;
    }
  }
  return null;
}

/**
 * Resolves the effective theme based on:
 * 1. An explicit manual user/Godfather selection (if specified and not 'auto')
 * 2. An active calendar occasion/festival
 * 3. The authoritative Godfather Default theme
 */
export function resolveEffectiveTheme(
  configuredThemeId: string | null | undefined,
  date: Date = new Date()
): {
  theme: FR8XTheme;
  isAutoScheduled: boolean;
  activeOccasion: ThemeOccasion | null;
} {
  // If an explicit valid non-default theme is chosen
  if (configuredThemeId && configuredThemeId !== 'auto' && configuredThemeId !== 'godfather') {
    const manualTheme = getThemeById(configuredThemeId);
    return {
      theme: manualTheme,
      isAutoScheduled: false,
      activeOccasion: manualTheme.occasion || null,
    };
  }

  // If set to auto, or if default is requested, check if a festival is currently active
  const detectedOccasionTheme = detectOccasionTheme(date);
  if (detectedOccasionTheme) {
    return {
      theme: detectedOccasionTheme,
      isAutoScheduled: true,
      activeOccasion: detectedOccasionTheme.occasion || null,
    };
  }

  // Fallback to Godfather Default
  return {
    theme: GODFATHER_THEME,
    isAutoScheduled: false,
    activeOccasion: null,
  };
}

/**
 * Generates an occasion-aware greeting string (e.g. "Shubh Deepavali 🪔", "Merry Christmas 🎄", etc.)
 */
export function getOccasionGreeting(theme: FR8XTheme): string | null {
  if (!theme.occasion) return null;
  return `${theme.occasion.greetingPrefix} ${theme.occasion.accentEmoji}`.trim();
}
