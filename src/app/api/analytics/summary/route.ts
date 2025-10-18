import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { successResponse, handleApiError } from '@/utils/api-response'

// In-memory cache for analytics summary
interface CacheEntry {
  data: any
  timestamp: number
}

const summaryCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/analytics/summary
 * 
 * Returns comprehensive inventory summary including:
 * - Total items and quantity
 * - Reject rate
 * - Data grouped by destination (MAIS vs FOZAN)
 * - Data grouped by month
 * - Data grouped by category
 * - Active users count
 * - Top contributor
 * - Average daily entries
 * 
 * Query Parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - destination: MAIS | FOZAN (optional)
 * - category: string (optional)
 * - userId: string (optional, ADMIN only)
 * 
 * Implements 5-minute caching for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const destination = searchParams.get('destination')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')

    // Generate cache key based on filters
    const cacheKey = `summary:${context.user.role}:${startDate}:${endDate}:${destination}:${category}:${userId}`

    // Check cache
    const cached = summaryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data)
    }

    // Fetch all inventory items (excluding soft-deleted)
    const whereClause: any = {
      deletedAt: null,
    }

    // Apply role-based filtering (DATA_ENTRY sees only their items)
    if (context.user.role === 'DATA_ENTRY') {
      whereClause.enteredById = context.user.id
    }

    // Apply date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Apply destination filter
    if (destination && (destination === 'MAIS' || destination === 'FOZAN')) {
      whereClause.destination = destination
    }

    // Apply category filter
    if (category) {
      whereClause.category = category
    }

    // Apply user filter (ADMIN only)
    if (userId && (context.user.role === 'ADMIN' || context.user.role === 'SUPERVISOR')) {
      whereClause.enteredById = userId
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        quantity: true,
        reject: true,
        destination: true,
        category: true,
        createdAt: true,
        enteredById: true,
      },
    })

    // Calculate total items and total quantity
    const totalItems = inventoryItems.length
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)

    // Calculate reject rate: (sum(reject) / sum(quantity)) * 100
    const totalReject = inventoryItems.reduce((sum, item) => sum + item.reject, 0)
    const rejectRate = totalQuantity > 0 ? (totalReject / totalQuantity) * 100 : 0

    // Group by destination (MAIS vs FOZAN)
    const byDestination = {
      MAIS: {
        items: 0,
        quantity: 0,
      },
      FOZAN: {
        items: 0,
        quantity: 0,
      },
    }

    inventoryItems.forEach((item) => {
      if (item.destination === 'MAIS') {
        byDestination.MAIS.items++
        byDestination.MAIS.quantity += item.quantity
      } else if (item.destination === 'FOZAN') {
        byDestination.FOZAN.items++
        byDestination.FOZAN.quantity += item.quantity
      }
    })

    // Group by month (YYYY-MM format)
    const monthlyData = new Map<string, { items: number; quantity: number }>()

    inventoryItems.forEach((item) => {
      const month = item.createdAt.toISOString().substring(0, 7) // YYYY-MM
      const existing = monthlyData.get(month) || { items: 0, quantity: 0 }
      monthlyData.set(month, {
        items: existing.items + 1,
        quantity: existing.quantity + item.quantity,
      })
    })

    const byMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        items: data.items,
        quantity: data.quantity,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Group by category
    const categoryData = new Map<string, { items: number; quantity: number }>()

    inventoryItems.forEach((item) => {
      const category = item.category || 'Uncategorized'
      const existing = categoryData.get(category) || { items: 0, quantity: 0 }
      categoryData.set(category, {
        items: existing.items + 1,
        quantity: existing.quantity + item.quantity,
      })
    })

    const byCategory = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        items: data.items,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.items - a.items) // Sort by item count descending

    // Calculate active users count (unique users who entered data in the period)
    const uniqueUserIds = new Set(inventoryItems.map(item => item.enteredById))
    const activeUsers = uniqueUserIds.size

    // Calculate top contributor
    const userContributions = new Map<string, number>()
    inventoryItems.forEach((item) => {
      const count = userContributions.get(item.enteredById) || 0
      userContributions.set(item.enteredById, count + 1)
    })

    let topContributor = null
    if (userContributions.size > 0) {
      const topUserId = Array.from(userContributions.entries())
        .sort((a, b) => b[1] - a[1])[0]
      
      if (topUserId) {
        const topUser = await prisma.user.findUnique({
          where: { id: topUserId[0] },
          select: { name: true }
        })
        
        if (topUser) {
          topContributor = {
            name: topUser.name,
            count: topUserId[1]
          }
        }
      }
    }

    // Calculate average daily entries
    let avgDailyEntries = 0
    if (inventoryItems.length > 0) {
      // Get date range from items
      const dates = inventoryItems.map(item => item.createdAt.toISOString().split('T')[0])
      const uniqueDates = new Set(dates)
      const dayCount = uniqueDates.size || 1
      avgDailyEntries = Math.round((inventoryItems.length / dayCount) * 100) / 100
    }

    // Build response data
    const responseData = {
      totalItems,
      totalQuantity,
      rejectRate: Math.round(rejectRate * 100) / 100, // Round to 2 decimal places
      byDestination,
      byMonth,
      byCategory,
      activeUsers,
      topContributor,
      avgDailyEntries,
    }

    // Cache the result
    summaryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    })

    return successResponse(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}
