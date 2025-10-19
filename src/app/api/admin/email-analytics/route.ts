import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'

/**
 * GET /api/admin/email-analytics
 * Get email delivery statistics and analytics
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get email statistics
    const [
      totalEmails,
      sentEmails,
      failedEmails,
      pendingEmails,
      emailsByTemplate,
      recentFailures,
      deliveryRate,
    ] = await Promise.all([
      // Total emails
      prisma.emailLog.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Sent emails
      prisma.emailLog.count({
        where: {
          status: 'SENT',
          createdAt: { gte: startDate },
        },
      }),

      // Failed emails
      prisma.emailLog.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),

      // Pending emails
      prisma.emailLog.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: startDate },
        },
      }),

      // Emails by template
      prisma.emailLog.groupBy({
        by: ['template'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),

      // Recent failures
      prisma.emailLog.findMany({
        where: {
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
        orderBy: {
          failedAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          to: true,
          subject: true,
          template: true,
          errorMessage: true,
          failedAt: true,
          attempts: true,
        },
      }),

      // Calculate delivery rate over time (daily)
      prisma.$queryRaw<
        Array<{ date: Date; sent: bigint; failed: bigint; total: bigint }>
      >`
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
          COUNT(*) as total
        FROM email_logs
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ])

    // Calculate success rate
    const successRate =
      totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(2) : '0'

    // Calculate average delivery time
    const avgDeliveryTime = await prisma.$queryRaw<
      Array<{ avg_seconds: number }>
    >`
      SELECT AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_seconds
      FROM email_logs
      WHERE status = 'SENT' 
        AND sent_at IS NOT NULL
        AND created_at >= ${startDate}
    `

    const avgDeliverySeconds = avgDeliveryTime[0]?.avg_seconds || 0

    // Format delivery rate data
    const deliveryRateFormatted = deliveryRate.map((day) => ({
      date: day.date,
      sent: Number(day.sent),
      failed: Number(day.failed),
      total: Number(day.total),
      successRate:
        Number(day.total) > 0
          ? ((Number(day.sent) / Number(day.total)) * 100).toFixed(2)
          : '0',
    }))

    // Format template statistics
    const templateStats = emailsByTemplate.map((item) => ({
      template: item.template,
      count: item._count.id,
    }))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalEmails,
          sent: sentEmails,
          failed: failedEmails,
          pending: pendingEmails,
          successRate: parseFloat(successRate),
          avgDeliveryTime: Math.round(avgDeliverySeconds),
        },
        templateStats,
        deliveryRate: deliveryRateFormatted,
        recentFailures,
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
      },
    })
  } catch (error) {
    console.error('[Email Analytics] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/email-analytics/retry
 * Retry failed emails
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { emailIds } = body

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs are required' }, { status: 400 })
    }

    // Reset failed emails to pending for retry
    const result = await prisma.emailLog.updateMany({
      where: {
        id: { in: emailIds },
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        errorMessage: null,
        failedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `${result.count} emails queued for retry`,
        count: result.count,
      },
    })
  } catch (error) {
    console.error('[Email Analytics] Retry error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retry emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
