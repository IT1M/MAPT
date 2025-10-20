import { useState, useCallback, useEffect } from 'react';
import { FilterState } from './useDataLogState';

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
}

const STORAGE_KEY = 'dataLog.filterPresets';
const MAX_PRESETS = 10;

/**
 * Custom hook for managing filter presets with localStorage persistence
 */
export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    return loadPresets();
  });

  // Save to localStorage whenever presets change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      savePresets(presets);
    }
  }, [presets]);

  // Save current filters as a preset
  const savePreset = useCallback((name: string, filters: FilterState) => {
    const newPreset: FilterPreset = {
      id: generateId(),
      name,
      filters,
      createdAt: new Date(),
    };

    setPresets((prev) => {
      const updated = [newPreset, ...prev];
      // Keep only the most recent MAX_PRESETS
      return updated.slice(0, MAX_PRESETS);
    });

    return newPreset;
  }, []);

  // Load a preset
  const loadPreset = useCallback(
    (id: string): FilterPreset | null => {
      return presets.find((p) => p.id === id) || null;
    },
    [presets]
  );

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Update a preset
  const updatePreset = useCallback(
    (id: string, name: string, filters: FilterState) => {
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name, filters } : p))
      );
    },
    []
  );

  // Clear all presets
  const clearPresets = useCallback(() => {
    setPresets([]);
  }, []);

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    clearPresets,
  };
}

/**
 * Load presets from localStorage
 */
function loadPresets(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((preset: any) => ({
        ...preset,
        createdAt: new Date(preset.createdAt),
        filters: {
          ...preset.filters,
          startDate: preset.filters.startDate
            ? new Date(preset.filters.startDate)
            : null,
          endDate: preset.filters.endDate
            ? new Date(preset.filters.endDate)
            : null,
        },
      }));
    }
  } catch (error) {
    console.error('Failed to load filter presets:', error);
  }
  return [];
}

/**
 * Save presets to localStorage
 */
function savePresets(presets: FilterPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save filter presets:', error);
  }
}

/**
 * Generate a unique ID for presets
 */
function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
