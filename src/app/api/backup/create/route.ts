import { NextRequest } from 'next/server'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { BackupService, BackupCreateConfig } from '@/services/backup'

/**
 * POST /api/backup/create
 * 
 * Create a manual backup with comprehensive options
 * 
 * Request Body:
 * - name: string (backup name)
 * - includeAuditLogs: boolean (default: false)
 * - includeUserData: boolean (default: false)
 * - includeSettings: boolean (default: false)
 * - format: 'csv' | 'json' | 'sql' | 'all'
 * - dateRange: { from: Date, to: Date } (optional)
 * - notes: string (optional)
 * - encrypted: boolean (default: false)
 * - password: string (required if encrypted)
 * 
 * Requirements: 15
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check role (ADMIN only for manual backups)
    const roleCheck = checkRole('ADMIN', context)
    if ('error' in roleCheck) {
      return roleCheck.error
    }

    // Parse and validate request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return validationError('Backup name is required')
    }

    if (!body.format || !['csv', 'json', 'sql', 'all'].includes(body.format.toLowerCase())) {
      return validationError('Invalid format. Must be csv, json, sql, or all')
    }

    // Validate encryption
    if (body.encrypted && !body.password) {
      return validationError('Password is required for encrypted backups')
    }

    // Validate date range if provided
    if (body.dateRange) {
      if (!body.dateRange.from || !body.dateRange.to) {
        return validationError('Date range must include both from and to dates')
      }
    }

    // Build backup config
    const config: BackupCreateConfig = {
      name: body.name,
      includeAuditLogs: body.includeAuditLogs || false,
      includeUserData: body.includeUserData || false,
      includeSettings: body.includeSettings || false,
      format: body.format.toUpperCase(),
      dateRange: body.dateRange ? {
        from: new Date(body.dateRange.from),
        to: new Date(body.dateRange.to),
      } : undefined,
      notes: body.notes,
      encrypted: body.encrypted || false,
      password: body.password,
      userId: context.user.id,
      type: 'MANUAL',
    }

    // Create backup using BackupService
    const backup = await BackupService.createBackup(config)

    // Return backup record
    return successResponse(
      {
        id: backup.id,
        filename: backup.filename,
        type: backup.type,
        format: backup.format,
        fileSize: backup.fileSize.toString(),
        recordCount: backup.recordCount,
        status: backup.status,
        createdAt: backup.createdAt.toISOString(),
        includeAuditLogs: backup.includeAuditLogs,
        includeUserData: backup.includeUserData,
        includeSettings: backup.includeSettings,
        encrypted: backup.encrypted,
        notes: backup.notes,
      },
      'Backup created successfully',
      201
    )
  } catch (error: any) {
    // Handle BackupError specifically
    if (error.name === 'BackupError') {
      return validationError(error.message, [{ code: error.code, recoverable: error.recoverable }])
    }
    return handleApiError(error)
  }
}
