'use client';

/**
 * Theme Customization Hook
 * Manages theme state, application, and persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Theme,
  PRESET_THEMES,
  ANIMATION_SPEEDS,
  DENSITY_SPACING,
} from '@/config/themes';
import { downloadJSON } from '@/utils/download-helper';

const THEME_STORAGE_KEY = 'custom-theme';
const THEME_CHANNEL = 'theme-sync';

export function useThemeCustomization() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(PRESET_THEMES[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        setCurrentTheme(parsed);
        applyTheme(parsed);
      } else {
        applyTheme(PRESET_THEMES[0]);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      applyTheme(PRESET_THEMES[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        try {
          const newTheme = JSON.parse(e.newValue);
          setCurrentTheme(newTheme);
          applyTheme(newTheme);
        } catch (error) {
          console.error('Failed to sync theme:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Broadcast channel for same-tab synchronization
  useEffect(() => {
    const channel = new BroadcastChannel(THEME_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data.type === 'theme-update') {
        setCurrentTheme(event.data.theme);
        applyTheme(event.data.theme);
      }
    };

    return () => channel.close();
  }, []);

  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;

    // Apply color CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Apply font CSS variables
    root.style.setProperty('--theme-font-family', theme.fonts.family);
    root.style.setProperty('--theme-font-size-base', theme.fonts.size.base);
    root.style.setProperty('--theme-font-size-sm', theme.fonts.size.sm);
    root.style.setProperty('--theme-font-size-lg', theme.fonts.size.lg);
    root.style.setProperty('--theme-font-size-xl', theme.fonts.size.xl);

    // Apply density classes
    root.classList.remove(
      'density-compact',
      'density-comfortable',
      'density-spacious'
    );
    root.classList.add(`density-${theme.spacing.density}`);

    // Apply density CSS variables
    const densityValues = DENSITY_SPACING[theme.spacing.density];
    root.style.setProperty('--theme-padding', densityValues.padding);
    root.style.setProperty('--theme-gap', densityValues.gap);
    root.style.setProperty('--theme-density-font-size', densityValues.fontSize);

    // Apply animation settings
    const animationSpeed = theme.animations.enabled
      ? ANIMATION_SPEEDS[theme.animations.speed]
      : '0ms';
    root.style.setProperty('--theme-animation-speed', animationSpeed);

    if (theme.animations.enabled) {
      root.classList.remove('animations-disabled');
    } else {
      root.classList.add('animations-disabled');
    }
  }, []);

  const updateTheme = useCallback(
    (theme: Theme) => {
      setCurrentTheme(theme);
      applyTheme(theme);

      // Save to localStorage
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));

        // Broadcast to other tabs
        const channel = new BroadcastChannel(THEME_CHANNEL);
        channel.postMessage({ type: 'theme-update', theme });
        channel.close();
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    },
    [applyTheme]
  );

  const selectPreset = useCallback(
    (presetId: string) => {
      const preset = PRESET_THEMES.find((t) => t.id === presetId);
      if (preset) {
        updateTheme(preset);
      }
    },
    [updateTheme]
  );

  const updateColors = useCallback(
    (colors: Partial<Theme['colors']>) => {
      const newTheme = {
        ...currentTheme,
        colors: {
          ...currentTheme.colors,
          ...colors,
        },
      };
      updateTheme(newTheme);
    },
    [currentTheme, updateTheme]
  );

  const updateFonts = useCallback(
    (fonts: Partial<Theme['fonts']>) => {
      const newTheme = {
        ...currentTheme,
        fonts: {
          ...currentTheme.fonts,
          ...fonts,
          size: {
            ...currentTheme.fonts.size,
            ...(fonts.size || {}),
          },
        },
      };
      updateTheme(newTheme);
    },
    [currentTheme, updateTheme]
  );

  const updateDensity = useCallback(
    (density: Theme['spacing']['density']) => {
      const newTheme = {
        ...currentTheme,
        spacing: {
          ...currentTheme.spacing,
          density,
        },
      };
      updateTheme(newTheme);
    },
    [currentTheme, updateTheme]
  );

  const updateAnimations = useCallback(
    (animations: Partial<Theme['animations']>) => {
      const newTheme = {
        ...currentTheme,
        animations: {
          ...currentTheme.animations,
          ...animations,
        },
      };
      updateTheme(newTheme);
    },
    [currentTheme, updateTheme]
  );

  const exportTheme = useCallback(() => {
    const themeJson = JSON.stringify(currentTheme, null, 2);
    downloadJSON(currentTheme, `theme-${currentTheme.id}-${Date.now()}.json`);
  }, [currentTheme]);

  const importTheme = useCallback(
    (themeJson: string): { success: boolean; error?: string } => {
      try {
        const theme = JSON.parse(themeJson) as Theme;

        // Validate theme structure
        if (
          !theme.id ||
          !theme.name ||
          !theme.colors ||
          !theme.fonts ||
          !theme.spacing ||
          !theme.animations
        ) {
          return { success: false, error: 'Invalid theme format' };
        }

        updateTheme(theme);
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Failed to parse theme JSON' };
      }
    },
    [updateTheme]
  );

  const generateShareCode = useCallback(() => {
    const themeJson = JSON.stringify(currentTheme);
    return btoa(themeJson);
  }, [currentTheme]);

  const importFromShareCode = useCallback(
    (shareCode: string): { success: boolean; error?: string } => {
      try {
        const themeJson = atob(shareCode);
        return importTheme(themeJson);
      } catch (error) {
        return { success: false, error: 'Invalid share code' };
      }
    },
    [importTheme]
  );

  const resetToDefault = useCallback(() => {
    updateTheme(PRESET_THEMES[0]);
  }, [updateTheme]);

  return {
    currentTheme,
    isLoading,
    updateTheme,
    selectPreset,
    updateColors,
    updateFonts,
    updateDensity,
    updateAnimations,
    exportTheme,
    importTheme,
    generateShareCode,
    importFromShareCode,
    resetToDefault,
  };
}
