'use client';

import React, { useState, forwardRef, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useDebounce } from '@/hooks/useDebounce';

interface SettingsSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  locale?: string;
}

export const SettingsSearch = forwardRef<HTMLInputElement, SettingsSearchProps>(
  function SettingsSearch(
    { onSearch, placeholder, debounceMs = 300, locale = 'en' },
    ref
  ) {
    const t = useTranslations('settings');
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, debounceMs);
    const isRTL = locale === 'ar';

    // Call onSearch with debounced value
    useEffect(() => {
      onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    };

    const handleClear = () => {
      setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    };

    return (
      <div className="relative w-full" role="search">
        <div className="relative">
          {/* Search Icon - positioned based on text direction */}
          <div
            className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}
            style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}
          >
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={ref}
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('searchPlaceholder')}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`
              w-full py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 
              min-h-[44px] transition-colors
              ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'}
            `}
            aria-label={t('search')}
            role="searchbox"
            aria-describedby="search-description"
          />

          {/* Screen reader description */}
          <span id="search-description" className="sr-only">
            {t('searchPlaceholder')}
          </span>

          {/* Clear Button - positioned based on text direction */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={`
                absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} 
                flex items-center text-gray-400 hover:text-gray-600 
                dark:hover:text-gray-300 min-h-[44px] min-w-[44px] 
                focus:outline-none focus:ring-2 focus:ring-primary-500 rounded
                transition-colors
              `}
              aria-label={t('noResults')}
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Live region for screen readers */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {query && debouncedQuery !== query && t('searching')}
        </div>
      </div>
    );
  }
);
