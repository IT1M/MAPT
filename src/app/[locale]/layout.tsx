import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { locales } from '@/i18n'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Navigation } from '@/components/layout/navigation'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Await params in Next.js 15
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Get messages for the locale
  const messages = await getMessages()

  // Determine text direction based on locale
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  
  // Determine font family based on locale
  const fontFamily = locale === 'ar' ? 'font-arabic' : 'font-sans'

  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages}>
        <div className={`min-h-screen ${fontFamily}`} dir={dir}>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <Header />
              
              {/* Navigation */}
              <Navigation />
              
              {/* Page content */}
              <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </NextIntlClientProvider>
    </SessionProvider>
  )
}
