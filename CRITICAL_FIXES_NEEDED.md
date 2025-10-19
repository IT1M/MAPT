# 🚨 إصلاحات حرجة مطلوبة

## 1. إصلاح auth.config.ts

```typescript
// ملف: src/auth.config.ts
// السطر: 9-10

// ❌ قبل
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/en/login',
    error: '/en/login',
  },

// ✅ بعد
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
```

## 2. إصلاح useApiErrorHandler.ts

المشكلة: استخدام React Hooks بشكل conditional

```typescript
// ملف: src/hooks/useApiErrorHandler.ts

// ❌ المشكلة
if (condition) {
  useCallback(() => {}, [])  // خطأ: conditional hook
}

// ✅ الحل
const callback = useCallback(() => {
  if (condition) {
    // logic here
  }
}, [condition])
```

## 3. حذف أو إصلاح USAGE_EXAMPLE.tsx

```bash
# الخيار 1: حذف الملف (إذا كان للتوثيق فقط)
rm src/components/filters/USAGE_EXAMPLE.tsx

# الخيار 2: إضافة import مفقود
# في src/components/filters/USAGE_EXAMPLE.tsx
import { FilterBuilder } from '@/components/filters/FilterBuilder'
```

## 4. تحديث ملفات الاختبار

```bash
# استخدم هذا الأمر لتحديث جميع ملفات الاختبار
find src/__tests__ src/components -name "*.test.tsx" -o -name "*.test.ts" | \
  xargs sed -i '' 's/\/en\//\//g'
```

## 5. استبدال أكواد التنزيل

### مثال للتحويل:

```typescript
// ❌ قبل
const blob = new Blob([csv], { type: 'text/csv' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `file-${Date.now()}.csv`
a.click()
URL.revokeObjectURL(url)

// ✅ بعد
import { downloadCSV } from '@/utils/download-helper'
downloadCSV(csv, `file-${Date.now()}.csv`)
```

### الملفات التي تحتاج تحديث:
- src/components/analytics/charts/*.tsx (7 ملفات)
- src/components/export/ExportButton.tsx
- src/components/export/ExportModal.tsx
- src/components/reports/ReportsManagementPage.tsx
- src/components/backup/BackupManagementPage.tsx
- src/hooks/useThemeCustomization.ts

## أوامر سريعة للإصلاح

```bash
# 1. إصلاح auth.config.ts
sed -i '' "s|signIn: '/en/login'|signIn: '/login'|g" src/auth.config.ts
sed -i '' "s|error: '/en/login'|error: '/login'|g" src/auth.config.ts

# 2. إصلاح route-permissions.ts
sed -i '' "s|pathname === '/en'|pathname === '/'|g" src/utils/route-permissions.ts
sed -i '' "s|pathname === '/ar'|// pathname === '/ar' // Disabled|g" src/utils/route-permissions.ts

# 3. تحديث ملفات الاختبار
find src -name "*.test.tsx" -exec sed -i '' 's/\/en\//\//g' {} \;

# 4. إعادة البناء
rm -rf .next
npm run build
```
