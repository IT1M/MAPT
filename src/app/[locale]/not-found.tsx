import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-6">
            <span className="text-5xl font-bold text-primary-600 dark:text-primary-400">
              404
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('message')}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="primary" size="medium">
            {t('backToDashboard')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
