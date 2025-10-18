'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { useTransition, useState, useRef, useEffect } from 'react'

interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const localeOptions: LocaleOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
  },
];

interface LocaleSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'inline';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

export function LocaleSwitcher({
  variant = 'toggle',
  showLabel = true,
  showFlag = true,
  className = '',
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = localeOptions.find(opt => opt.code === locale) || localeOptions[0];

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // Set locale cookie for persistence
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Replace the locale in the pathname while preserving the rest
      const segments = pathname.split('/');
      segments[1] = newLocale;
      const newPathname = segments.join('/');
      
      router.replace(newPathname);
      setIsOpen(false);
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, localeCode?: Locale) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (localeCode) {
        handleLocaleChange(localeCode);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (event.key === 'ArrowDown' && variant === 'dropdown') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  // Toggle variant (compact buttons)
  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {localeOptions.map((opt) => (
          <button
            key={opt.code}
            onClick={() => handleLocaleChange(opt.code)}
            disabled={isPending}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                locale === opt.code
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={`Switch to ${opt.label}`}
            aria-current={locale === opt.code ? 'true' : 'false'}
            onKeyDown={(e) => handleKeyDown(e, opt.code)}
          >
            {showFlag && <span className="text-base" aria-hidden="true">{opt.flag}</span>}
            {showLabel && <span>{opt.code.toUpperCase()}</span>}
          </button>
        ))}
      </div>
    );
  }

  // Inline variant (simple text buttons)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {localeOptions.map((opt, index) => (
          <span key={opt.code} className="flex items-center">
            <button
              onClick={() => handleLocaleChange(opt.code)}
              disabled={isPending}
              className={`
                px-2 py-1 text-sm font-medium transition-colors rounded
                ${
                  locale === opt.code
                    ? 'text-primary-600 dark:text-primary-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
                ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Switch to ${opt.label}`}
              aria-current={locale === opt.code ? 'true' : 'false'}
              onKeyDown={(e) => handleKeyDown(e, opt.code)}
            >
              {showFlag && <span className="mr-1" aria-hidden="true">{opt.flag}</span>}
              {opt.nativeLabel}
            </button>
            {index < localeOptions.length - 1 && (
              <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">|</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          hover:bg-gray-50 dark:hover:bg-gray-700
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onKeyDown={(e) => handleKeyDown(e)}
      >
        {showFlag && (
          <span className="text-base" aria-hidden="true">{currentLocale.flag}</span>
        )}
        {showLabel && (
          <span className="text-gray-700 dark:text-gray-300">
            {currentLocale.nativeLabel}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {localeOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => handleLocaleChange(opt.code)}
                disabled={isPending}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${
                    locale === opt.code
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                role="menuitem"
                aria-current={locale === opt.code ? 'true' : 'false'}
                onKeyDown={(e) => handleKeyDown(e, opt.code)}
              >
                <span className="text-lg" aria-hidden="true">{opt.flag}</span>
                <span className="flex-1 text-left">{opt.nativeLabel}</span>
                {locale === opt.code && (
                  <svg
                    className="w-4 h-4 text-primary-600 dark:text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
