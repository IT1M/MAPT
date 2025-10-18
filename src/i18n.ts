import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Supported locales
export const locales = ['en', 'ar'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

export default getRequestConfig(async ({ requestLocale }) => {
  // This now receives a promise
  let locale = await requestLocale
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
