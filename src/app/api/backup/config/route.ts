import { NextRequest } from 'next/server'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { prisma } from '@/services/prisma'
import { AuditService } from '@/services/audit'

/**
 * GET /api/backup/config
 * 
 * Get backup configuration
 * 
 * Requirements: 12
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check role (ADMIN or MANAGER)
    const isAdmin = context.user.role === 'ADMIN'
    const isManager = context.user.role === 'MANAGER'
    
    if (!isAdmin && !isManager) {
      const roleCheck = checkRole('MANAGER', context)
      if ('error' in roleCheck) {
        return roleCheck.error
      }
    }

    // Get backup config
    let config: any = await (prisma as any).backupConfig.findFirst()

    // Create default config if none exists
    if (!config && isAdmin) {
      config = await (prisma as any).backupConfig.create({
        data: {
          enabled: false,
          scheduleTime: '02:00',
          formats: ['JSON'],
          includeAuditLogs: true,
          retentionDailyDays: 30,
          retentionWeeklyWeeks: 12,
          retentionMonthlyMonths: 12,
          storagePath: process.env.BACKUP_STORAGE_PATH || './backups',
          updatedBy: context.user.id,
        },
      })
    }

    if (!config) {
      return validationError('Backup configuration not found')
    }

    // Return config
    return successResponse({
      id: config.id,
      enabled: config.enabled,
      scheduleTime: config.scheduleTime,
      formats: config.formats,
      includeAuditLogs: config.includeAuditLogs,
      retentionDailyDays: config.retentionDailyDays,
      retentionWeeklyWeeks: config.retentionWeeklyWeeks,
      retentionMonthlyMonths: config.retentionMonthlyMonths,
      storagePath: config.storagePath,
      updatedAt: config.updatedAt.toISOString(),
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/backup/config
 * 
 * Update backup configuration (ADMIN only)
 * 
 * Request Body:
 * - enabled: boolean
 * - scheduleTime: string (HH:mm format)
 * - formats: BackupFormat[]
 * - includeAuditLogs: boolean
 * - retentionDailyDays: number
 * - retentionWeeklyWeeks: number
 * - retentionMonthlyMonths: number
 * 
 * Requirements: 12
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check role (ADMIN only)
    const roleCheck = checkRole('ADMIN', context)
    if ('error' in roleCheck) {
      return roleCheck.error
    }

    // Parse and validate request body
    const body = await request.json()

    // Validate schedule time format (HH:mm)
    if (body.scheduleTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(body.scheduleTime)) {
      return validationError('Invalid schedule time format. Must be HH:mm (e.g., 02:00)')
    }

    // Validate formats
    if (body.formats) {
      const validFormats = ['CSV', 'JSON', 'SQL']
      if (!Array.isArray(body.formats) || !body.formats.every((f: string) => validFormats.includes(f))) {
        return validationError('Invalid formats. Must be an array of CSV, JSON, or SQL')
      }
    }

    // Validate retention values
    if (body.retentionDailyDays !== undefined && (body.retentionDailyDays < 1 || body.retentionDailyDays > 365)) {
      return validationError('Daily retention must be between 1 and 365 days')
    }

    if (body.retentionWeeklyWeeks !== undefined && (body.retentionWeeklyWeeks < 1 || body.retentionWeeklyWeeks > 52)) {
      return validationError('Weekly retention must be between 1 and 52 weeks')
    }

    if (body.retentionMonthlyMonths !== undefined && (body.retentionMonthlyMonths < 1 || body.retentionMonthlyMonths > 60)) {
      return validationError('Monthly retention must be between 1 and 60 months')
    }

    // Get existing config
    let config: any = await (prisma as any).backupConfig.findFirst()

    // Store old values for audit
    const oldValues = config ? {
      enabled: config.enabled,
      scheduleTime: config.scheduleTime,
      formats: config.formats,
      includeAuditLogs: config.includeAuditLogs,
      retentionDailyDays: config.retentionDailyDays,
      retentionWeeklyWeeks: config.retentionWeeklyWeeks,
      retentionMonthlyMonths: config.retentionMonthlyMonths,
    } : null

    // Update or create config
    const updateData: any = {
      updatedBy: context.user.id,
    }

    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.scheduleTime !== undefined) updateData.scheduleTime = body.scheduleTime
    if (body.formats !== undefined) updateData.formats = body.formats
    if (body.includeAuditLogs !== undefined) updateData.includeAuditLogs = body.includeAuditLogs
    if (body.retentionDailyDays !== undefined) updateData.retentionDailyDays = body.retentionDailyDays
    if (body.retentionWeeklyWeeks !== undefined) updateData.retentionWeeklyWeeks = body.retentionWeeklyWeeks
    if (body.retentionMonthlyMonths !== undefined) updateData.retentionMonthlyMonths = body.retentionMonthlyMonths

    if (config) {
      config = await (prisma as any).backupConfig.update({
        where: { id: config.id },
        data: updateData,
      })
    } else {
      config = await (prisma as any).backupConfig.create({
        data: {
          ...updateData,
          storagePath: process.env.BACKUP_STORAGE_PATH || './backups',
        },
      })
    }

    // Log configuration change to audit trail
    await AuditService.logAction({
      userId: context.user.id,
      action: 'UPDATE',
      entityType: 'Settings',
      entityId: config.id,
      changes: {
        old: oldValues,
        new: {
          enabled: config.enabled,
          scheduleTime: config.scheduleTime,
          formats: config.formats,
          includeAuditLogs: config.includeAuditLogs,
          retentionDailyDays: config.retentionDailyDays,
          retentionWeeklyWeeks: config.retentionWeeklyWeeks,
          retentionMonthlyMonths: config.retentionMonthlyMonths,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Return updated config
    return successResponse(
      {
        id: config.id,
        enabled: config.enabled,
        scheduleTime: config.scheduleTime,
        formats: config.formats,
        includeAuditLogs: config.includeAuditLogs,
        retentionDailyDays: config.retentionDailyDays,
        retentionWeeklyWeeks: config.retentionWeeklyWeeks,
        retentionMonthlyMonths: config.retentionMonthlyMonths,
        storagePath: config.storagePath,
        updatedAt: config.updatedAt.toISOString(),
      },
      'Backup configuration updated successfully'
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}
