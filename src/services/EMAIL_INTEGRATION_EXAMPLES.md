# Email Service Integration Examples

This document provides practical examples of integrating the email service into various parts of the application.

## 1. User Registration Flow

When a new user registers, send a welcome email:

```typescript
// src/app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/services/email'

export async function POST(request: NextRequest) {
  // ... user registration logic ...
  
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'DATA_ENTRY',
    },
  })
  
  // Send welcome email (non-blocking)
  sendWelcomeEmail(newUser.email, {
    userName: newUser.name,
    email: newUser.email,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  }).catch(error => {
    console.error('Failed to send welcome email:', error)
    // Don't fail registration if email fails
  })
  
  return apiResponse.success({ user: newUser })
}
```

## 2. Password Reset Flow

### Request Password Reset

```typescript
// src/app/api/auth/forgot-password/route.ts
import { sendPasswordResetEmail } from '@/services/email'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Don't reveal if user exists
    return apiResponse.success({ message: 'If email exists, reset link sent' })
  }
  
  // Generate reset token
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
      used: false,
    },
  })
  
  // Send reset email
  await sendPasswordResetEmail(user.email, {
    userName: user.name,
    resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`,
    expiresAt,
  })
  
  return apiResponse.success({ message: 'Password reset email sent' })
}
```

## 3. Security Alert on New Device Login

```typescript
// src/app/api/auth/[...nextauth]/route.ts or middleware
import { sendSecurityAlertEmail } from '@/services/email'

async function handleLogin(user: User, request: NextRequest) {
  // Detect device info
  const userAgent = request.headers.get('user-agent') || ''
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
  
  // Parse user agent
  const deviceInfo = parseUserAgent(userAgent)
  
  // Check if this is a new device
  const recentSessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  
  const isNewDevice = !recentSessions.some(
    s => s.deviceType === deviceInfo.deviceType && s.browser === deviceInfo.browser
  )
  
  if (isNewDevice) {
    // Send security alert (non-blocking)
    sendSecurityAlertEmail(user.email, {
      userName: user.name,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress,
      location: await getLocationFromIP(ipAddress),
      timestamp: new Date(),
    }).catch(error => {
      console.error('Failed to send security alert:', error)
    })
  }
}
```

## 4. Daily Summary Email (Cron Job)

```typescript
// src/services/cron.ts or separate cron job
import { sendDailySummaryEmail } from '@/services/email'

export async function sendDailySummaries() {
  // Get all users who want daily summaries
  const users = await prisma.user.findMany({
    where: {
      // Add a preference field for this
      emailPreferences: {
        path: ['dailySummary'],
        equals: true,
      },
    },
  })
  
  for (const user of users) {
    // Calculate yesterday's stats
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const endOfYesterday = new Date(yesterday)
    endOfYesterday.setHours(23, 59, 59, 999)
    
    const [itemsAdded, itemsUpdated, totalValue, rejectRate, topItems] = await Promise.all([
      prisma.inventoryItem.count({
        where: {
          createdAt: { gte: yesterday, lte: endOfYesterday },
          createdBy: user.id,
        },
      }),
      prisma.inventoryItem.count({
        where: {
          updatedAt: { gte: yesterday, lte: endOfYesterday },
          createdBy: user.id,
        },
      }),
      prisma.inventoryItem.aggregate({
        where: {
          createdAt: { gte: yesterday, lte: endOfYesterday },
          createdBy: user.id,
        },
        _sum: { quantity: true },
      }),
      // Calculate reject rate
      calculateRejectRate(user.id, yesterday, endOfYesterday),
      // Get top items
      getTopItems(user.id, yesterday, endOfYesterday),
    ])
    
    await sendDailySummaryEmail(user.email, {
      userName: user.name,
      date: yesterday,
      stats: {
        itemsAdded,
        itemsUpdated,
        totalValue: totalValue._sum.quantity || 0,
        rejectRate,
      },
      topItems,
      alerts: [], // Add any relevant alerts
    })
  }
}
```

## 5. High Reject Rate Alert

```typescript
// src/services/monitoring.ts or cron job
import { sendHighRejectRateAlert } from '@/services/email'

export async function checkRejectRates() {
  const THRESHOLD = 15 // 15%
  const dateRange = {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    to: new Date(),
  }
  
  // Calculate reject rate
  const stats = await prisma.inventoryItem.aggregate({
    where: {
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
    _sum: {
      quantity: true,
      rejectQuantity: true,
    },
  })
  
  const totalQuantity = stats._sum.quantity || 0
  const totalRejects = stats._sum.rejectQuantity || 0
  const rejectRate = totalQuantity > 0 ? (totalRejects / totalQuantity) * 100 : 0
  
  if (rejectRate > THRESHOLD) {
    // Get affected items
    const affectedItems = await prisma.inventoryItem.findMany({
      where: {
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        rejectQuantity: { gt: 0 },
      },
      select: {
        itemName: true,
        batch: true,
        rejectQuantity: true,
      },
      orderBy: {
        rejectQuantity: 'desc',
      },
      take: 10,
    })
    
    // Get admin and manager emails
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
      },
      select: { email: true },
    })
    
    await sendHighRejectRateAlert(
      recipients.map(r => r.email),
      {
        rejectRate,
        threshold: THRESHOLD,
        affectedItems: affectedItems.map(item => ({
          name: item.itemName,
          batch: item.batch,
          rejectCount: item.rejectQuantity,
        })),
        dateRange,
      }
    )
  }
}
```

## 6. Backup Status Notification

```typescript
// src/services/backup.ts
import { sendBackupStatusEmail } from '@/services/email'

export async function performBackup() {
  const backupName = `backup_${new Date().toISOString().split('T')[0]}.sql`
  const startTime = Date.now()
  
  try {
    // Perform backup
    const backupPath = await createDatabaseBackup(backupName)
    const fileSize = await getFileSize(backupPath)
    
    // Get admin email
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true },
    })
    
    if (admin) {
      await sendBackupStatusEmail(admin.email, {
        status: 'success',
        backupName,
        timestamp: new Date(),
        size: formatFileSize(fileSize),
      })
    }
    
    return { success: true, backupName }
  } catch (error) {
    // Send failure notification
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true },
    })
    
    if (admin) {
      await sendBackupStatusEmail(admin.email, {
        status: 'failed',
        backupName,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    
    throw error
  }
}
```

## 7. Report Ready Notification

```typescript
// src/app/api/reports/generate/route.ts
import { sendReportReadyEmail } from '@/services/email'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return apiResponse.unauthorized()
  }
  
  const { reportType, filters } = await request.json()
  
  // Generate report
  const report = await generateReport(reportType, filters)
  
  // Save report
  const savedReport = await prisma.report.create({
    data: {
      title: report.title,
      type: reportType,
      filePath: report.path,
      generatedBy: session.user.id,
      status: 'COMPLETED',
    },
  })
  
  // Send notification
  await sendReportReadyEmail(session.user.email!, {
    userName: session.user.name!,
    reportTitle: report.title,
    reportType,
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports/download/${savedReport.id}`,
    generatedAt: new Date(),
  })
  
  return apiResponse.success({ report: savedReport })
}
```

## 8. Scheduled Email Sending

For emails that need to be sent at specific times:

```typescript
// src/services/email-scheduler.ts
import { sendEmail } from '@/services/email'

interface ScheduledEmail {
  to: string
  template: string
  data: Record<string, any>
  scheduledFor: Date
}

export async function scheduleEmail(email: ScheduledEmail) {
  // Store in database
  await prisma.scheduledEmail.create({
    data: {
      to: email.to,
      template: email.template,
      data: email.data,
      scheduledFor: email.scheduledFor,
      status: 'PENDING',
    },
  })
}

// Cron job to process scheduled emails
export async function processScheduledEmails() {
  const now = new Date()
  
  const pendingEmails = await prisma.scheduledEmail.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
  })
  
  for (const email of pendingEmails) {
    try {
      await sendEmail({
        to: email.to,
        template: email.template,
        data: email.data,
        subject: '', // Will be set by template
      })
      
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
      })
    } catch (error) {
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { 
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
  }
}
```

## 9. Batch Email Sending

For sending emails to multiple recipients:

```typescript
// src/services/email-batch.ts
import { sendEmail } from '@/services/email'

export async function sendBatchEmails(
  recipients: string[],
  template: string,
  data: Record<string, any>
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }
  
  // Send in batches to avoid rate limits
  const BATCH_SIZE = 10
  const DELAY_MS = 1000 // 1 second between batches
  
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    
    await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await sendEmail({
            to: email,
            template,
            data,
            subject: '', // Will be set by template
          })
          results.sent++
        } catch (error) {
          results.failed++
          results.errors.push(`${email}: ${error}`)
        }
      })
    )
    
    // Delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }
  
  return results
}
```

## 10. Error Handling Best Practices

```typescript
// Always wrap email sending in try-catch
async function safeEmailSend() {
  try {
    await sendWelcomeEmail('user@example.com', {
      userName: 'John Doe',
      email: 'user@example.com',
      loginUrl: 'https://app.com/login',
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Email send failed:', error)
    
    // Optionally, track failed emails for retry
    await trackFailedEmail({
      type: 'welcome',
      recipient: 'user@example.com',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// For critical emails, you might want to throw
async function criticalEmailSend() {
  try {
    await sendPasswordResetEmail('user@example.com', {
      userName: 'John Doe',
      resetUrl: 'https://app.com/reset',
      expiresAt: new Date(),
    })
  } catch (error) {
    // Log and re-throw for critical emails
    console.error('Critical email failed:', error)
    throw new Error('Failed to send password reset email')
  }
}
```

## Notes

- Always send emails asynchronously to avoid blocking user operations
- Use `.catch()` for non-critical emails to prevent failures from affecting the main flow
- Monitor email delivery rates through the analytics dashboard
- Test email templates before deploying to production
- Respect user email preferences (implement unsubscribe functionality)
- Be mindful of email provider rate limits
