import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import ReportsManagementPage from '@/components/reports/ReportsManagementPage'

export default async function ReportsPage({
  params,
}: {
  params: { locale: string }
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Check if user has permission to view reports
  const allowedRoles = ['ADMIN', 'MANAGER', 'AUDITOR']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard')
  }

  return <ReportsManagementPage locale={params.locale} userRole={session.user.role} />
}
