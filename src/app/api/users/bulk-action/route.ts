import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { API_ERROR_CODES } from '@/utils/constants'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { createAuditLog } from '@/utils/audit'

/**
 * Validation schema for bulk actions
 */
const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'changeRole', 'delete']),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  data: z
    .object({
      role: z.nativeEnum(UserRole).optional(),
    })
    .optional(),
})

/**
 * POST /api/users/bulk-action
 * Perform bulk operations on multiple users (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.AUTH_REQUIRED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Check permissions - only Admin can manage users
    if (!session.user.permissions.includes('users:manage')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = bulkActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { action, userIds, data } = validation.data

    // Filter out current user from operations
    const validUserIds = userIds.filter((id) => id !== session.user.id)

    if (validUserIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot perform bulk operations on your own account',
          },
        },
        { status: 400 }
      )
    }

    // Verify all users exist
    const existingUsers = await prisma.user.findMany({
      where: {
        id: { in: validUserIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (existingUsers.length !== validUserIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'One or more users not found',
          },
        },
        { status: 404 }
      )
    }

    let result: any
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    switch (action) {
      case 'activate':
        // Activate users
        result = await prisma.user.updateMany({
          where: {
            id: { in: validUserIds },
          },
          data: {
            isActive: true,
          },
        })

        // Create audit logs
        for (const user of existingUsers) {
          await createAuditLog({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'User',
            entityId: user.id,
            changes: {
              before: { isActive: user.isActive },
              after: { isActive: true },
            },
            metadata: {
              ipAddress,
              userAgent,
              bulkAction: 'activate',
            },
          })
        }
        break

      case 'deactivate':
        // Deactivate users
        result = await prisma.user.updateMany({
          where: {
            id: { in: validUserIds },
          },
          data: {
            isActive: false,
          },
        })

        // Terminate all sessions for deactivated users
        await prisma.session.deleteMany({
          where: {
            userId: { in: validUserIds },
          },
        })

        // Create audit logs
        for (const user of existingUsers) {
          await createAuditLog({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'User',
            entityId: user.id,
            changes: {
              before: { isActive: user.isActive },
              after: { isActive: false },
            },
            metadata: {
              ipAddress,
              userAgent,
              bulkAction: 'deactivate',
            },
          })
        }
        break

      case 'changeRole':
        if (!data?.role) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: API_ERROR_CODES.VALIDATION_ERROR,
                message: 'Role is required for changeRole action',
              },
            },
            { status: 400 }
          )
        }

        // Change user roles
        result = await prisma.user.updateMany({
          where: {
            id: { in: validUserIds },
          },
          data: {
            role: data.role,
          },
        })

        // Create audit logs
        for (const user of existingUsers) {
          await createAuditLog({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'User',
            entityId: user.id,
            changes: {
              before: { role: user.role },
              after: { role: data.role },
            },
            metadata: {
              ipAddress,
              userAgent,
              bulkAction: 'changeRole',
            },
          })
        }
        break

      case 'delete':
        // Delete users
        result = await prisma.user.deleteMany({
          where: {
            id: { in: validUserIds },
          },
        })

        // Create audit logs
        for (const user of existingUsers) {
          await createAuditLog({
            userId: session.user.id,
            action: 'DELETE',
            entity: 'User',
            entityId: user.id,
            changes: {
              deleted: {
                name: user.name,
                email: user.email,
                role: user.role,
              },
            },
            metadata: {
              ipAddress,
              userAgent,
              bulkAction: 'delete',
            },
          })
        }
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount: result.count || validUserIds.length,
        userIds: validUserIds,
      },
      message: `Successfully ${action}d ${validUserIds.length} user(s)`,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to perform bulk action',
        },
      },
      { status: 500 }
    )
  }
}
