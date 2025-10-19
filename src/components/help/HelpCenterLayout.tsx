'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/hooks/useTranslations'
import { 
  BookOpenIcon, 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline'

interface HelpCenterLayoutProps {
  children: ReactNode
}

export default function HelpCenterLayout({ children }: HelpCenterLayoutProps) {
  const t = useTranslations('help')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/help"
                className="flex items-center space-x-2 text-gray-900 dark:text-white font-semibold"
              >
                <BookOpenIcon className="h-6 w-6 text-teal-600" />
                <span>{t('helpCenter')}</span>
              </Link>

              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/help"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                  <span>{t('articles')}</span>
                </Link>

                <Link
                  href="/help/support"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span>{t('contactSupport')}</span>
                </Link>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
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
