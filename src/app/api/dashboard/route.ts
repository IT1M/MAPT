import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all inventory items (excluding soft-deleted)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        deletedAt: null
      },
      include: {
        enteredBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate counts by time period
    const todayCount = inventoryItems.filter(item => item.createdAt >= todayStart).length
    const weekCount = inventoryItems.filter(item => item.createdAt >= weekStart).length
    const monthCount = inventoryItems.filter(item => item.createdAt >= monthStart).length

    // Calculate total items
    const totalItems = inventoryItems.length

    // Calculate average reject rate
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRejects = inventoryItems.reduce((sum, item) => sum + item.reject, 0)
    const rejectRate = totalQuantity > 0 ? (totalRejects / totalQuantity) * 100 : 0

    // Count active users (users who added items in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeUserIds = new Set(
      inventoryItems
        .filter(item => item.createdAt >= thirtyDaysAgo)
        .map(item => item.enteredById)
    )
    const activeUsers = activeUserIds.size

    // Calculate destination percentages
    const maisItems = inventoryItems.filter(item => item.destination === 'MAIS')
    const fozanItems = inventoryItems.filter(item => item.destination === 'FOZAN')
    const maisPercentage = totalItems > 0 ? (maisItems.length / totalItems) * 100 : 0
    const fozanPercentage = totalItems > 0 ? (fozanItems.length / totalItems) * 100 : 0

    // Calculate trend data (last 7 days)
    const trendData: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const dayCount = inventoryItems.filter(
        item => item.createdAt >= dayStart && item.createdAt < dayEnd
      ).length
      trendData.push(dayCount)
    }

    // Format recent items (last 10)
    const recentItems = inventoryItems.slice(0, 10).map(item => ({
      id: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      destination: item.destination,
      enteredBy: item.enteredBy.name,
      createdAt: item.createdAt.toISOString()
    }))

    // Return dashboard metrics
    return NextResponse.json({
      todayCount,
      weekCount,
      monthCount,
      totalItems,
      rejectRate,
      activeUsers,
      maisPercentage,
      fozanPercentage,
      trendData,
      recentItems
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
