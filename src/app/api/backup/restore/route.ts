import { NextRequest } from 'next/server'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { BackupService, RestoreOptions } from '@/services/backup'
import { compare } from 'bcrypt'
import { prisma } from '@/services/prisma'

/**
 * POST /api/backup/restore
 * 
 * Restore data from a backup file (ADMIN only)
 * 
 * Request Body:
 * - backupId: string (required)
 * - mode: 'full' | 'merge' | 'preview' (required)
 * - password: string (required if backup is encrypted)
 * - adminPassword: string (required for security verification)
 * 
 * Requirements: 17
 */
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!body.backupId || typeof body.backupId !== 'string') {
      return validationError('Backup ID is required')
    }

    if (!body.mode || !['full', 'merge', 'preview'].includes(body.mode)) {
      return validationError('Invalid mode. Must be full, merge, or preview')
    }

    if (!body.adminPassword) {
      return validationError('Admin password is required for security verification')
    }

    // Verify admin password
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
    })

    if (!user) {
      return validationError('User not found')
    }

    const passwordValid = await compare(body.adminPassword, user.passwordHash)
    if (!passwordValid) {
      return validationError('Invalid admin password')
    }

    // Build restore options
    const options: RestoreOptions = {
      mode: body.mode,
      password: body.password,
      adminPassword: body.adminPassword,
    }

    // Perform restore using BackupService
    const summary = await BackupService.restoreBackup(
      body.backupId,
      options,
      context.user.id
    )

    // Return restore summary
    return successResponse(
      {
        mode: body.mode,
        itemsAdded: summary.itemsAdded,
        itemsUpdated: summary.itemsUpdated,
        itemsSkipped: summary.itemsSkipped,
        errors: summary.errors,
        duration: summary.duration,
      },
      body.mode === 'preview' 
        ? 'Preview completed successfully' 
        : 'Backup restored successfully'
    )
  } catch (error: any) {
    // Handle BackupError specifically
    if (error.name === 'BackupError') {
      return validationError(error.message, [{ code: error.code, recoverable: error.recoverable }])
    }
    return handleApiError(error)
  }
}
