import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load the reports management page for better performance
const ReportsManagementPage = dynamic(
  () => import('@/components/reports/ReportsManagementPage'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  
  if (!session) {
    redirect(`/${locale}/login`)
  }

  // Check if user has permission to view reports
  const allowedRoles = ['ADMIN', 'MANAGER', 'AUDITOR']
  if (!allowedRoles.includes(session.user.role)) {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        </div>
      }
    >
      <ReportsManagementPage locale={locale} userRole={session.user.role} />
    </Suspense>
  )
}
