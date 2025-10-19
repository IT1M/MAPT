import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getTranslations } from 'next-intl/server'
import HelpAdminLayout from '@/components/help/admin/HelpAdminLayout'
import HelpArticleManager from '@/components/help/admin/HelpArticleManager'

export default async function HelpAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/access-denied')
  }

  const t = await getTranslations('help.admin')

  return (
    <HelpAdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <HelpArticleManager />
      </div>
    </HelpAdminLayout>
  )
}
