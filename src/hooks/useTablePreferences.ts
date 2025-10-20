import { useState, useCallback, useEffect } from 'react';

export interface TablePreferences {
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  columnOrder: string[];
  defaultPageSize: number;
}

const STORAGE_KEY = 'dataLog.tablePreferences';

const DEFAULT_PREFERENCES: TablePreferences = {
  columnVisibility: {
    itemName: true,
    batch: true,
    quantity: true,
    reject: true,
    rejectPercentage: true,
    destination: true,
    category: true,
    enteredBy: true,
    dateAdded: true,
    actions: true,
  },
  columnWidths: {
    itemName: 200,
    batch: 150,
    quantity: 100,
    reject: 100,
    rejectPercentage: 120,
    destination: 120,
    category: 120,
    enteredBy: 150,
    dateAdded: 180,
    actions: 100,
  },
  columnOrder: [
    'itemName',
    'batch',
    'quantity',
    'reject',
    'rejectPercentage',
    'destination',
    'category',
    'enteredBy',
    'dateAdded',
    'actions',
  ],
  defaultPageSize: 25,
};

/**
 * Custom hook for managing table preferences with localStorage persistence
 */
export function useTablePreferences() {
  const [preferences, setPreferences] = useState<TablePreferences>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_PREFERENCES;
    }
    return loadPreferences();
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      savePreferences(preferences);
    }
  }, [preferences]);

  // Update column visibility
  const setColumnVisibility = useCallback(
    (column: string, visible: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        columnVisibility: {
          ...prev.columnVisibility,
          [column]: visible,
        },
      }));
    },
    []
  );

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((column: string) => {
    setPreferences((prev) => ({
      ...prev,
      columnVisibility: {
        ...prev.columnVisibility,
        [column]: !prev.columnVisibility[column],
      },
    }));
  }, []);

  // Update column width
  const setColumnWidth = useCallback((column: string, width: number) => {
    setPreferences((prev) => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [column]: width,
      },
    }));
  }, []);

  // Update column order
  const setColumnOrder = useCallback((order: string[]) => {
    setPreferences((prev) => ({
      ...prev,
      columnOrder: order,
    }));
  }, []);

  // Update default page size
  const setDefaultPageSize = useCallback((pageSize: number) => {
    setPreferences((prev) => ({
      ...prev,
      defaultPageSize: pageSize,
    }));
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    setColumnVisibility,
    toggleColumnVisibility,
    setColumnWidth,
    setColumnOrder,
    setDefaultPageSize,
    resetPreferences,
  };
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(): TablePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new columns
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        columnVisibility: {
          ...DEFAULT_PREFERENCES.columnVisibility,
          ...parsed.columnVisibility,
        },
        columnWidths: {
          ...DEFAULT_PREFERENCES.columnWidths,
          ...parsed.columnWidths,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load table preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage
 */
function savePreferences(preferences: TablePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save table preferences:', error);
  }
}
