/**
 * Type-safe translation hooks
 * Provides autocomplete and type checking for translation keys
 */

import { useTranslations } from '@/hooks/useTranslations';
import type {
  TranslationNamespace,
  TranslationParams,
  CommonTranslations,
  NavigationTranslations,
  AuthTranslations,
  DashboardTranslations,
  ReportsTranslations,
  InventoryTranslations,
  FormsTranslations,
  ErrorsTranslations,
  SettingsTranslations,
  DataLogTranslations,
  AnalyticsTranslations,
  BackupTranslations,
  DataEntryTranslations,
  AuditTranslations,
} from '@/types/translations';

/**
 * Generic typed translation hook
 */
export function useTypedTranslations<T extends TranslationNamespace>(namespace: T) {
  return useTranslations(namespace);
}

/**
 * Hook for common translations
 */
export function useCommonTranslations() {
  return useTranslations('common') as (key: keyof CommonTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for navigation translations
 */
export function useNavigationTranslations() {
  return useTranslations('navigation') as (key: keyof NavigationTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for auth translations
 */
export function useAuthTranslations() {
  return useTranslations('auth') as (key: keyof AuthTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for dashboard translations
 */
export function useDashboardTranslations() {
  return useTranslations('dashboard') as (key: keyof DashboardTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for reports translations
 */
export function useReportsTranslations() {
  return useTranslations('reports') as (key: keyof ReportsTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for inventory translations
 */
export function useInventoryTranslations() {
  return useTranslations('inventory') as (key: keyof InventoryTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for forms translations
 */
export function useFormsTranslations() {
  return useTranslations('forms') as (key: keyof FormsTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for errors translations
 */
export function useErrorsTranslations() {
  return useTranslations('errors') as (key: keyof ErrorsTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for settings translations
 */
export function useSettingsTranslations() {
  return useTranslations('settings') as (key: keyof SettingsTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for data log translations
 */
export function useDataLogTranslations() {
  return useTranslations('dataLog') as (key: keyof DataLogTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for analytics translations
 */
export function useAnalyticsTranslations() {
  return useTranslations('analytics') as (key: keyof AnalyticsTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for backup translations
 */
export function useBackupTranslations() {
  return useTranslations('backup') as (key: keyof BackupTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for data entry translations
 */
export function useDataEntryTranslations() {
  return useTranslations('dataEntry') as (key: keyof DataEntryTranslations, params?: TranslationParams) => string;
}

/**
 * Hook for audit translations
 */
export function useAuditTranslations() {
  return useTranslations('audit') as (key: keyof AuditTranslations, params?: TranslationParams) => string;
}

/**
 * Example usage:
 * 
 * ```tsx
 * import { useCommonTranslations } from '@/hooks/useTypedTranslations';
 * 
 * function MyComponent() {
 *   const t = useCommonTranslations();
 *   
 *   return (
 *     <div>
 *       <h1>{t('appName')}</h1>
 *       <button>{t('save')}</button>
 *     </div>
 *   );
 * }
 * ```
 */
