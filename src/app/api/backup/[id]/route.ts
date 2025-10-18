import { NextRequest } from 'next/server'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { BackupService } from '@/services/backup'

/**
 * DELETE /api/backup/[id]
 * 
 * Delete a backup file (ADMIN only)
 * 
 * Requirements: 18
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const backupId = params.id

    // Delete backup using BackupService
    await BackupService.deleteBackup(backupId, context.user.id)

    // Return success
    return successResponse(
      { id: backupId },
      'Backup deleted successfully'
    )
  } catch (error: any) {
    // Handle BackupError specifically
    if (error.name === 'BackupError') {
      return validationError(error.message, [{ code: error.code, recoverable: error.recoverable }])
    }
    return handleApiError(error)
  }
}
