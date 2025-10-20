'use client';

/**
 * Search Button Component
 * Displays a button to trigger global search with keyboard shortcut hint
 */

import { useGlobalSearchContext } from './GlobalSearchProvider';
import { useTranslations } from '@/hooks/useTranslations';

export function SearchButton() {
  const { openSearch } = useGlobalSearchContext();
  const t = useTranslations();

  // Detect platform for keyboard shortcut display
  const isMac =
    typeof window !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <button
      onClick={openSearch}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
      aria-label={t('search.openSearch') || 'Open search'}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <span className="hidden sm:inline">{t('search.search') || 'Search'}</span>
      <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
        {shortcutKey} K
      </kbd>
    </button>
  );
}
