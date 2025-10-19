'use client'

/**
 * WelcomeModal Component
 * Displays a welcome modal for first-time users
 */

import { useEffect, useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { UserRole } from '@prisma/client'

interface WelcomeModalProps {
  userName: string
  userRole: UserRole
  isFirstLogin?: boolean
}

export function WelcomeModal({
  userName,
  userRole,
  isFirstLogin = false,
}: WelcomeModalProps) {
  const t = useTranslations('dashboard')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    
    if (isFirstLogin || !hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [isFirstLogin])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  // Role-specific welcome messages
  const roleMessages: Record<UserRole, { title: string; features: string[] }> = {
    ADMIN: {
      title: t('welcome.admin.title'),
      features: [
        t('welcome.admin.feature1'),
        t('welcome.admin.feature2'),
        t('welcome.admin.feature3'),
        t('welcome.admin.feature4'),
      ],
    },
    MANAGER: {
      title: t('welcome.manager.title'),
      features: [
        t('welcome.manager.feature1'),
        t('welcome.manager.feature2'),
        t('welcome.manager.feature3'),
        t('welcome.manager.feature4'),
      ],
    },
    SUPERVISOR: {
      title: t('welcome.supervisor.title'),
      features: [
        t('welcome.supervisor.feature1'),
        t('welcome.supervisor.feature2'),
        t('welcome.supervisor.feature3'),
        t('welcome.supervisor.feature4'),
      ],
    },
    DATA_ENTRY: {
      title: t('welcome.dataEntry.title'),
      features: [
        t('welcome.dataEntry.feature1'),
        t('welcome.dataEntry.feature2'),
        t('welcome.dataEntry.feature3'),
        t('welcome.dataEntry.feature4'),
      ],
    },
    AUDITOR: {
      title: t('welcome.auditor.title'),
      features: [
        t('welcome.auditor.feature1'),
        t('welcome.auditor.feature2'),
        t('welcome.auditor.feature3'),
        t('welcome.auditor.feature4'),
      ],
    },
  }

  const roleContent = roleMessages[userRole]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t('welcome.greeting')}, {userName}!
                </h2>
                <p className="text-primary-100 text-sm">
                  {roleContent.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('welcome.whatYouCanDo')}
            </h3>
            <ul className="space-y-3">
              {roleContent.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('welcome.quickTip')}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('welcome.keyboardShortcut')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            {t('welcome.getStarted')}
          </button>
        </div>
      </div>
    </div>
  )
}
