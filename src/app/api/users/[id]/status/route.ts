import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { API_ERROR_CODES } from '@/utils/constants'
import { z } from 'zod'
import { createAuditLog } from '@/utils/audit'

/**
 * Validation schema for status update
 */
const statusSchema = z.object({
  isActive: z.boolean(),
})

/**
 * PATCH /api/users/[id]/status
 * Update user active status (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    const { id } = params

    // Prevent user from deactivating themselves
    if (session.user.id === id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot change your own account status',
          },
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.NOT_FOUND,
            message: 'User not found',
          },
        },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = statusSchema.safeParse(body)

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

    const { isActive } = validation.data

    // Update user status
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // If deactivating, terminate all user sessions
    if (!isActive) {
      await prisma.session.deleteMany({
        where: { userId: id },
      })
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        before: { isActive: existingUser.isActive },
        after: { isActive: user.isActive },
      },
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        action: isActive ? 'activated' : 'deactivated',
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update user status',
        },
      },
      { status: 500 }
    )
  }
}
