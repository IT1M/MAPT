import { prisma } from './prisma'

/**
 * Email service for sending notifications
 * This is a placeholder implementation that logs emails and stores them in the database
 * In production, integrate with services like Resend, SendGrid, or Nodemailer
 */

export interface EmailOptions {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface SecurityAlertEmailData {
  userName: string
  deviceType: string
  browser: string
  os: string
  ipAddress: string
  location: string
  timestamp: Date
}

/**
 * Send a security alert email for new device login
 */
export async function sendSecurityAlertEmail(
  email: string,
  data: SecurityAlertEmailData
): Promise<void> {
  const subject = '🔐 New Device Login Detected'
  const template = 'security-alert'

  // Create email log entry
  await logEmail({
    to: email,
    subject,
    template,
    data,
  })

  // In production, send actual email here
  console.log('[Email] Security alert email would be sent to:', email)
  console.log('[Email] Device:', data.deviceType, '-', data.browser, 'on', data.os)
  console.log('[Email] Location:', data.location, '(', data.ipAddress, ')')
  console.log('[Email] Time:', data.timestamp.toISOString())
}

/**
 * Send account locked notification email
 */
export async function sendAccountLockedEmail(
  email: string,
  data: {
    userName: string
    lockoutEndsAt: Date
  }
): Promise<void> {
  const subject = '⚠️ Account Temporarily Locked'
  const template = 'account-locked'

  // Create email log entry
  await logEmail({
    to: email,
    subject,
    template,
    data,
  })

  // In production, send actual email here
  console.log('[Email] Account locked email would be sent to:', email)
  console.log('[Email] Lockout ends at:', data.lockoutEndsAt.toISOString())
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  data: {
    userName: string
    resetToken: string
    expiresAt: Date
  }
): Promise<void> {
  const subject = 'Reset Your Password'
  const template = 'password-reset'

  // Create email log entry
  await logEmail({
    to: email,
    subject,
    template,
    data,
  })

  // In production, send actual email here
  console.log('[Email] Password reset email would be sent to:', email)
  console.log('[Email] Reset token:', data.resetToken)
  console.log('[Email] Expires at:', data.expiresAt.toISOString())
}

/**
 * Log email to database
 */
async function logEmail(options: EmailOptions): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: options.to,
        from: process.env.EMAIL_FROM || 'noreply@mais.sa',
        subject: options.subject,
        template: options.template,
        status: 'PENDING',
        metadata: options.data,
        attempts: 0,
      },
    })
  } catch (error) {
    console.error('[Email] Failed to log email:', error)
  }
}

/**
 * Mark email as sent
 */
export async function markEmailAsSent(emailId: string): Promise<void> {
  try {
    await prisma.emailLog.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[Email] Failed to mark email as sent:', error)
  }
}

/**
 * Mark email as failed
 */
export async function markEmailAsFailed(
  emailId: string,
  errorMessage: string
): Promise<void> {
  try {
    await prisma.emailLog.update({
      where: { id: emailId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage,
        attempts: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error('[Email] Failed to mark email as failed:', error)
  }
}
