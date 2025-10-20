/**
 * useLocaleConfig Hook
 * Provides locale configuration for the application
 * Since we're using English only, this returns static values
 */

import { enUS } from 'date-fns/locale';

export function useLocaleConfig() {
  return {
    locale: 'en' as const,
    isRTL: false,
    direction: 'ltr' as const,
    dateLocale: enUS,
    dateFormat: 'en-US',
  };
}
