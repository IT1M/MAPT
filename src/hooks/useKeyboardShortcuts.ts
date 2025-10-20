import { useEffect, useCallback, useState, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  description: string;
  preventDefault?: boolean;
  category?: string;
  sequence?: string[]; // For sequences like 'g' then 'd'
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Detect if user is on Mac
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Get the modifier key name based on platform
 */
export function getModifierKey(): 'Ctrl' | 'Cmd' {
  return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(getModifierKey());
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push('Alt');
  }

  if (shortcut.sequence) {
    parts.push(shortcut.sequence.join(' then '));
  } else {
    parts.push(shortcut.key.toUpperCase());
  }

  return parts.join('+');
}

/**
 * Hook for managing keyboard shortcuts with accessibility support
 * Supports common shortcuts like Ctrl+S, Ctrl+K, Esc, and sequences like G then D
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const [sequenceBuffer, setSequenceBuffer] = useState<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in input fields (except Escape)
      const target = event.target as HTMLElement;
      const isInputField =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable;

      if (isInputField && event.key !== 'Escape') {
        return;
      }

      // Check for sequence shortcuts first
      const sequenceShortcuts = shortcuts.filter((s) => s.sequence);
      if (sequenceShortcuts.length > 0) {
        const newBuffer = [...sequenceBuffer, event.key.toLowerCase()];

        // Check if any sequence matches
        const matchingSequence = sequenceShortcuts.find((shortcut) => {
          if (!shortcut.sequence) return false;

          // Check if current buffer matches the sequence
          if (newBuffer.length > shortcut.sequence.length) return false;

          return shortcut.sequence.every(
            (key, index) =>
              newBuffer[index]?.toLowerCase() === key.toLowerCase()
          );
        });

        if (matchingSequence) {
          if (newBuffer.length === matchingSequence.sequence!.length) {
            // Complete sequence match
            event.preventDefault();
            matchingSequence.callback(event);
            setSequenceBuffer([]);
            if (sequenceTimeoutRef.current) {
              clearTimeout(sequenceTimeoutRef.current);
            }
            return;
          } else {
            // Partial match, continue building sequence
            setSequenceBuffer(newBuffer);

            // Clear sequence after 1 second of inactivity
            if (sequenceTimeoutRef.current) {
              clearTimeout(sequenceTimeoutRef.current);
            }
            sequenceTimeoutRef.current = setTimeout(() => {
              setSequenceBuffer([]);
            }, 1000);
            return;
          }
        } else if (newBuffer.length > 0) {
          // No match, reset buffer
          setSequenceBuffer([]);
        }
      }

      // Find matching single-key shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        if (shortcut.sequence) return false; // Skip sequence shortcuts

        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Handle modifier keys with platform detection
        const hasModifier = shortcut.ctrlKey || shortcut.metaKey;
        const modifierPressed = event.ctrlKey || event.metaKey;

        if (hasModifier) {
          const modifierMatches = modifierPressed;
          const shiftMatches =
            shortcut.shiftKey === undefined ||
            shortcut.shiftKey === event.shiftKey;
          const altMatches =
            shortcut.altKey === undefined || shortcut.altKey === event.altKey;

          return keyMatches && modifierMatches && shiftMatches && altMatches;
        } else {
          // No modifier required
          const ctrlMatches = !event.ctrlKey && !event.metaKey;
          const shiftMatches =
            shortcut.shiftKey === undefined ||
            shortcut.shiftKey === event.shiftKey;
          const altMatches =
            shortcut.altKey === undefined || shortcut.altKey === event.altKey;

          return keyMatches && ctrlMatches && shiftMatches && altMatches;
        }
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        matchingShortcut.callback(event);
      }
    },
    [shortcuts, enabled, sequenceBuffer]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts,
    sequenceBuffer,
  };
}

/**
 * Hook for settings-specific keyboard shortcuts
 */
export function useSettingsKeyboardShortcuts({
  onSave,
  onSearch,
  onEscape,
  enabled = true,
}: {
  onSave?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSave(),
      description: 'Save current settings',
      preventDefault: true,
    });
  }

  if (onSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSearch(),
      description: 'Focus search',
      preventDefault: true,
    });
  }

  if (onEscape) {
    shortcuts.push({
      key: 'Escape',
      callback: () => onEscape(),
      description: 'Close modal or cancel',
      preventDefault: false,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });

  return { shortcuts };
}
