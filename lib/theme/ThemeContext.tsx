'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { FR8XTheme, ThemeId, ThemeOccasion } from './types';
import { ALL_THEMES, GODFATHER_THEME, getThemeById } from './themes';
import { resolveEffectiveTheme, getOccasionGreeting } from './schedule';
import { applyThemeToDom } from './cssEngine';

const STORAGE_KEY = 'fr8x_theme_id';
export const THEME_CHANGED_EVENT = 'fr8x:theme:changed';

interface ThemeContextValue {
  theme: FR8XTheme;
  themeId: string;
  setThemeId: (id: string) => void;
  allThemes: FR8XTheme[];
  activeOccasion: ThemeOccasion | null;
  isAutoScheduled: boolean;
  isGodfatherDefault: boolean;
  occasionGreeting: string | null;
  resetToGodfather: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [configuredId, setConfiguredIdState] = useState<string>('auto');
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfiguredIdState(stored);
      }
    } catch {
      // Ignore storage access errors
    }
    setMounted(true);
  }, []);

  // Compute effective theme based on configuration and active calendar occasions
  const { theme, isAutoScheduled, activeOccasion } = useMemo(() => {
    return resolveEffectiveTheme(configuredId);
  }, [configuredId]);

  // Synchronize CSS Custom Properties into the DOM
  useEffect(() => {
    if (mounted) {
      applyThemeToDom(theme);
    }
  }, [theme, mounted]);

  // Handle multi-tab and external changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setConfiguredIdState(e.newValue);
      }
    };

    const handleCustomEvent = (e: CustomEvent<{ themeId: string }>) => {
      if (e.detail?.themeId) {
        setConfiguredIdState(e.detail.themeId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(THEME_CHANGED_EVENT as any, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(THEME_CHANGED_EVENT as any, handleCustomEvent as EventListener);
    };
  }, []);

  const setThemeId = useCallback((newId: string) => {
    setConfiguredIdState(newId);
    try {
      localStorage.setItem(STORAGE_KEY, newId);
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGED_EVENT, { detail: { themeId: newId } })
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  const resetToGodfather = useCallback(() => {
    setThemeId('godfather');
  }, [setThemeId]);

  const isGodfatherDefault = theme.id === 'godfather';
  const occasionGreeting = useMemo(() => getOccasionGreeting(theme), [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    themeId: configuredId,
    setThemeId,
    allThemes: ALL_THEMES,
    activeOccasion,
    isAutoScheduled,
    isGodfatherDefault,
    occasionGreeting,
    resetToGodfather,
  }), [
    theme,
    configuredId,
    setThemeId,
    activeOccasion,
    isAutoScheduled,
    isGodfatherDefault,
    occasionGreeting,
    resetToGodfather,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return a fallback mock when rendered outside provider to avoid SSR crashes
    return {
      theme: GODFATHER_THEME,
      themeId: 'godfather',
      setThemeId: () => {},
      allThemes: ALL_THEMES,
      activeOccasion: null,
      isAutoScheduled: false,
      isGodfatherDefault: true,
      occasionGreeting: null,
      resetToGodfather: () => {},
    };
  }
  return context;
}
