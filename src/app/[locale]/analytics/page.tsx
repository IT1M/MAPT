import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load the analytics dashboard for better performance
const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics/AnalyticsDashboard').then((mod) => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // Check authentication and role
  const session = await auth()
  
  if (!session) {
    redirect(`/${locale}/login`)
  }

  // Check if user has SUPERVISOR or higher role
  const allowedRoles = ['SUPERVISOR', 'MANAGER', 'ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard')
  }

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>
      
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </>
  )
}
