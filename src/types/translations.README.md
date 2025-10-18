# Translation Type Safety

This directory contains TypeScript types for translation keys, providing compile-time type checking and IDE autocomplete for translation usage throughout the application.

## Overview

The translation system uses `next-intl` with TypeScript types generated from the English translation file (`messages/en.json`). This ensures:

- **Type Safety**: Catch missing or incorrect translation keys at compile time
- **Autocomplete**: Get IDE suggestions for available translation keys
- **Refactoring**: Safely rename or restructure translation keys
- **Documentation**: Self-documenting translation structure

## Usage

### Basic Usage with Typed Hooks

```tsx
import { useCommonTranslations } from '@/hooks/useTypedTranslations';

function MyComponent() {
  const t = useCommonTranslations();
  
  return (
    <div>
      <h1>{t('appName')}</h1>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}
```

### Using Specific Namespace Hooks

```tsx
import { 
  useNavigationTranslations,
  useAuthTranslations,
  useDashboardTranslations 
} from '@/hooks/useTypedTranslations';

function Navigation() {
  const tNav = useNavigationTranslations();
  const tAuth = useAuthTranslations();
  
  return (
    <nav>
      <a href="/dashboard">{tNav('dashboard')}</a>
      <a href="/inventory">{tNav('inventory')}</a>
      <button>{tAuth('signOut')}</button>
    </nav>
  );
}
```

### Using Generic Typed Hook

```tsx
import { useTypedTranslations } from '@/hooks/useTypedTranslations';

function ReportsPage() {
  const t = useTypedTranslations('reports');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### With Translation Parameters

```tsx
import { useDataLogTranslations } from '@/hooks/useTypedTranslations';

function DataLog() {
  const t = useDataLogTranslations();
  const count = 5;
  
  return (
    <div>
      {/* Pass parameters as second argument */}
      <p>{t('itemsSelected', { count })}</p>
      <p>{t('showing', { from: 1, to: 10, total: 100 })}</p>
    </div>
  );
}
```

### Server Components

For server components, use the standard `next-intl` API:

```tsx
import { getTranslations } from 'next-intl/server';

async function ServerComponent() {
  const t = await getTranslations('common');
  
  return (
    <div>
      <h1>{t('appName')}</h1>
    </div>
  );
}
```

## Available Translation Namespaces

The following typed hooks are available:

- `useCommonTranslations()` - Common UI elements (buttons, labels, etc.)
- `useNavigationTranslations()` - Navigation menu items
- `useAuthTranslations()` - Authentication and login
- `useDashboardTranslations()` - Dashboard page
- `useReportsTranslations()` - Reports functionality
- `useInventoryTranslations()` - Inventory management
- `useFormsTranslations()` - Form labels and validation
- `useErrorsTranslations()` - Error messages
- `useSettingsTranslations()` - Settings page
- `useDataLogTranslations()` - Data log viewer
- `useAnalyticsTranslations()` - Analytics dashboard
- `useBackupTranslations()` - Backup management
- `useDataEntryTranslations()` - Data entry forms
- `useAuditTranslations()` - Audit logs

## Type Definitions

### TranslationKeys

A union type of all possible translation keys in dot notation:

```typescript
type TranslationKeys = 
  | 'common.appName'
  | 'common.save'
  | 'navigation.dashboard'
  | 'auth.signIn'
  // ... all other keys
```

### TranslationNamespace

A union type of all top-level namespaces:

```typescript
type TranslationNamespace = 
  | 'common'
  | 'navigation'
  | 'auth'
  | 'dashboard'
  // ... all other namespaces
```

### TranslationParams

Type for translation parameters:

```typescript
type TranslationParams = Record<string, string | number>;
```

## Adding New Translations

1. Add the translation to `messages/en.json`:

```json
{
  "myNewSection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

2. Add the corresponding Arabic translation to `messages/ar.json`:

```json
{
  "myNewSection": {
    "title": "عنواني",
    "description": "وصفي"
  }
}
```

3. The TypeScript types will automatically include the new keys
4. Create a typed hook (optional):

```typescript
// In src/hooks/useTypedTranslations.ts
export function useMyNewSectionTranslations() {
  return useTranslations('myNewSection') as (
    key: keyof typeof enMessages.myNewSection,
    params?: TranslationParams
  ) => string;
}
```

## Validation

Run the translation validation script to ensure all translations are complete:

```bash
npm run validate:translations
```

This will check for:
- Missing translation keys
- Extra translation keys
- Placeholder variable mismatches
- Type mismatches
- Empty values

## Best Practices

1. **Always use typed hooks** instead of raw `useTranslations()`
2. **Keep translation keys descriptive** and organized by feature
3. **Use parameters** for dynamic content instead of string concatenation
4. **Validate translations** before committing changes
5. **Document complex translations** with comments in the JSON files
6. **Keep namespaces focused** - don't create overly broad categories
7. **Use consistent naming** - follow existing patterns

## Examples

### Good ✅

```tsx
// Using typed hook with autocomplete
const t = useCommonTranslations();
return <button>{t('save')}</button>;

// Using parameters
const t = useDataLogTranslations();
return <p>{t('itemsSelected', { count: 5 })}</p>;
```

### Bad ❌

```tsx
// No type safety
const t = useTranslations('common');
return <button>{t('savee')}</button>; // Typo not caught!

// String concatenation instead of parameters
return <p>{count} items selected</p>; // Not translatable!
```

## Troubleshooting

### Type errors after adding translations

If you add new translations but TypeScript doesn't recognize them:

1. Restart your TypeScript server (VS Code: Cmd/Ctrl + Shift + P → "Restart TS Server")
2. Ensure the translation exists in `messages/en.json` (the source of truth)
3. Check for syntax errors in the JSON file

### Missing autocomplete

If autocomplete isn't working:

1. Make sure you're using the typed hooks from `@/hooks/useTypedTranslations`
2. Check that your IDE's TypeScript version matches the project's
3. Restart your IDE

### Translation not found at runtime

If a translation key exists in types but fails at runtime:

1. Run `npm run validate:translations` to check for missing keys
2. Ensure the key exists in both `en.json` and `ar.json`
3. Check for typos in the translation key

## Related Files

- `src/types/translations.ts` - Type definitions
- `src/hooks/useTypedTranslations.ts` - Typed hooks
- `src/utils/translation-validator.ts` - Validation utilities
- `scripts/validate-translations.ts` - Validation CLI script
- `messages/en.json` - English translations (source of truth)
- `messages/ar.json` - Arabic translations
