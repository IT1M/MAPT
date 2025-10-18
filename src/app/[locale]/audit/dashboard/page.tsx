import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { prisma } from '@/services/prisma'
import { AIInsightsWidget } from '@/components/dashboard/ai-insights-widget'
import { InventoryTrendsWidget } from '@/components/dashboard/inventory-trends-widget'

interface DashboardMetrics {
  totalItems: number
  highRejectItems: number
  recentItems: Array<{
    id: string
    itemName: string
    batch: string
    quantity: number
    destination: string
    enteredBy: string
    createdAt: string
  }>
}

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Fetch inventory items (excluding soft-deleted)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        deletedAt: null
      }
    })

    // Count items with high reject rate (reject > 10% of quantity)
    const highRejectCount = inventoryItems.filter(
      item => item.reject > 0 && (item.reject / item.quantity) > 0.1
    ).length

    // Fetch recent inventory items (last 10)
    const recentItems = await prisma.inventoryItem.findMany({
      take: 10,
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        enteredBy: {
          select: {
            name: true
          }
        }
      }
    })

    // Format items for response
    const formattedItems = recentItems.map(item => ({
      id: item.id,
      itemName: item.itemName,
      batch: item.batch,
      quantity: item.quantity,
      destination: item.destination,
      enteredBy: item.enteredBy.name,
      createdAt: item.createdAt.toISOString()
    }))

    return {
      totalItems: inventoryItems.length,
      highRejectItems: highRejectCount,
      recentItems: formattedItems
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return default values on error
    return {
      totalItems: 0,
      highRejectItems: 0,
      recentItems: [],
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

  // Fetch dashboard metrics
  const metrics = await getDashboardMetrics()

  // Format role for display
  const roleKey = session.user.role.toLowerCase().replace('_', '') as 'admin' | 'dataEntry' | 'supervisor' | 'manager' | 'auditor'
  const roleDisplay = t(`roles.${roleKey}`)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          {t('common.welcome')}, {session.user.name}!
        </h1>
        <p className="text-primary-50 text-lg">
          {roleDisplay} • {t('dashboard.overview')}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Items Card */}
        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dashboard.totalItems')}
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {metrics.totalItems}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('navigation.inventory')}
                </p>
              </div>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* High Reject Items Card */}
        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dashboard.highReject')}
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-danger-600 dark:text-danger-400">
                  {metrics.highRejectItems}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('common.items')}
                </p>
              </div>
              <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-danger-600 dark:text-danger-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Items Count Card */}
        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dashboard.recentItems')}
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-accent-600 dark:text-accent-400">
                  {metrics.recentItems.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('common.items')}
                </p>
              </div>
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent-600 dark:text-accent-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* AI Widgets Grid */}
      {(session.user.permissions.includes('reports:view') || 
        session.user.permissions.includes('inventory:read')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIInsightsWidget />
          <InventoryTrendsWidget />
        </div>
      )}

      {/* Recent Items List */}
      <Card>
        <Card.Header>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('dashboard.recentItems')}
          </h3>
        </Card.Header>
        <Card.Body>
          {metrics.recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.itemName')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.destination')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.quantity')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.date')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.recentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.destination === 'MAIS'
                              ? 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400'
                              : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                          }`}
                        >
                          {item.destination}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
