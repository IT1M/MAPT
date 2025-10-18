import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { z } from 'zod'
import { createAuditLog } from '@/utils/audit'

// Validation schema for notification preferences
const notificationPreferencesSchema = z.object({
  email: z
    .object({
      dailyInventorySummary: z.boolean().optional(),
      weeklyAnalyticsReport: z.boolean().optional(),
      newUserRegistration: z.boolean().optional(),
      highRejectRateAlert: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
      backupStatus: z.boolean().optional(),
    })
    .optional(),
  inApp: z
    .object({
      enabled: z.boolean().optional(),
      sound: z.boolean().optional(),
      desktop: z.boolean().optional(),
    })
    .optional(),
  frequency: z.enum(['realtime', 'hourly', 'daily', 'custom']).optional(),
})

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: {
    dailyInventorySummary: true,
    weeklyAnalyticsReport: true,
    newUserRegistration: false,
    highRejectRateAlert: true,
    systemUpdates: true,
    backupStatus: false,
  },
  inApp: {
    enabled: true,
    sound: true,
    desktop: false,
  },
  frequency: 'realtime' as const,
}

/**
 * GET /api/users/notifications
 * Get current user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      )
    }

    // Extract notification preferences from user preferences
    const userPreferences = (user.preferences as any) || {}
    const notificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(userPreferences.notifications || {}),
    }

    // Merge nested objects properly
    if (userPreferences.notifications?.email) {
      notificationPreferences.email = {
        ...DEFAULT_NOTIFICATION_PREFERENCES.email,
        ...userPreferences.notifications.email,
      }
    }

    if (userPreferences.notifications?.inApp) {
      notificationPreferences.inApp = {
        ...DEFAULT_NOTIFICATION_PREFERENCES.inApp,
        ...userPreferences.notifications.inApp,
      }
    }

    return NextResponse.json({
      success: true,
      data: notificationPreferences,
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notification preferences',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/notifications
 * Update current user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = notificationPreferencesSchema.safeParse(body)
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
        preferences: true,
        role: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      )
    }

    const currentPreferences = (currentUser.preferences as any) || {}
    const currentNotifications = currentPreferences.notifications || {}

    // Build updated notification preferences
    const updatedNotifications = {
      ...currentNotifications,
      ...validation.data,
    }

    // Handle nested email object
    if (validation.data.email) {
      updatedNotifications.email = {
        ...currentNotifications.email,
        ...validation.data.email,
      }

      // Non-admin users cannot enable newUserRegistration
      if (currentUser.role !== 'ADMIN' && validation.data.email.newUserRegistration) {
        updatedNotifications.email.newUserRegistration = false
      }
    }

    // Handle nested inApp object
    if (validation.data.inApp) {
      updatedNotifications.inApp = {
        ...currentNotifications.inApp,
        ...validation.data.inApp,
      }
    }

    // Update user preferences with new notification settings
    const updatedPreferences = {
      ...currentPreferences,
      notifications: updatedNotifications,
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPreferences,
      },
      select: {
        preferences: true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'NotificationPreferences',
      entityId: session.user.id,
      changes: {
        oldValue: currentNotifications,
        newValue: updatedNotifications,
      },
      metadata: {
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    // Extract and return notification preferences
    const returnedPreferences = (updatedUser.preferences as any)?.notifications || {}

    return NextResponse.json({
      success: true,
      data: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...returnedPreferences,
        email: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.email,
          ...(returnedPreferences.email || {}),
        },
        inApp: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.inApp,
          ...(returnedPreferences.inApp || {}),
        },
      },
      message: 'Notification preferences updated successfully',
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences',
        },
      },
      { status: 500 }
    )
  }
}
