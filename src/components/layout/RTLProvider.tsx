'use client'

/**
 * RTL Layout Provider
 * Handles Right-to-Left layout adjustments for Arabic locale
 */

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { isRTL, getTextDirection } from '@/utils/rtl';

interface RTLProviderProps {
  children: React.ReactNode;
}

export function RTLProvider({ children }: RTLProviderProps) {
  const locale = useLocale();
  const direction = getTextDirection(locale);
  const rtl = isRTL(locale);

  useEffect(() => {
    // Set HTML dir attribute
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;

    // Apply RTL-specific CSS classes to body
    if (rtl) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Set CSS custom property for direction
    document.documentElement.style.setProperty('--text-direction', direction);
    document.documentElement.style.setProperty('--reading-direction', rtl ? '-1' : '1');

    // Cleanup function
    return () => {
      document.body.classList.remove('rtl', 'ltr');
    };
  }, [locale, direction, rtl]);

  return <>{children}</>;
}

/**
 * Hook to get current RTL state
 */
export function useRTL() {
  const locale = useLocale();
  return {
    isRTL: isRTL(locale),
    direction: getTextDirection(locale),
    locale,
  };
}
