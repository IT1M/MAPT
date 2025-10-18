import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { sendEmail } from '@/utils/email'

/**
 * POST /api/users/notifications/test
 * Send a test notification to the current user
 */
export async function POST(request: NextRequest) {
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

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
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

    // Get notification preferences
    const preferences = (user.preferences as any) || {}
    const notificationPrefs = preferences.notifications || {}

    // Send test email if email notifications are enabled
    const emailEnabled = notificationPrefs.email?.dailyInventorySummary !== false
    if (emailEnabled) {
      await sendTestEmail(user.email, user.name)
    }

    // Note: In-app/desktop notifications are handled client-side via browser APIs
    // The client will show a toast notification when this endpoint returns success

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        emailSent: emailEnabled,
        inAppEnabled: notificationPrefs.inApp?.enabled !== false,
      },
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send test notification',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Send a test email notification
 */
async function sendTestEmail(email: string, name: string): Promise<void> {
  const subject = 'Test Notification - Inventory Management System'

  const text = `
Hello ${name},

This is a test notification from the Inventory Management System.

If you're receiving this email, your notification settings are working correctly!

You can manage your notification preferences in the Settings page.

Best regards,
Inventory Management Team
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 30px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .badge {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .icon {
      font-size: 48px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">✅</div>
    <h1 style="margin: 0;">Test Notification</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${name}</strong>,</p>
    
    <p>This is a test notification from the Inventory Management System.</p>
    
    <div class="badge">✓ Notifications Working</div>
    
    <p>If you're receiving this email, your notification settings are configured correctly!</p>
    
    <p>You can manage your notification preferences anytime in the Settings page under the Notifications section.</p>
    
    <p style="margin-top: 30px;">Best regards,<br>Inventory Management Team</p>
  </div>
  <div class="footer">
    <p>This is a test message. No action is required.</p>
  </div>
</body>
</html>
  `.trim()

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}
