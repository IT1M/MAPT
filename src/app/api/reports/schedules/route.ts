import { NextRequest } from 'next/server'
import { reportService, ReportConfig } from '@/services/report'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse,
  handleApiError,
  insufficientPermissionsError 
} from '@/utils/api-response'
import { z } from 'zod'
import { ReportType, ReportFormat, ScheduleFrequency } from '@prisma/client'

/**
 * GET /api/reports/schedules
 * 
 * List all scheduled reports
 * 
 * Requirements: 26
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (ADMIN, MANAGER can view schedules)
    const allowedRoles = ['ADMIN', 'MANAGER']
    if (!allowedRoles.includes(context.user.role)) {
      return insufficientPermissionsError('Permission to view report schedules required')
    }

    // Get all schedules
    const schedules = await prisma.reportSchedule.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse({
      schedules,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/reports/schedules
 * 
 * Create a new scheduled report (ADMIN only)
 * 
 * Body:
 * - name: string
 * - reportType: ReportType
 * - frequency: ScheduleFrequency
 * - time: string (HH:mm format)
 * - recipients: string[]
 * - enabled: boolean
 * - config: ReportConfig
 * 
 * Requirements: 26
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (ADMIN only)
    if (context.user.role !== 'ADMIN') {
      return insufficientPermissionsError('ADMIN role required to create scheduled reports')
    }

    // Parse request body
    const body = await request.json()

    const scheduleSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      reportType: z.nativeEnum(ReportType),
      frequency: z.nativeEnum(ScheduleFrequency),
      time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'),
      recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
      enabled: z.boolean().default(true),
      config: z.object({
        type: z.nativeEnum(ReportType),
        dateRange: z.object({
          from: z.string().datetime().transform(str => new Date(str)),
          to: z.string().datetime().transform(str => new Date(str)),
        }),
        content: z.object({
          summary: z.boolean().default(true),
          charts: z.boolean().default(true),
          detailedTable: z.boolean().default(true),
          rejectAnalysis: z.boolean().default(true),
          destinationBreakdown: z.boolean().default(true),
          categoryAnalysis: z.boolean().default(true),
          aiInsights: z.boolean().default(false),
          userActivity: z.boolean().default(false),
          auditTrail: z.boolean().default(false),
          comparative: z.boolean().default(false),
        }),
        format: z.nativeEnum(ReportFormat),
        customization: z.object({
          includeLogo: z.boolean().default(true),
          includeSignature: z.boolean().default(true),
          language: z.enum(['en', 'ar', 'bilingual']).default('en'),
          paperSize: z.enum(['a4', 'letter']).default('a4'),
          orientation: z.enum(['portrait', 'landscape']).default('portrait'),
        }),
      }),
    })

    const scheduleResult = scheduleSchema.safeParse(body)

    if (!scheduleResult.success) {
      return handleApiError(scheduleResult.error)
    }

    const scheduleData = scheduleResult.data

    // Calculate next run time
    const nextRun = calculateNextRun(scheduleData.frequency, scheduleData.time)

    // Create schedule in database
    const schedule = await prisma.reportSchedule.create({
      data: {
        name: scheduleData.name,
        reportType: scheduleData.reportType,
        frequency: scheduleData.frequency,
        time: scheduleData.time,
        recipients: scheduleData.recipients,
        enabled: scheduleData.enabled,
        config: scheduleData.config as any,
        nextRun,
        createdBy: context.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Schedule the report in the service
    if (schedule.enabled) {
      reportService.scheduleReport(schedule.id, schedule)
    }

    return successResponse(
      {
        schedule,
      },
      'Scheduled report created successfully',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

// Helper function to calculate next run time
function calculateNextRun(frequency: ScheduleFrequency, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date(now)

  next.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'DAILY':
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + ((1 + 7 - next.getDay()) % 7 || 7))
      if (next <= now) {
        next.setDate(next.getDate() + 7)
      }
      break
    case 'MONTHLY':
      next.setDate(1)
      next.setMonth(next.getMonth() + 1)
      break
    case 'YEARLY':
      next.setMonth(0, 1)
      next.setFullYear(next.getFullYear() + 1)
      break
  }

  return next
}
