'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { useTransition } from 'react'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return

    startTransition(() => {
      // Set locale cookie for persistence
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      
      // Replace the locale in the pathname
      const segments = pathname.split('/')
      segments[1] = newLocale
      const newPathname = segments.join('/')
      
      router.replace(newPathname)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          disabled={isPending}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${
              locale === loc
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }
            ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={`Switch to ${loc === 'en' ? 'English' : 'Arabic'}`}
        >
          {loc === 'en' ? 'EN' : 'ع'}
        </button>
      ))}
    </div>
  )
}
