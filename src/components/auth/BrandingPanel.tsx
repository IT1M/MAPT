'use client'

import { useTranslations } from 'next-intl'

export function BrandingPanel() {
  const t = useTranslations()

  const features = [
    {
      icon: '📊',
      title: t('auth.branding.feature1Title') || 'Real-time Analytics',
      description: t('auth.branding.feature1Desc') || 'Track inventory with AI-powered insights'
    },
    {
      icon: '🔒',
      title: t('auth.branding.feature2Title') || 'Secure & Reliable',
      description: t('auth.branding.feature2Desc') || 'Enterprise-grade security for your data'
    },
    {
      icon: '⚡',
      title: t('auth.branding.feature3Title') || 'Fast & Efficient',
      description: t('auth.branding.feature3Desc') || 'Streamlined workflows for maximum productivity'
    }
  ]

  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-12 text-white">
      {/* Logo and Title */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            🏥
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('common.appName')}
            </h1>
            <p className="text-teal-100 text-sm">
              {t('auth.branding.tagline') || 'Medical Inventory Management'}
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-6 mt-16">
          <h2 className="text-3xl font-bold leading-tight">
            {t('auth.branding.headline') || 'Manage your medical inventory with confidence'}
          </h2>
          <p className="text-teal-100 text-lg">
            {t('auth.branding.subheadline') || 'Powerful tools for tracking, analyzing, and optimizing your inventory operations'}
          </p>

          <div className="space-y-4 mt-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-teal-100 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-teal-100 text-sm">
        <p>© 2024 Saudi Mais Co. All rights reserved.</p>
      </div>
    </div>
  )
}
