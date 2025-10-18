import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  logExport,
  emailExport,
  shouldEmailExport,
} from '@/services/export'
import {
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response'
import { RateLimiter } from '@/middleware/rate-limiter'

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
 * POST /api/export
 * Universal export endpoint supporting CSV, Excel, PDF, and JSON formats
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
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
            message: 'Too many export requests. Please try again in 15 minutes.',
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
    const { 
      format, 
      entity, 
      filters, 
      ids, 
      columns,
      filename,
      includeFilters = true,
      emailDelivery = false,
    } = body

    // Validate format
    if (!format || !['csv', 'excel', 'json', 'pdf'].includes(format)) {
      return validationError('Invalid format. Must be csv, excel, json, or pdf')
    }

    // Validate entity
    if (!entity || !['inventory', 'audit', 'reports', 'users'].includes(entity)) {
      return validationError('Invalid entity. Must be inventory, audit, reports, or users')
    }

    // Check permissions based on entity
    const permissionMap: Record<string, string> = {
      inventory: 'inventory:read',
      audit: 'audit:read',
      reports: 'reports:read',
      users: 'users:read',
    }

    if (!session.user.permissions.includes(permissionMap[entity])) {
      return insufficientPermissionsError()
    }

    // Fetch data based on entity
    let data: any[] = []
    let entityName = ''

    switch (entity) {
      case 'inventory':
        data = await fetchInventoryData(session.user, filters, ids)
        entityName = 'InventoryItem'
        break
      case 'audit':
        data = await fetchAuditData(session.user, filters, ids)
        entityName = 'AuditLog'
        break
      case 'reports':
        data = await fetchReportsData(session.user, filters, ids)
        entityName = 'Report'
        break
      case 'users':
        data = await fetchUsersData(session.user, filters, ids)
        entityName = 'User'
        break
    }

    if (data.length === 0) {
      return validationError('No data to export')
    }

    // Prepare export options
    const exportOptions = {
      format: format as 'csv' | 'excel' | 'json' | 'pdf',
      data,
      columns,
      filename: filename || `${entity}-export`,
      includeFilters,
      metadata: {
        title: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Export`,
        generatedBy: session.user.name,
        dateRange: filters?.startDate && filters?.endDate 
          ? `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
          : undefined,
        filters: includeFilters ? filters : undefined,
      },
    }

    // Generate export file
    let fileBuffer: Buffer
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        fileBuffer = await exportToCSV(exportOptions)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        fileBuffer = await exportToExcel(exportOptions)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      case 'json':
        fileBuffer = await exportToJSON(exportOptions)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      case 'pdf':
        // PDF export is handled by specific endpoints (inventory/export/pdf, etc.)
        return validationError('PDF export should use entity-specific endpoints')
      default:
        return validationError('Unsupported format')
    }

    // Log export activity
    await logExport({
      userId: session.user.id,
      format,
      recordCount: data.length,
      fileSize: fileBuffer.length,
      filters,
      entity: entityName,
    })

    // Check if export should be emailed (for large exports)
    const shouldEmail = emailDelivery || shouldEmailExport(data.length)

    if (shouldEmail && session.user.email) {
      // Send email with export file
      const exportFilename = `${filename || entity}-export-${new Date().toISOString().split('T')[0]}.${fileExtension}`
      
      await emailExport({
        to: session.user.email,
        userName: session.user.name,
        filename: exportFilename,
        fileBuffer,
        format,
        recordCount: data.length,
      })

      return NextResponse.json({
        success: true,
        message: 'Export file will be sent to your email shortly',
        recordCount: data.length,
        fileSize: fileBuffer.length,
        emailSent: true,
      })
    }

    // Return file for download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const downloadFilename = `${filename || entity}-export-${timestamp}.${fileExtension}`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Fetch inventory data based on filters
 */
async function fetchInventoryData(
  user: any,
  filters: any,
  ids?: string[]
): Promise<any[]> {
  const where: any = { deletedAt: null }

  // If specific IDs provided
  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids }
  } else if (filters) {
    // Apply filters
    if (filters.search) {
      where.OR = [
        { itemName: { contains: filters.search, mode: 'insensitive' } },
        { batch: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    if (filters.destinations && filters.destinations.length > 0) {
      where.destination = { in: filters.destinations }
    }
    
    if (filters.categories && filters.categories.length > 0) {
      where.category = { in: filters.categories }
    }
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
    }
  }

  // Role-based filtering
  if (user.role === 'DATA_ENTRY') {
    where.enteredById = user.id
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      enteredBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return items.map(item => ({
    'Item Name': item.itemName,
    'Batch Number': item.batch,
    'Quantity': item.quantity,
    'Reject': item.reject,
    'Reject %': item.quantity > 0 ? ((item.reject / item.quantity) * 100).toFixed(2) : '0.00',
    'Destination': item.destination,
    'Category': item.category || '',
    'Notes': item.notes || '',
    'Entered By': item.enteredBy.name,
    'Date Added': new Date(item.createdAt).toLocaleString('en-US'),
  }))
}

/**
 * Fetch audit log data based on filters
 */
async function fetchAuditData(
  user: any,
  filters: any,
  ids?: string[]
): Promise<any[]> {
  const where: any = {}

  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids }
  } else if (filters) {
    if (filters.action) where.action = filters.action
    if (filters.entity) where.entity = filters.entity
    if (filters.userId) where.userId = filters.userId
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate)
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate)
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { timestamp: 'desc' },
  })

  return logs.map(log => ({
    'Action': log.action,
    'Entity': log.entity,
    'Entity ID': log.entityId || '',
    'User': log.user.name,
    'User Email': log.user.email,
    'Changes': JSON.stringify(log.changes),
    'Timestamp': new Date(log.timestamp).toLocaleString('en-US'),
  }))
}

/**
 * Fetch reports data based on filters
 */
async function fetchReportsData(
  user: any,
  filters: any,
  ids?: string[]
): Promise<any[]> {
  const where: any = {}

  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids }
  } else if (filters) {
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
    }
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      generatedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reports.map(report => ({
    'Title': report.title,
    'Type': report.type,
    'Status': report.status,
    'Generated By': report.generatedBy.name,
    'Created At': new Date(report.createdAt).toLocaleString('en-US'),
    'Completed At': report.completedAt ? new Date(report.completedAt).toLocaleString('en-US') : 'N/A',
  }))
}

/**
 * Fetch users data based on filters
 */
async function fetchUsersData(
  user: any,
  filters: any,
  ids?: string[]
): Promise<any[]> {
  // Only admins can export user data
  if (user.role !== 'ADMIN') {
    throw new Error('Insufficient permissions to export user data')
  }

  const where: any = {}

  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids }
  } else if (filters) {
    if (filters.role) where.role = filters.role
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return users.map(u => ({
    'Name': u.name,
    'Email': u.email,
    'Role': u.role,
    'Active': u.isActive ? 'Yes' : 'No',
    'Created At': new Date(u.createdAt).toLocaleString('en-US'),
    'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-US') : 'Never',
  }))
}
