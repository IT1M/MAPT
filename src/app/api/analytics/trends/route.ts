import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { successResponse, handleApiError, validationError } from '@/utils/api-response'

// In-memory cache for analytics trends
interface CacheEntry {
  data: any
  timestamp: number
}

const trendsCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type Period = '7d' | '30d' | '90d' | '1y'
type GroupBy = 'day' | 'week' | 'month'

/**
 * Calculate date range from period parameter
 */
function getDateRange(period: Period): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()

  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
  }

  return { startDate, endDate }
}

/**
 * Format date based on groupBy parameter
 */
function formatDateByGroup(date: Date, groupBy: GroupBy): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (groupBy) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week':
      // Get ISO week number
      const weekDate = new Date(date)
      weekDate.setHours(0, 0, 0, 0)
      weekDate.setDate(weekDate.getDate() + 4 - (weekDate.getDay() || 7))
      const yearStart = new Date(weekDate.getFullYear(), 0, 1)
      const weekNo = Math.ceil(((weekDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${year}-W${String(weekNo).padStart(2, '0')}`
    case 'month':
      return `${year}-${month}`
  }
}

/**
 * GET /api/analytics/trends
 * 
 * Returns time-series trend data for inventory items
 * 
 * Query Parameters:
 * - period: '7d' | '30d' | '90d' | '1y' (default: '30d')
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 * - startDate: ISO date string (optional, overrides period)
 * - endDate: ISO date string (optional, overrides period)
 * - destination: MAIS | FOZAN (optional)
 * - category: string (optional)
 * - userId: string (optional, ADMIN/SUPERVISOR only)
 * 
 * Returns:
 * - timeSeries: Array of data points grouped by time unit
 * - growthRate: Percentage growth from first to last period
 * - peakPeriod: Period with highest item count
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
    const period = (searchParams.get('period') || '30d') as Period
    const groupBy = (searchParams.get('groupBy') || 'day') as GroupBy
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const destination = searchParams.get('destination')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')

    // Validate parameters
    const validPeriods: Period[] = ['7d', '30d', '90d', '1y']
    const validGroupBy: GroupBy[] = ['day', 'week', 'month']

    if (!validPeriods.includes(period)) {
      return validationError('Invalid period. Must be one of: 7d, 30d, 90d, 1y')
    }

    if (!validGroupBy.includes(groupBy)) {
      return validationError('Invalid groupBy. Must be one of: day, week, month')
    }

    // Generate cache key
    const cacheKey = `trends:${context.user.role}:${period}:${groupBy}:${startDateParam}:${endDateParam}:${destination}:${category}:${userId}`

    // Check cache
    const cached = trendsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data)
    }

    // Calculate date range (use custom dates if provided, otherwise use period)
    let startDate: Date
    let endDate: Date

    if (startDateParam || endDateParam) {
      endDate = endDateParam ? new Date(endDateParam) : new Date()
      startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      const dateRange = getDateRange(period)
      startDate = dateRange.startDate
      endDate = dateRange.endDate
    }

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Apply role-based filtering
    if (context.user.role === 'DATA_ENTRY') {
      whereClause.enteredById = context.user.id
    }

    // Apply destination filter
    if (destination && (destination === 'MAIS' || destination === 'FOZAN')) {
      whereClause.destination = destination
    }

    // Apply category filter
    if (category) {
      whereClause.category = category
    }

    // Apply user filter (ADMIN/SUPERVISOR only)
    if (userId && (context.user.role === 'ADMIN' || context.user.role === 'SUPERVISOR')) {
      whereClause.enteredById = userId
    }

    // Fetch inventory items within date range
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        quantity: true,
        reject: true,
        createdAt: true,
        destination: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by specified time unit
    const timeSeriesData = new Map<string, { 
      items: number
      totalQuantity: number
      maisQuantity: number
      fozanQuantity: number
      rejectQuantity: number
    }>()

    inventoryItems.forEach((item) => {
      const dateKey = formatDateByGroup(item.createdAt, groupBy)
      const existing = timeSeriesData.get(dateKey) || { 
        items: 0, 
        totalQuantity: 0, 
        maisQuantity: 0, 
        fozanQuantity: 0, 
        rejectQuantity: 0 
      }
      
      timeSeriesData.set(dateKey, {
        items: existing.items + 1,
        totalQuantity: existing.totalQuantity + item.quantity,
        maisQuantity: existing.maisQuantity + (item.destination === 'MAIS' ? item.quantity : 0),
        fozanQuantity: existing.fozanQuantity + (item.destination === 'FOZAN' ? item.quantity : 0),
        rejectQuantity: existing.rejectQuantity + item.reject,
      })
    })

    // Convert to array and sort
    const timeSeries = Array.from(timeSeriesData.entries())
      .map(([date, data]) => ({
        date,
        items: data.items,
        totalQuantity: data.totalQuantity,
        maisQuantity: data.maisQuantity,
        fozanQuantity: data.fozanQuantity,
        rejectQuantity: data.rejectQuantity,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate growth rate (first vs last period)
    let growthRate = 0
    if (timeSeries.length >= 2) {
      const firstPeriod = timeSeries[0].items
      const lastPeriod = timeSeries[timeSeries.length - 1].items
      if (firstPeriod > 0) {
        growthRate = ((lastPeriod - firstPeriod) / firstPeriod) * 100
      }
    }

    // Identify peak period (highest item count)
    let peakPeriod = null
    if (timeSeries.length > 0) {
      const peak = timeSeries.reduce((max, current) =>
        current.items > max.items ? current : max
      )
      peakPeriod = {
        date: peak.date,
        items: peak.items,
      }
    }

    // Build response data
    const responseData = {
      timeSeries,
      growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
      peakPeriod,
    }

    // Cache the result
    trendsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    })

    return successResponse(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}
