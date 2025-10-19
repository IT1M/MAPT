import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import HelpCenterLayout from '@/components/help/HelpCenterLayout'
import HelpArticleList from '@/components/help/HelpArticleList'
import HelpSearchBar from '@/components/help/HelpSearchBar'
import HelpCategories from '@/components/help/HelpCategories'

export default async function HelpCenterPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const t = await getTranslations('help')

  return (
    <HelpCenterLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={<div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
              <HelpSearchBar initialQuery={params.q} />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
              <HelpCategories selectedCategory={params.category} />
            </Suspense>
          </aside>

          {/* Main Content - Articles */}
          <main className="lg:col-span-3">
            <Suspense fallback={<div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>}>
              <HelpArticleList 
                query={params.q}
                category={params.category}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </HelpCenterLayout>
  )
}
