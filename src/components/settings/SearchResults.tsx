'use client';

import React from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { highlightMatches, type SearchResult } from '@/utils/settings-search';

interface SearchResultsProps {
  results: SearchResult[];
  resultsBySection?: Record<string, SearchResult[]>;
  onResultClick: (result: SearchResult) => void;
  isSearching?: boolean;
  query: string;
}

export function SearchResults({
  results,
  resultsBySection,
  onResultClick,
  isSearching = false,
  query,
}: SearchResultsProps) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  if (isSearching) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p>{t('searching')}</p>
      </div>
    );
  }

  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg
          className="h-12 w-12 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('noResults')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('noResultsDescription')}
        </p>
      </div>
    );
  }

  // Render grouped by section if provided
  if (resultsBySection) {
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(resultsBySection).map(([section, sectionResults]) => (
          <div key={section} className="py-4">
            <h3
              className={`text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-4 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              {section}
            </h3>
            <div className="space-y-1">
              {sectionResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onClick={() => onResultClick(result)}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render flat list
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {results.map((result) => (
        <SearchResultItem
          key={result.id}
          result={result}
          onClick={() => onResultClick(result)}
          isRTL={isRTL}
        />
      ))}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
  isRTL: boolean;
}

function SearchResultItem({ result, onClick, isRTL }: SearchResultItemProps) {
  // Find the best match to display
  const titleMatch = result.matches.find((m) => m.field === 'title');
  const descMatch = result.matches.find((m) => m.field === 'description');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 
        transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 
        focus:ring-inset group
        ${isRTL ? 'text-right' : 'text-left'}
      `}
      role="option"
      aria-selected="false"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 
            flex items-center justify-center group-hover:bg-primary-200 
            dark:group-hover:bg-primary-800 transition-colors
            ${isRTL ? 'ml-3' : 'mr-3'}
          `}
        >
          <svg
            className="h-5 w-5 text-primary-600 dark:text-primary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with highlighting */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {titleMatch ? (
              <span dir={isRTL ? 'rtl' : 'ltr'}>
                {highlightMatches(
                  titleMatch.text,
                  titleMatch.indices,
                  'bg-yellow-200 dark:bg-yellow-800 font-semibold'
                )}
              </span>
            ) : (
              result.title
            )}
          </div>

          {/* Section badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {result.section}
            </span>
          </div>

          {/* Description with highlighting */}
          {descMatch && (
            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              <span dir={isRTL ? 'rtl' : 'ltr'}>
                {highlightMatches(
                  descMatch.text,
                  descMatch.indices,
                  'bg-yellow-200 dark:bg-yellow-800'
                )}
              </span>
            </div>
          )}
        </div>

        {/* Arrow icon */}
        <div
          className={`
            flex-shrink-0 text-gray-400 group-hover:text-gray-600 
            dark:group-hover:text-gray-300 transition-colors
            ${isRTL ? 'mr-2 transform scale-x-[-1]' : 'ml-2'}
          `}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}
