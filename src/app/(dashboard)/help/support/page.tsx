import { getTranslations } from 'next-intl/server'
import HelpCenterLayout from '@/components/help/HelpCenterLayout'
import SupportForm from '@/components/help/SupportForm'
import HelpBreadcrumbs from '@/components/help/HelpBreadcrumbs'

export default async function SupportPage() {
  const t = await getTranslations('help')

  return (
    <HelpCenterLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <HelpBreadcrumbs
          items={[
            { label: t('home'), href: '/help' },
            { label: t('contactSupport') }
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('contactSupport')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('supportDescription')}
          </p>
        </div>

        {/* Support Form */}
        <SupportForm />
      </div>
    </HelpCenterLayout>
  )
}
