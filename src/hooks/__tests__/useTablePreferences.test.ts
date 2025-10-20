import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTablePreferences } from '../useTablePreferences';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTablePreferences', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useTablePreferences());

    expect(result.current.preferences.columnVisibility.itemName).toBe(true);
    expect(result.current.preferences.columnWidths.itemName).toBe(200);
    expect(result.current.preferences.defaultPageSize).toBe(25);
  });

  it('updates column visibility', () => {
    const { result } = renderHook(() => useTablePreferences());

    act(() => {
      result.current.setColumnVisibility('category', false);
    });

    expect(result.current.preferences.columnVisibility.category).toBe(false);
  });

  it('toggles column visibility', () => {
    const { result } = renderHook(() => useTablePreferences());

    const initialVisibility = result.current.preferences.columnVisibility.batch;

    act(() => {
      result.current.toggleColumnVisibility('batch');
    });

    expect(result.current.preferences.columnVisibility.batch).toBe(
      !initialVisibility
    );

    act(() => {
      result.current.toggleColumnVisibility('batch');
    });

    expect(result.current.preferences.columnVisibility.batch).toBe(
      initialVisibility
    );
  });

  it('updates column width', () => {
    const { result } = renderHook(() => useTablePreferences());

    act(() => {
      result.current.setColumnWidth('itemName', 300);
    });

    expect(result.current.preferences.columnWidths.itemName).toBe(300);
  });

  it('updates column order', () => {
    const { result } = renderHook(() => useTablePreferences());

    const newOrder = ['batch', 'itemName', 'quantity'];

    act(() => {
      result.current.setColumnOrder(newOrder);
    });

    expect(result.current.preferences.columnOrder).toEqual(newOrder);
  });

  it('updates default page size', () => {
    const { result } = renderHook(() => useTablePreferences());

    act(() => {
      result.current.setDefaultPageSize(50);
    });

    expect(result.current.preferences.defaultPageSize).toBe(50);
  });

  it('resets to default preferences', () => {
    const { result } = renderHook(() => useTablePreferences());

    act(() => {
      result.current.setColumnVisibility('category', false);
      result.current.setColumnWidth('itemName', 300);
      result.current.setDefaultPageSize(50);
    });

    expect(result.current.preferences.columnVisibility.category).toBe(false);
    expect(result.current.preferences.columnWidths.itemName).toBe(300);
    expect(result.current.preferences.defaultPageSize).toBe(50);

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.columnVisibility.category).toBe(true);
    expect(result.current.preferences.columnWidths.itemName).toBe(200);
    expect(result.current.preferences.defaultPageSize).toBe(25);
  });

  it('persists preferences to localStorage', () => {
    const { result } = renderHook(() => useTablePreferences());

    act(() => {
      result.current.setColumnVisibility('category', false);
      result.current.setColumnWidth('itemName', 300);
    });

    const stored = localStorageMock.getItem('dataLog.tablePreferences');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.columnVisibility.category).toBe(false);
    expect(parsed.columnWidths.itemName).toBe(300);
  });

  it('loads preferences from localStorage', () => {
    const preferences = {
      columnVisibility: { itemName: false },
      columnWidths: { itemName: 350 },
      columnOrder: ['batch', 'itemName'],
      defaultPageSize: 100,
    };

    localStorageMock.setItem(
      'dataLog.tablePreferences',
      JSON.stringify(preferences)
    );

    const { result } = renderHook(() => useTablePreferences());

    expect(result.current.preferences.columnVisibility.itemName).toBe(false);
    expect(result.current.preferences.columnWidths.itemName).toBe(350);
    expect(result.current.preferences.defaultPageSize).toBe(100);
  });
});
