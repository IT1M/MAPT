import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { API_ERROR_CODES } from '@/utils/constants'
import { hash } from 'bcrypt'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { createAuditLog } from '@/utils/audit'

/**
 * Validation schema for user update
 */
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.nativeEnum(UserRole).optional(),
})

/**
 * GET /api/users/[id]
 * Get a single user by ID (Admin only)
 */
export async function GET(
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

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
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

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch user',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]
 * Update a user (Admin only)
 */
export async function PUT(
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
    const validation = updateUserSchema.safeParse(body)

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

    const { name, email, password, role } = validation.data

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      })

      if (emailTaken) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: API_ERROR_CODES.CONFLICT,
              message: 'Email already in use',
            },
          },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (password) {
      updateData.passwordHash = await hash(password, 12)
    }

    // Store before state for audit
    const beforeState = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Store after state for audit
    const afterState = {
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        before: beforeState,
        after: afterState,
      },
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update user',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (Admin only)
 */
export async function DELETE(
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

    // Prevent user from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot delete your own account',
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

    // Store user data for audit before deletion
    const deletedUserData = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      changes: {
        deleted: deletedUserData,
      },
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to delete user',
        },
      },
      { status: 500 }
    )
  }
}
