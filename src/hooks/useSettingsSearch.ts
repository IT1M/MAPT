/**
 * useSettingsSearch Hook
 * Manages settings search state and filtering with real-time results
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import {
  searchSettings,
  buildSearchableItems,
  type SearchResult,
  type SearchableItem,
} from '@/utils/settings-search';

interface UseSettingsSearchOptions {
  minScore?: number;
  maxResults?: number;
  onResultClick?: (result: SearchResult) => void;
}

export function useSettingsSearch(options: UseSettingsSearchOptions = {}) {
  const { minScore = 1, maxResults = 20, onResultClick } = options;
  const t = useTranslations('settings');
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Build searchable items from translations
  const searchableItems = useMemo<SearchableItem[]>(() => {
    try {
      // Get all settings translations
      const translations = {
        sections: {
          profile: t('sections.profile'),
          security: t('sections.security'),
          users: t('sections.users'),
          appearance: t('sections.appearance'),
          notifications: t('sections.notifications'),
          api: t('sections.api'),
          system: t('sections.system'),
        },
        profile: {
          title: t('profile.title'),
          subtitle: t('profile.subtitle'),
        },
        security: {
          title: t('security.title'),
          subtitle: t('security.subtitle'),
          changePassword: t('security.changePassword'),
          sessions: t('security.sessions'),
          sessionsSubtitle: t('security.sessionsSubtitle'),
        },
        users: {
          title: t('users.title'),
          subtitle: t('users.subtitle'),
        },
        appearance: {
          title: t('appearance.title'),
          subtitle: t('appearance.subtitle'),
          theme: t('appearance.theme'),
          themeDescription: t('appearance.themeDescription'),
          uiDensity: t('appearance.uiDensity'),
          uiDensityDescription: t('appearance.uiDensityDescription'),
        },
        notifications: {
          title: t('notifications.title'),
          subtitle: t('notifications.subtitle'),
        },
        api: {
          title: t('api.title'),
          description: t('api.description'),
          geminiApiKey: t('api.geminiApiKey'),
        },
        system: {
          title: t('system.title'),
          subtitle: t('system.subtitle'),
          companyInfo: t('system.companyInfo'),
          backupSettings: t('system.backupSettings'),
        },
      };

      return buildSearchableItems(translations, locale);
    } catch (error) {
      console.error('Error building searchable items:', error);
      return [];
    }
  }, [t, locale]);

  // Perform search
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      return [];
    }

    setIsSearching(true);
    const searchResults = searchSettings(searchableItems, query, {
      minScore,
      maxResults,
    });
    setIsSearching(false);

    return searchResults;
  }, [query, searchableItems, minScore, maxResults]);

  // Handle search query change
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  // Handle result selection
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      if (onResultClick) {
        onResultClick(result);
      }
      // Navigate to the result path
      if (typeof window !== 'undefined' && result.path) {
        window.location.href = result.path;
      }
    },
    [onResultClick]
  );

  // Get results grouped by section
  const resultsBySection = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {};

    results.forEach((result) => {
      if (!grouped[result.section]) {
        grouped[result.section] = [];
      }
      grouped[result.section].push(result);
    });

    return grouped;
  }, [results]);

  return {
    query,
    results,
    resultsBySection,
    isSearching,
    hasResults: results.length > 0,
    handleSearch,
    clearSearch,
    handleResultClick,
  };
}
