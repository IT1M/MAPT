import { NextRequest } from 'next/server'
import { reportService } from '@/services/report'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse,
  handleApiError,
  insufficientPermissionsError,
  notFoundError 
} from '@/utils/api-response'
import { z } from 'zod'
import { ReportType, ReportFormat, ScheduleFrequency } from '@prisma/client'

/**
 * PUT /api/reports/schedules/:id
 * 
 * Update a scheduled report (ADMIN only)
 * 
 * Requirements: 26
 */
export async function PUT(
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

    // Check permissions (ADMIN only)
    if (context.user.role !== 'ADMIN') {
      return insufficientPermissionsError('ADMIN role required to update scheduled reports')
    }

    const scheduleId = params.id

    // Check if schedule exists
    const existingSchedule = await prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!existingSchedule) {
      return notFoundError('Scheduled report not found')
    }

    // Parse request body
    const body = await request.json()

    const updateSchema = z.object({
      name: z.string().min(1, 'Name is required').optional(),
      reportType: z.nativeEnum(ReportType).optional(),
      frequency: z.nativeEnum(ScheduleFrequency).optional(),
      time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format').optional(),
      recipients: z.array(z.string().email()).min(1, 'At least one recipient required').optional(),
      enabled: z.boolean().optional(),
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
      }).optional(),
    })

    const updateResult = updateSchema.safeParse(body)

    if (!updateResult.success) {
      return handleApiError(updateResult.error)
    }

    const updateData = updateResult.data

    // Calculate new next run time if frequency or time changed
    let nextRun = existingSchedule.nextRun
    if (updateData.frequency || updateData.time) {
      const frequency = updateData.frequency || existingSchedule.frequency
      const time = updateData.time || existingSchedule.time
      nextRun = calculateNextRun(frequency, time)
    }

    // Update schedule in database
    const schedule = await prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        ...updateData,
        config: updateData.config as any,
        nextRun,
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

    // Update schedule in the service
    reportService.unscheduleReport(scheduleId)
    if (schedule.enabled) {
      reportService.scheduleReport(schedule.id, schedule)
    }

    return successResponse(
      {
        schedule,
      },
      'Scheduled report updated successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/reports/schedules/:id
 * 
 * Delete a scheduled report (ADMIN only)
 * 
 * Requirements: 26
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

    // Check permissions (ADMIN only)
    if (context.user.role !== 'ADMIN') {
      return insufficientPermissionsError('ADMIN role required to delete scheduled reports')
    }

    const scheduleId = params.id

    // Check if schedule exists
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule) {
      return notFoundError('Scheduled report not found')
    }

    // Unschedule from service
    reportService.unscheduleReport(scheduleId)

    // Delete from database
    await prisma.reportSchedule.delete({
      where: { id: scheduleId },
    })

    return successResponse(
      {
        scheduleId,
        message: 'Scheduled report deleted successfully',
      },
      'Scheduled report deleted successfully'
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
