/**
 * TypeScript types for translation keys
 * Auto-generated from translation files for type safety
 */

import type enMessages from '../../messages/en.json';

/**
 * Type representing all translation keys in dot notation
 */
export type TranslationKeys = RecursiveKeyOf<typeof enMessages>;

/**
 * Helper type to recursively extract keys from nested objects
 */
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `.${TKey}`
  >;
}[keyof TObj & (string | number)];

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
  ? Text
  : TValue extends object
  ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
  : Text;

/**
 * Type for translation namespaces
 */
export type TranslationNamespace = keyof typeof enMessages;

/**
 * Type for common translations
 */
export type CommonTranslations = typeof enMessages.common;

/**
 * Type for navigation translations
 */
export type NavigationTranslations = typeof enMessages.navigation;

/**
 * Type for auth translations
 */
export type AuthTranslations = typeof enMessages.auth;

/**
 * Type for dashboard translations
 */
export type DashboardTranslations = typeof enMessages.dashboard;

/**
 * Type for reports translations
 */
export type ReportsTranslations = typeof enMessages.reports;

/**
 * Type for inventory translations
 */
export type InventoryTranslations = typeof enMessages.inventory;

/**
 * Type for forms translations
 */
export type FormsTranslations = typeof enMessages.forms;

/**
 * Type for errors translations
 */
export type ErrorsTranslations = typeof enMessages.errors;

/**
 * Type for settings translations
 */
export type SettingsTranslations = typeof enMessages.settings;

/**
 * Type for data log translations
 */
export type DataLogTranslations = typeof enMessages.dataLog;

/**
 * Type for analytics translations
 */
export type AnalyticsTranslations = typeof enMessages.analytics;

/**
 * Type for backup translations
 */
export type BackupTranslations = typeof enMessages.backup;

/**
 * Type for data entry translations
 */
export type DataEntryTranslations = typeof enMessages.dataEntry;

/**
 * Type for audit translations
 */
export type AuditTranslations = typeof enMessages.audit;

/**
 * Type for the entire messages object
 */
export type Messages = typeof enMessages;

/**
 * Helper type for translation parameters
 */
export type TranslationParams = Record<string, string | number>;

/**
 * Type-safe translation function signature
 */
export type TranslateFunction = <Key extends TranslationKeys>(
  key: Key,
  params?: TranslationParams
) => string;

/**
 * Utility type to extract nested value type from translation key
 */
export type TranslationValue<K extends string> = K extends keyof typeof enMessages
  ? typeof enMessages[K]
  : K extends `${infer Namespace}.${infer Rest}`
  ? Namespace extends keyof typeof enMessages
    ? Rest extends keyof typeof enMessages[Namespace]
      ? typeof enMessages[Namespace][Rest]
      : any
    : any
  : any;
