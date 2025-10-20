/**
 * Simplified translations hook
 * Loads English translations only
 */

import enMessages from '../../messages/en.json';

type Messages = typeof enMessages;
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export function useTranslations(namespace?: string) {
  return (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');

    let value: any = enMessages;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fullKey; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : fullKey;
  };
}
