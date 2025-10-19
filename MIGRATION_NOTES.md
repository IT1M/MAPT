# Migration to Single Language (English Only)

## ✅ Changes Made

### 1. Configuration Updates
- **next.config.js**: Removed `next-intl` plugin, added native i18n config with English only
- **src/middleware.ts**: Removed internationalization middleware, kept auth only
- **src/i18n.ts**: Kept for compatibility but not actively used

### 2. Routing Structure
- Moved all pages from `src/app/[locale]/*` to `src/app/*`
- Removed `/en` prefix from all routes
- Home page now at `http://localhost:3000` instead of `http://localhost:3000/en`
- All routes now direct (e.g., `/dashboard`, `/data-entry`, `/settings`)

### 3. Download Prevention
- Created `src/utils/download-helper.ts` with centralized download control
- Set `ENABLE_AUTO_DOWNLOAD = true` by default
- To disable automatic downloads, change to `false` in the helper file
- All download operations now logged to console when disabled

### 4. Code Updates
- Updated all `router.push()` calls to remove `/en` prefix
- Updated `getDashboardUrl()` to not prepend locale
- Updated error handlers to redirect without locale
- Created simplified `useLocale()` hook that always returns 'en'

### 5. Files Removed
- `src/app/[locale]/` directory (moved contents to `src/app/`)

### 6. Files to Update Manually (if needed)
The following files still reference `useLocale()` from next-intl:
- src/components/layout/header.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navigation.tsx
- src/components/layout/Breadcrumbs.tsx
- src/components/ui/locale-switcher.tsx (can be removed entirely)

To fix: Replace `import { useLocale } from 'next-intl'` with `import { useLocale } from '@/hooks/useLocale'`

## 🧹 Next Steps

1. **Clean Build**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

2. **Test Routes**:
   - Home: `http://localhost:3000`
   - Dashboard: `http://localhost:3000/dashboard`
   - Login: `http://localhost:3000/login`
   - Settings: `http://localhost:3000/settings`

3. **Remove Locale Switcher** (optional):
   - Delete `src/components/ui/locale-switcher.tsx`
   - Remove `<LocaleSwitcher />` from any pages that use it

4. **Disable Downloads** (if needed):
   - Edit `src/utils/download-helper.ts`
   - Change `ENABLE_AUTO_DOWNLOAD = false`

## 🐛 Known Issues

### Webpack Error Fix
The `Cannot read properties of undefined (reading 'call')` error was caused by:
- next-intl's dynamic locale routing
- Webpack module resolution conflicts with `[locale]` dynamic segments

**Solution**: Removed next-intl entirely and used Next.js native i18n config.

### Download Prevention
Automatic file downloads during navigation were caused by:
- Error handlers trying to save error state as files
- Export components triggering downloads on failed API calls

**Solution**: Centralized download logic with enable/disable flag.

## 💡 Prevention Tips

1. **Avoid Dynamic Segments in App Router**: Use route groups `(group)` instead of `[param]` when possible
2. **Centralize Download Logic**: Always use helper functions instead of inline `URL.createObjectURL()`
3. **Test Without Locale**: If you don't need i18n, don't use i18n libraries
4. **Clean Builds**: Always `rm -rf .next` when changing routing structure

## 📝 Arabic Language Support (Future)

If you need to re-enable Arabic later:
1. Keep the `messages/ar.json` file (not deleted)
2. Re-enable next-intl in `next.config.js`
3. Restore `[locale]` routing structure
4. Update all routes to include locale parameter

For now, Arabic is disabled but translations are preserved.
