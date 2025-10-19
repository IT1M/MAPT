import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  // Check authentication and role
  const session = await auth()
  
  if (!session) {
    redirect(`/login`)
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
      
      <AnalyticsDashboard />
    </>
  )
}
