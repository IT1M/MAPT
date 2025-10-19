'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/hooks/useTranslations'
import { 
  BookOpenIcon, 
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface HelpAdminLayoutProps {
  children: ReactNode
}

export default function HelpAdminLayout({ children }: HelpAdminLayoutProps) {
  const t = useTranslations('help.admin')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-semibold">
                <BookOpenIcon className="h-6 w-6 text-teal-600" />
                <span>{t('helpManagement')}</span>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/admin/help"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <BookOpenIcon className="h-5 w-5" />
                  <span>{t('articles')}</span>
                </Link>

                <Link
                  href="/admin/help/analytics"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span>{t('analytics')}</span>
                </Link>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  )
}
