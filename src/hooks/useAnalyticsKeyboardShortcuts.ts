'use client';

import { useEffect } from 'react';
import { ScreenReaderAnnouncer } from '@/utils/accessibility';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useAnalyticsKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const announcer = ScreenReaderAnnouncer.getInstance();

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch =
          shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch =
          shortcut.shiftKey === undefined ||
          shortcut.shiftKey === event.shiftKey;
        const altMatch =
          shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          announcer.announce(shortcut.description, 'polite');
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
