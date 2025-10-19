import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { z } from 'zod'
import { sendEmail } from '@/services/email'

// POST /api/help/support - Submit support request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supportSchema = z.object({
      category: z.enum(['technical', 'account', 'feature', 'bug', 'other']),
      subject: z.string().min(5).max(200),
      description: z.string().min(20).max(2000),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      attachments: z.array(z.string()).optional()
    })

    const body = await request.json()
    const data = supportSchema.parse(body)

    // Send email to support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@mais.sa',
      subject: `[Support] ${data.category.toUpperCase()}: ${data.subject}`,
      template: 'support-request',
      data: {
        userName: session.user.name,
        userEmail: session.user.email,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'normal',
        attachments: data.attachments || []
      }
    })

    // Send confirmation email to user
    await sendEmail({
      to: session.user.email,
      subject: 'Support Request Received',
      template: 'support-confirmation',
      data: {
        userName: session.user.name,
        subject: data.subject,
        category: data.category,
        expectedResponseTime: getExpectedResponseTime(data.priority || 'normal')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
      expectedResponseTime: getExpectedResponseTime(data.priority || 'normal')
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting support request:', error)
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    )
  }
}

function getExpectedResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '2-4 hours'
    case 'high':
      return '4-8 hours'
    case 'normal':
      return '1-2 business days'
    case 'low':
      return '2-3 business days'
    default:
      return '1-2 business days'
  }
}
