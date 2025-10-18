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

    // Fetch total inventory items count (excluding soft-deleted)
    const totalItems = await prisma.inventoryItem.count({
      where: {
        deletedAt: null
      }
    })

    // Fetch items with high reject rate (reject > 10% of quantity)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        deletedAt: null
      }
    })

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

    // Calculate total quantity by destination
    const maisTotalQuantity = inventoryItems
      .filter(item => item.destination === 'MAIS')
      .reduce((sum, item) => sum + item.quantity, 0)
    
    const fozanTotalQuantity = inventoryItems
      .filter(item => item.destination === 'FOZAN')
      .reduce((sum, item) => sum + item.quantity, 0)

    // Return dashboard metrics
    return NextResponse.json({
      totalItems,
      highRejectItems: highRejectCount,
      maisTotalQuantity,
      fozanTotalQuantity,
      recentItems: formattedItems
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
