import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import {
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response'
import { RateLimiter } from '@/middleware/rate-limiter'
import * as XLSX from 'xlsx'

// Rate limiter for export operations: 10 exports per 15 minutes
const exportRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req: NextRequest) => {
    const sessionId = req.cookies.get('next-auth.session-token')?.value
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return sessionId || ip
  }
})

/**
 * POST /api/inventory/export/excel
 * Export inventory data as Excel file with formatting
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:read')) {
      return insufficientPermissionsError()
    }

    // Check rate limit
    const key = exportRateLimiter['config'].keyGenerator(request)
    const allowed = exportRateLimiter.check(key)
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many export requests. Please try again later.',
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900', // 15 minutes
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { filters, ids } = body

    // Build where clause
    const where: any = {}
    
    // Exclude soft-deleted items
    where.deletedAt = null

    // If specific IDs provided (for selected items export)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids }
    } else if (filters) {
      // Apply filters
      if (filters.search) {
        where.OR = [
          {
            itemName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            batch: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ]
      }
      
      if (filters.destinations && filters.destinations.length > 0) {
        where.destination = { in: filters.destinations }
      }
      
      if (filters.categories && filters.categories.length > 0) {
        where.category = { in: filters.categories }
      }
      
      // Date range filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate)
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate)
        }
      }

      // Reject filter
      if (filters.rejectFilter) {
        if (filters.rejectFilter === 'none') {
          where.reject = 0
        } else if (filters.rejectFilter === 'has') {
          where.reject = { gt: 0 }
        } else if (filters.rejectFilter === 'high') {
          // High rejects (>10%) - we'll filter this after fetching
        }
      }

      // Entered by filter (ADMIN/SUPERVISOR only)
      if (filters.enteredByIds && filters.enteredByIds.length > 0) {
        where.enteredById = { in: filters.enteredByIds }
      }
    }

    // Role-based filtering: DATA_ENTRY users only see their own items
    if (session.user.role === 'DATA_ENTRY') {
      where.enteredById = session.user.id
    }

    // Fetch all matching items
    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: filters?.sortBy ? {
        [filters.sortBy]: filters.sortOrder || 'desc'
      } : {
        createdAt: 'desc',
      },
    })

    // Apply high reject filter if needed (>10%)
    let filteredItems = items
    if (filters?.rejectFilter === 'high') {
      filteredItems = items.filter(item => {
        const rejectPercentage = item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0
        return rejectPercentage > 10
      })
    }

    // Format data for Excel
    const exportData = filteredItems.map((item) => {
      const rejectPercentage = item.quantity > 0 ? ((item.reject / item.quantity) * 100).toFixed(2) : '0.00'
      
      return {
        'Item Name': item.itemName,
        'Batch Number': item.batch,
        'Quantity': item.quantity,
        'Reject': item.reject,
        'Reject %': rejectPercentage,
        'Destination': item.destination,
        'Category': item.category || '',
        'Notes': item.notes || '',
        'Entered By': item.enteredBy.name,
        'Date Added': new Date(item.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })

    // Calculate totals
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRejects = filteredItems.reduce((sum, item) => sum + item.reject, 0)
    const averageRejectRate = totalQuantity > 0 ? ((totalRejects / totalQuantity) * 100).toFixed(2) : '0.00'

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create main data sheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Add summary row at the top
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['Inventory Export Report'],
      [`Generated: ${new Date().toLocaleString('en-US')}`],
      [`Total Records: ${filteredItems.length}`],
      [`Total Quantity: ${totalQuantity}`],
      [`Total Rejects: ${totalRejects}`],
      [`Average Reject Rate: ${averageRejectRate}%`],
      [], // Empty row
    ], { origin: 'A1' })

    // Adjust data starting row
    const dataStartRow = 8
    XLSX.utils.sheet_add_json(worksheet, exportData, { origin: `A${dataStartRow}`, skipHeader: false })

    // Auto-size columns
    const columnWidths = [
      { wch: 25 }, // Item Name
      { wch: 15 }, // Batch Number
      { wch: 10 }, // Quantity
      { wch: 10 }, // Reject
      { wch: 10 }, // Reject %
      { wch: 12 }, // Destination
      { wch: 15 }, // Category
      { wch: 30 }, // Notes
      { wch: 20 }, // Entered By
      { wch: 20 }, // Date Added
    ]
    worksheet['!cols'] = columnWidths

    // Add formulas for totals at the bottom
    const lastRow = dataStartRow + exportData.length
    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ['TOTALS', '', totalQuantity, totalRejects, averageRejectRate + '%'],
    ], { origin: `A${lastRow + 1}` })

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Data')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const fileContent = Buffer.from(excelBuffer)

    // Create audit log
    const metadata = extractRequestMetadata(request)
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPORT',
      entity: 'InventoryItem',
      entityId: 'excel-export',
      changes: {
        format: 'excel',
        itemCount: filteredItems.length,
        filters: filters || {},
        selectedIds: ids || [],
      },
      metadata,
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const fileName = `inventory-export-${timestamp}.xlsx`

    // Return file
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
