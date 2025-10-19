# 📝 إصلاحات إضافية غير حرجة

## 1. استبدال imports من next-intl

### الملفات التي لا تزال تستخدم next-intl:

#### ✅ تم إصلاحها (استخدام hooks محلية):
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/navigation.tsx`
- `src/components/layout/Breadcrumbs.tsx`

#### ⚠️ تحتاج إصلاح:

**1. ملفات الصفحات:**
```typescript
// الملفات:
// - src/app/login/page.tsx
// - src/app/register/page.tsx
// - src/app/forgot-password/page.tsx
// - src/app/reset-password/page.tsx
// - src/app/(dashboard)/inventory/page.tsx
// - src/app/(dashboard)/audit/page.tsx
// - src/app/(dashboard)/data-log/page.tsx

// ❌ قبل
import { useTranslations } from 'next-intl'

// ✅ بعد
import { useTranslations } from '@/hooks/useTranslations'
```

**2. ملفات الـ Hooks:**
```typescript
// الملفات:
// - src/hooks/useApiErrorHandler.ts
// - src/hooks/useSettingsSearch.ts
// - src/hooks/useTypedTranslations.ts

// ❌ قبل
import { useTranslations, useLocale } from 'next-intl'

// ✅ بعد
import { useTranslations } from '@/hooks/useTranslations'
import { useLocale } from '@/hooks/useLocale'
```

**3. ملفات الاختبار:**
```typescript
// الملفات:
// - src/__tests__/**/*.test.tsx
// - src/components/**/__tests__/*.test.tsx

// ❌ قبل
import { NextIntlClientProvider } from 'next-intl'

// ✅ بعد
// إما حذف أو استبدال بـ mock بسيط
const MockIntlProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
```

---

## 2. إزالة hardcoded locale checks

### المكونات التي تحتوي على `locale === 'ar'`:

```typescript
// الملفات المتأثرة (15+ ملف):
// - src/components/dashboard/DashboardGreeting.tsx
// - src/components/analytics/AIInsightsPanel.tsx
// - src/components/analytics/charts/*.tsx
// - src/components/backup/*.tsx
// - src/components/notifications/NotificationItem.tsx
// - src/components/settings/*.tsx

// ❌ قبل
const locale = useLocale()
const isRTL = locale === 'ar'
const dateLocale = locale === 'ar' ? ar : enUS

// ✅ بعد (بما أن اللغة الإنجليزية فقط):
const locale = 'en' // أو حذف المتغير تماماً
const isRTL = false
const dateLocale = enUS

// أو استخدام hook مبسط:
const { isRTL, dateLocale } = useLocaleConfig() // hook جديد
```

---

## 3. تحديث ملفات الاختبار

### إزالة `/en` من جميع الاختبارات:

```bash
# الملفات المتأثرة:
# - src/utils/__tests__/route-permissions.test.ts
# - src/utils/__tests__/dashboard-routing.test.ts
# - src/components/layout/__tests__/*.test.tsx
# - src/__tests__/integration/*.test.tsx

# أمر سريع:
find src -name "*.test.ts" -o -name "*.test.tsx" | \
  xargs sed -i '' 's/\/en\//\//g'
```

**مثال للتحديث:**
```typescript
// ❌ قبل
expect(getBaseRoute('/en/dashboard')).toBe('/dashboard')
expect(getDashboardUrl('ADMIN', 'en')).toBe('/en/dashboard')

// ✅ بعد
expect(getBaseRoute('/dashboard')).toBe('/dashboard')
expect(getDashboardUrl('ADMIN')).toBe('/dashboard')
```

---

## 4. تبسيط locale parameters

### إزالة locale parameter من الدوال:

```typescript
// ملف: src/utils/dashboard-routing.ts
// ❌ قبل
export function getDashboardUrl(
  role: UserRole,
  locale: string,
  callbackUrl?: string
): string

// ✅ بعد
export function getDashboardUrl(
  role: UserRole,
  callbackUrl?: string
): string
```

```typescript
// ملف: src/components/reports/ReportsManagementPage.tsx
// ❌ قبل
<ReportsManagementPage locale="en" userRole={session.user.role} />

// ✅ بعد
<ReportsManagementPage userRole={session.user.role} />
```

---

## 5. تنظيف date formatting

### توحيد تنسيق التواريخ:

```typescript
// ❌ قبل
const locale = typeof window !== 'undefined' ? document.documentElement.lang : 'en'
const dateLocale = locale === 'ar' ? ar : enUS
formatDistanceToNow(date, { locale: dateLocale })

// ✅ بعد
import { enUS } from 'date-fns/locale'
formatDistanceToNow(date, { locale: enUS })

// أو إنشاء utility function:
import { formatDate } from '@/utils/date-helpers'
formatDate(date, 'relative') // يستخدم enUS تلقائياً
```

---

## 6. تنظيف RTL logic

### إزالة RTL checks غير الضرورية:

```typescript
// ❌ قبل
<div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  <ChevronRight className={locale === 'ar' ? 'rotate-180' : ''} />
</div>

// ✅ بعد (بما أن اللغة الإنجليزية فقط):
<div dir="ltr">
  <ChevronRight />
</div>

// أو حذف dir تماماً (default هو ltr):
<div>
  <ChevronRight />
</div>
```

---

## 7. تحديث NotificationDemo

### إزالة `/en` من الروابط:

```typescript
// ملف: src/components/notifications/NotificationDemo.tsx

// ❌ قبل
addNotification({
  title: 'Success!',
  message: 'Your item has been saved successfully',
  actionUrl: '/en/data-log',
  actionLabel: 'View in Data Log'
})

// ✅ بعد
addNotification({
  title: 'Success!',
  message: 'Your item has been saved successfully',
  actionUrl: '/data-log',
  actionLabel: 'View in Data Log'
})
```

---

## 8. إنشاء utility hooks مبسطة

### إنشاء hooks جديدة للتبسيط:

```typescript
// ملف جديد: src/hooks/useLocaleConfig.ts
export function useLocaleConfig() {
  return {
    locale: 'en' as const,
    isRTL: false,
    direction: 'ltr' as const,
    dateLocale: enUS,
    dateFormat: 'en-US',
  }
}
```

```typescript
// ملف جديد: src/utils/date-helpers.ts
import { formatDistanceToNow, format } from 'date-fns'
import { enUS } from 'date-fns/locale'

export function formatDate(date: Date | string, type: 'relative' | 'short' | 'long' = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  
  switch (type) {
    case 'relative':
      return formatDistanceToNow(d, { addSuffix: true, locale: enUS })
    case 'short':
      return format(d, 'MMM d, yyyy', { locale: enUS })
    case 'long':
      return format(d, 'MMMM d, yyyy', { locale: enUS })
    default:
      return d.toLocaleDateString('en-US')
  }
}
```

---

## 9. تنظيف ملفات غير مستخدمة

### ملفات يمكن حذفها أو تعطيلها:

```bash
# ملفات الأمثلة والتوثيق:
# - src/components/filters/USAGE_EXAMPLE.tsx (يسبب build error)
# - src/app/not-found-locale.tsx (غير مستخدم)
# - src/app/error-locale.tsx (غير مستخدم)

# أمر الحذف:
rm src/components/filters/USAGE_EXAMPLE.tsx
rm src/app/not-found-locale.tsx
rm src/app/error-locale.tsx
```

---

## 10. تحديث SettingsSearch component

### إزالة locale prop:

```typescript
// ملف: src/components/settings/SettingsSearch.tsx

// ❌ قبل
export const SettingsSearch = forwardRef<HTMLInputElement, SettingsSearchProps>(
  function SettingsSearch({ onSearch, placeholder, debounceMs = 300, locale = 'en' }, ref) {
    const isRTL = locale === 'ar'
    // ...
  }
)

// ✅ بعد
export const SettingsSearch = forwardRef<HTMLInputElement, SettingsSearchProps>(
  function SettingsSearch({ onSearch, placeholder, debounceMs = 300 }, ref) {
    const isRTL = false // أو حذف تماماً
    // ...
  }
)
```

---

## 📊 ملخص الإصلاحات غير الحرجة

| الفئة | عدد الملفات | الأولوية |
|-------|-------------|----------|
| استبدال next-intl imports | 20+ ملف | متوسطة |
| إزالة locale checks | 15+ ملف | منخفضة |
| تحديث ملفات الاختبار | 10+ ملف | متوسطة |
| تبسيط locale parameters | 5+ ملف | منخفضة |
| تنظيف date formatting | 8+ ملف | منخفضة |
| إزالة RTL logic | 10+ ملف | منخفضة |
| حذف ملفات غير مستخدمة | 3 ملفات | منخفضة |

---

## 🚀 أوامر سريعة للتنفيذ

```bash
# 1. حذف ملفات غير مستخدمة
rm src/components/filters/USAGE_EXAMPLE.tsx
rm src/app/not-found-locale.tsx
rm src/app/error-locale.tsx

# 2. تحديث ملفات الاختبار
find src -name "*.test.ts" -o -name "*.test.tsx" | \
  xargs sed -i '' 's/\/en\//\//g'

# 3. إزالة locale === 'ar' checks (يدوياً أو بـ script)
# هذا يحتاج مراجعة يدوية لكل ملف

# 4. استبدال next-intl imports
find src/app src/hooks -type f -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i '' "s|from 'next-intl'|from '@/hooks/useTranslations'|g"

# 5. إعادة البناء
rm -rf .next
npm run build
```

---

## 💡 ملاحظات

1. **هذه الإصلاحات غير حرجة** - المشروع يعمل بدونها
2. **يمكن تنفيذها تدريجياً** - لا حاجة للاستعجال
3. **بعضها يحتاج مراجعة يدوية** - خاصة locale checks
4. **الأولوية للإصلاحات الحرجة أولاً** - من ملف CRITICAL_FIXES_NEEDED.md

---

**تاريخ الإنشاء**: 19 أكتوبر 2024  
**الحالة**: اختياري - للتحسين والتنظيف
