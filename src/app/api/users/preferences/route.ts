import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/utils/audit';

// Validation schema for user preferences
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  uiDensity: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  fontSize: z.number().min(12).max(20).optional(),
  colorScheme: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    })
    .optional(),
  notifications: z
    .object({
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
    .optional(),
  sidebarCollapsed: z.boolean().optional(),
  sidebarPosition: z.enum(['left', 'right']).optional(),
  showBreadcrumbs: z.boolean().optional(),
});

const DEFAULT_PREFERENCES = {
  theme: 'system',
  uiDensity: 'comfortable',
  fontSize: 16,
  notifications: {
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
    frequency: 'realtime',
  },
  sidebarCollapsed: false,
  sidebarPosition: 'left',
  showBreadcrumbs: true,
};

/**
 * GET /api/users/preferences
 * Get current user's preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    // Merge with defaults to ensure all fields are present
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...((user.preferences as any) || {}),
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch preferences',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/preferences
 * Update current user's preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = preferencesSchema.safeParse(body);
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
      );
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    const currentPreferences = (currentUser.preferences as any) || {};

    // Deep merge preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...validation.data,
    };

    // Handle nested notifications object
    if (validation.data.notifications) {
      updatedPreferences.notifications = {
        ...currentPreferences.notifications,
        ...validation.data.notifications,
      };

      if (validation.data.notifications.email) {
        updatedPreferences.notifications.email = {
          ...currentPreferences.notifications?.email,
          ...validation.data.notifications.email,
        };
      }

      if (validation.data.notifications.inApp) {
        updatedPreferences.notifications.inApp = {
          ...currentPreferences.notifications?.inApp,
          ...validation.data.notifications.inApp,
        };
      }
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPreferences,
      },
      select: {
        preferences: true,
      },
    });

    // Create audit log for significant preference changes
    const significantChanges = ['theme', 'colorScheme'];
    const hasSignificantChange = Object.keys(validation.data).some((key) =>
      significantChanges.includes(key)
    );

    if (hasSignificantChange) {
      await createAuditLog({
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'UserPreferences',
        entityId: session.user.id,
        changes: {
          oldValue: currentPreferences,
          newValue: updatedPreferences,
        },
        metadata: {
          ipAddress:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedUser.preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update preferences',
        },
      },
      { status: 500 }
    );
  }
}
