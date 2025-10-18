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
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * GET /api/inventory/export
 * Export inventory items in CSV, Excel, or JSON format
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') as 'csv' | 'excel' | 'json' | null
    const search = searchParams.get('search')
    const destination = searchParams.get('destination') as 'MAIS' | 'FOZAN' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate format
    if (!format || !['csv', 'excel', 'json'].includes(format)) {
      return validationError('Invalid format. Must be csv, excel, or json')
    }

    // Build where clause (same filters as GET /api/inventory)
    const where: any = {}
    
    // Exclude soft-deleted items
    where.deletedAt = null
    
    // Search in itemName and batch
    if (search) {
      where.OR = [
        {
          itemName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          batch: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }
    
    // Filter by destination
    if (destination) {
      where.destination = destination
    }
    
    // Date range filters
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Role-based filtering: DATA_ENTRY users only see their own items
    if (session.user.role === 'DATA_ENTRY') {
      where.enteredById = session.user.id
    }

    // Fetch all matching items without pagination
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format data for export
    const exportData = items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      batch: item.batch,
      quantity: item.quantity,
      reject: item.reject,
      destination: item.destination,
      category: item.category || '',
      notes: item.notes || '',
      enteredBy: item.enteredBy.name,
      enteredByEmail: item.enteredBy.email,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    // Create audit log with action=EXPORT
    const metadata = extractRequestMetadata(request)
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPORT',
      entity: 'InventoryItem',
      entityId: 'export',
      changes: {
        format,
        itemCount: items.length,
        filters: { search, destination, startDate, endDate },
      },
      metadata,
    })

    // Generate file based on format
    let fileContent: Buffer
    let contentType: string
    let fileName: string
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

    if (format === 'csv') {
      const csv = Papa.unparse(exportData)
      fileContent = Buffer.from(csv, 'utf-8')
      contentType = 'text/csv'
      fileName = `inventory-export-${timestamp}.csv`
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      fileContent = Buffer.from(excelBuffer)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `inventory-export-${timestamp}.xlsx`
    } else {
      // JSON format
      fileContent = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8')
      contentType = 'application/json'
      fileName = `inventory-export-${timestamp}.json`
    }

    // Set appropriate download headers and stream file response
    return new NextResponse(fileContent as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
