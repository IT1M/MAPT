'use client';

/**
 * Global Keyboard Shortcuts Provider
 * Manages application-wide keyboard shortcuts
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from '@/hooks/useKeyboardShortcuts';
import { useGlobalSearchContext } from '@/components/search/GlobalSearchProvider';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

function ShortcutsHelpModal({
  isOpen,
  onClose,
  shortcuts,
}: ShortcutsHelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  // Filter shortcuts based on search
  const filteredGroups = Object.entries(groupedShortcuts).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter(
        (shortcut) =>
          shortcut.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          shortcut.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];

    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push(
        <kbd
          key="mod"
          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          {typeof window !== 'undefined' && /Mac/.test(navigator.platform)
            ? '⌘'
            : 'Ctrl'}
        </kbd>
      );
    }
    if (shortcut.shiftKey) {
      parts.push(
        <kbd
          key="shift"
          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          Shift
        </kbd>
      );
    }
    if (shortcut.altKey) {
      parts.push(
        <kbd
          key="alt"
          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          Alt
        </kbd>
      );
    }

    if (shortcut.sequence) {
      shortcut.sequence.forEach((key, index) => {
        if (index > 0) {
          parts.push(
            <span key={`then-${index}`} className="mx-1 text-gray-500">
              then
            </span>
          );
        }
        parts.push(
          <kbd
            key={`seq-${index}`}
            className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          >
            {key.toUpperCase()}
          </kbd>
        );
      });
    } else {
      parts.push(
        <kbd
          key="key"
          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          {shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()}
        </kbd>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 &&
              typeof parts[index + 1] !== 'string' && (
                <span className="mx-1 text-gray-400">+</span>
              )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {Object.keys(filteredGroups).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No shortcuts found matching "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredGroups).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        {formatKey(shortcut)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}

export function GlobalKeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const { openSearch } = useGlobalSearchContext();

  // Define global shortcuts
  const globalShortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      callback: () => openSearch(),
      description: 'Open global search',
      category: 'Navigation',
    },
    {
      key: '/',
      ctrlKey: true,
      metaKey: true,
      callback: () => setShowHelp(true),
      description: 'Show keyboard shortcuts',
      category: 'Help',
    },
    {
      key: 'Escape',
      callback: () => setShowHelp(false),
      description: 'Close modal or dialog',
      category: 'General',
      preventDefault: false,
    },

    // Quick navigation sequences
    {
      key: 'd',
      sequence: ['g', 'd'],
      callback: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
      category: 'Navigation',
    },
    {
      key: 'e',
      sequence: ['g', 'e'],
      callback: () => router.push('/data-entry'),
      description: 'Go to Data Entry',
      category: 'Navigation',
    },
    {
      key: 'l',
      sequence: ['g', 'l'],
      callback: () => router.push('/data-log'),
      description: 'Go to Data Log',
      category: 'Navigation',
    },
    {
      key: 'a',
      sequence: ['g', 'a'],
      callback: () => router.push('/analytics'),
      description: 'Go to Analytics',
      category: 'Navigation',
    },
    {
      key: 's',
      sequence: ['g', 's'],
      callback: () => router.push('/settings'),
      description: 'Go to Settings',
      category: 'Navigation',
    },
  ];

  // Register shortcuts
  useKeyboardShortcuts({
    shortcuts: globalShortcuts,
    enabled: true,
  });

  return (
    <>
      {children}
      <ShortcutsHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={globalShortcuts}
      />
    </>
  );
}
