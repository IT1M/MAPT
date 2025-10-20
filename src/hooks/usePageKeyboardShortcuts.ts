/**
 * Page-specific keyboard shortcuts hooks
 * Provides shortcuts for specific pages like data-log, analytics, etc.
 */

import { useKeyboardShortcuts, KeyboardShortcut } from './useKeyboardShortcuts';

/**
 * Data Log page keyboard shortcuts
 */
export function useDataLogKeyboardShortcuts({
  onFilter,
  onExport,
  onRefresh,
  onNavigateUp,
  onNavigateDown,
  onSelectItem,
  enabled = true,
}: {
  onFilter?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelectItem?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onFilter) {
    shortcuts.push({
      key: 'f',
      callback: () => onFilter(),
      description: 'Open filters',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onExport) {
    shortcuts.push({
      key: 'e',
      callback: () => onExport(),
      description: 'Export data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onRefresh) {
    shortcuts.push({
      key: 'r',
      callback: () => onRefresh(),
      description: 'Refresh data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onNavigateUp) {
    shortcuts.push({
      key: 'ArrowUp',
      callback: () => onNavigateUp(),
      description: 'Navigate up in table',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onNavigateDown) {
    shortcuts.push({
      key: 'ArrowDown',
      callback: () => onNavigateDown(),
      description: 'Navigate down in table',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onSelectItem) {
    shortcuts.push({
      key: 'Enter',
      callback: () => onSelectItem(),
      description: 'Select/open item',
      category: 'Table',
      preventDefault: true,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}

/**
 * Analytics page keyboard shortcuts
 */
export function useAnalyticsKeyboardShortcuts({
  onFilter,
  onExport,
  onRefresh,
  enabled = true,
}: {
  onFilter?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onFilter) {
    shortcuts.push({
      key: 'f',
      callback: () => onFilter(),
      description: 'Open filters',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onExport) {
    shortcuts.push({
      key: 'e',
      callback: () => onExport(),
      description: 'Export data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onRefresh) {
    shortcuts.push({
      key: 'r',
      callback: () => onRefresh(),
      description: 'Refresh data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}

/**
 * Data Entry page keyboard shortcuts
 */
export function useDataEntryKeyboardShortcuts({
  onNewItem,
  onSave,
  onClear,
  enabled = true,
}: {
  onNewItem?: () => void;
  onSave?: () => void;
  onClear?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onNewItem) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      callback: () => onNewItem(),
      description: 'Create new item',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSave(),
      description: 'Save form',
      category: 'Forms',
      preventDefault: true,
    });
  }

  if (onClear) {
    shortcuts.push({
      key: 'Escape',
      callback: () => onClear(),
      description: 'Clear form',
      category: 'Forms',
      preventDefault: false,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}

/**
 * Audit page keyboard shortcuts
 */
export function useAuditKeyboardShortcuts({
  onFilter,
  onExport,
  onRefresh,
  onNavigateUp,
  onNavigateDown,
  onSelectItem,
  enabled = true,
}: {
  onFilter?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelectItem?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onFilter) {
    shortcuts.push({
      key: 'f',
      callback: () => onFilter(),
      description: 'Open filters',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onExport) {
    shortcuts.push({
      key: 'e',
      callback: () => onExport(),
      description: 'Export data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onRefresh) {
    shortcuts.push({
      key: 'r',
      callback: () => onRefresh(),
      description: 'Refresh data',
      category: 'Actions',
      preventDefault: true,
    });
  }

  if (onNavigateUp) {
    shortcuts.push({
      key: 'ArrowUp',
      callback: () => onNavigateUp(),
      description: 'Navigate up in table',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onNavigateDown) {
    shortcuts.push({
      key: 'ArrowDown',
      callback: () => onNavigateDown(),
      description: 'Navigate down in table',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onSelectItem) {
    shortcuts.push({
      key: 'Enter',
      callback: () => onSelectItem(),
      description: 'Select/open item',
      category: 'Table',
      preventDefault: true,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}

/**
 * Table keyboard shortcuts (generic)
 */
export function useTableKeyboardShortcuts({
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onSelectItem,
  onSelectAll,
  enabled = true,
}: {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onSelectItem?: () => void;
  onSelectAll?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onNavigateUp) {
    shortcuts.push({
      key: 'ArrowUp',
      callback: () => onNavigateUp(),
      description: 'Navigate up',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onNavigateDown) {
    shortcuts.push({
      key: 'ArrowDown',
      callback: () => onNavigateDown(),
      description: 'Navigate down',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onNavigateLeft) {
    shortcuts.push({
      key: 'ArrowLeft',
      callback: () => onNavigateLeft(),
      description: 'Navigate left',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onNavigateRight) {
    shortcuts.push({
      key: 'ArrowRight',
      callback: () => onNavigateRight(),
      description: 'Navigate right',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onSelectItem) {
    shortcuts.push({
      key: 'Enter',
      callback: () => onSelectItem(),
      description: 'Select/open item',
      category: 'Table',
      preventDefault: true,
    });
  }

  if (onSelectAll) {
    shortcuts.push({
      key: 'a',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSelectAll(),
      description: 'Select all',
      category: 'Table',
      preventDefault: true,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}

/**
 * Form keyboard shortcuts (generic)
 */
export function useFormKeyboardShortcuts({
  onSave,
  onCancel,
  onReset,
  enabled = true,
}: {
  onSave?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSave(),
      description: 'Save form',
      category: 'Forms',
      preventDefault: true,
    });
  }

  if (onCancel) {
    shortcuts.push({
      key: 'Escape',
      callback: () => onCancel(),
      description: 'Cancel',
      category: 'Forms',
      preventDefault: false,
    });
  }

  if (onReset) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      metaKey: true,
      callback: () => onReset(),
      description: 'Reset form',
      category: 'Forms',
      preventDefault: true,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}
