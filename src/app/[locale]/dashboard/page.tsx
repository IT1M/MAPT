import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard'

async function getDashboardData() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return default values on error
    return {
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      totalItems: 0,
      rejectRate: 0,
      activeUsers: 0,
      maisPercentage: 0,
      fozanPercentage: 0,
      trendData: [],
      recentItems: []
    }
  }
}

export default async function DashboardPage() {
  // Check authentication
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Get translations
  const t = await getTranslations()

  // Fetch dashboard data
  const dashboardData = await getDashboardData()

  // Format role for display
  const roleKey = session.user.role.toLowerCase().replace('_', '') as 'admin' | 'dataEntry' | 'supervisor' | 'manager' | 'auditor'
  const roleDisplay = t(`roles.${roleKey}`)

  // Prepare data for RoleBasedDashboard
  const data = {
    userName: session.user.name || 'User',
    userRole: roleDisplay,
    role: session.user.role,
    todayCount: dashboardData.todayCount,
    weekCount: dashboardData.weekCount,
    monthCount: dashboardData.monthCount,
    totalItems: dashboardData.totalItems,
    rejectRate: dashboardData.rejectRate,
    activeUsers: dashboardData.activeUsers,
    maisPercentage: dashboardData.maisPercentage,
    fozanPercentage: dashboardData.fozanPercentage,
    trendData: dashboardData.trendData,
    recentActivities: dashboardData.recentItems
  }

  return <RoleBasedDashboard data={data} />
}
