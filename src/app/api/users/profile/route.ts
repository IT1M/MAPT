import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { profileSchema } from '@/utils/settings-validation'
import { createAuditLog } from '@/utils/audit'

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Parse preferences to extract profile fields
    const preferences = (user.preferences as any) || {}
    
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: preferences.avatar,
      employeeId: preferences.employeeId,
      department: preferences.department,
      phoneNumber: preferences.phoneNumber,
      workLocation: preferences.workLocation,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch profile',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = profileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
        },
        { status: 400 }
      )
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const currentPreferences = (currentUser.preferences as any) || {}

    // Update user with new profile data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validation.data.name,
        preferences: {
          ...currentPreferences,
          employeeId: validation.data.employeeId,
          department: validation.data.department,
          phoneNumber: validation.data.phoneNumber,
          workLocation: validation.data.workLocation,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: session.user.id,
      changes: {
        oldValue: {
          name: currentUser.name,
          employeeId: currentPreferences.employeeId,
          department: currentPreferences.department,
          phoneNumber: currentPreferences.phoneNumber,
          workLocation: currentPreferences.workLocation,
        },
        newValue: {
          name: validation.data.name,
          employeeId: validation.data.employeeId,
          department: validation.data.department,
          phoneNumber: validation.data.phoneNumber,
          workLocation: validation.data.workLocation,
        },
      },
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    const updatedPreferences = (updatedUser.preferences as any) || {}

    const profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedPreferences.avatar,
      employeeId: updatedPreferences.employeeId,
      department: updatedPreferences.department,
      phoneNumber: updatedPreferences.phoneNumber,
      workLocation: updatedPreferences.workLocation,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        },
      },
      { status: 500 }
    )
  }
}
