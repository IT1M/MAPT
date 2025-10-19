import { BrandingPanel } from '@/components/auth/BrandingPanel'
import { LoginForm } from '@/components/auth/LoginForm'
import { useTranslations } from 'next-intl'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="flex min-h-screen">
      {/* Left Column - Branding Panel (Desktop Only) */}
      <BrandingPanel />

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
              <span className="text-3xl">🏥</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              <LoginPageTitle />
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <LoginPageSubtitle />
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <LoginForm locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Client components for translations
function LoginPageTitle() {
  'use client'
  const t = useTranslations()
  return <>{t('auth.welcomeBack')}</>
}

function LoginPageSubtitle() {
  'use client'
  const t = useTranslations()
  return <>{t('auth.signInToContinue')}</>
}
