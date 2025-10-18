import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { 
  welcomeEmailTemplate, 
  passwordResetEmailTemplate, 
  securityAlertEmailTemplate,
  dailySummaryEmailTemplate,
  highRejectRateAlertTemplate,
  backupStatusEmailTemplate,
  reportReadyEmailTemplate
} from './email-templates'

/**
 * Email service for sending notifications
 * Supports both SMTP (Nodemailer) and Resend API
 */

export interface EmailConfig {
  provider: 'smtp' | 'resend'
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }
  resend?: {
    apiKey: string
  }
  from: {
    name: string
    email: string
  }
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
}

export interface EmailJob {
  id: string
  to: string
  template: string
  data: Record<string, any>
  scheduledFor: Date
  attempts: number
  status: 'pending' | 'sent' | 'failed'
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

export interface WelcomeEmailData {
  userName: string
  email: string
  loginUrl: string
}

export interface PasswordResetEmailData {
  userName: string
  resetUrl: string
  expiresAt: Date
}

export interface DailySummaryEmailData {
  userName: string
  date: Date
  stats: {
    itemsAdded: number
    itemsUpdated: number
    totalValue: number
    rejectRate: number
  }
  topItems: Array<{ name: string; quantity: number }>
  alerts: Array<{ message: string; severity: string }>
}

export interface HighRejectRateAlertData {
  rejectRate: number
  threshold: number
  affectedItems: Array<{ name: string; batch: string; rejectCount: number }>
  dateRange: { from: Date; to: Date }
}

export interface BackupStatusEmailData {
  status: 'success' | 'failed'
  backupName: string
  timestamp: Date
  size?: string
  error?: string
}

export interface ReportReadyEmailData {
  userName: string
  reportTitle: string
  reportType: string
  downloadUrl: string
  generatedAt: Date
}

// Email configuration
const emailConfig: EmailConfig = {
  provider: process.env.EMAIL_PROVIDER === 'resend' ? 'resend' : 'smtp',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
  },
  from: {
    name: process.env.SMTP_FROM_NAME || 'Saudi Mais Inventory System',
    email: process.env.SMTP_FROM || 'noreply@mais.sa',
  },
}

// Create transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter && emailConfig.provider === 'smtp') {
    transporter = nodemailer.createTransport({
      host: emailConfig.smtp!.host,
      port: emailConfig.smtp!.port,
      secure: emailConfig.smtp!.secure,
      auth: emailConfig.smtp!.auth,
    })
  }
  return transporter!
}

// Email queue for retry logic
class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false

  async add(job: Omit<EmailJob, 'id' | 'attempts' | 'status'>): Promise<void> {
    const emailJob: EmailJob = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      status: 'pending',
    }
    this.queue.push(emailJob)
    
    if (!this.processing) {
      this.process()
    }
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const job = this.queue[0]
      
      try {
        await sendEmailInternal(job.to, job.template, job.data)
        job.status = 'sent'
        this.queue.shift()
      } catch (error) {
        job.attempts++
        
        if (job.attempts >= 3) {
          job.status = 'failed'
          this.queue.shift()
          console.error(`[EmailQueue] Job ${job.id} failed after 3 attempts:`, error)
        } else {
          // Move to end of queue for retry
          this.queue.shift()
          this.queue.push(job)
          await new Promise(resolve => setTimeout(resolve, 5000 * job.attempts))
        }
      }
    }
    
    this.processing = false
  }

  async retry(jobId: string): Promise<void> {
    const job = this.queue.find(j => j.id === jobId)
    if (job) {
      job.attempts = 0
      job.status = 'pending'
      this.process()
    }
  }

  getStatus() {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
      processing: this.processing,
    }
  }
}

const emailQueue = new EmailQueue()

/**
 * Internal function to send email
 */
async function sendEmailInternal(
  to: string | string[],
  template: string,
  data: Record<string, any>
): Promise<void> {
  const { html, text, subject } = getEmailTemplate(template, data)
  
  if (emailConfig.provider === 'smtp') {
    const transporter = getTransporter()
    
    await transporter.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    })
  } else if (emailConfig.provider === 'resend') {
    // Resend API implementation
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailConfig.resend!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`)
    }
  }
}

/**
 * Get email template
 */
function getEmailTemplate(
  template: string,
  data: Record<string, any>
): { html: string; text: string; subject: string } {
  switch (template) {
    case 'welcome':
      return welcomeEmailTemplate(data as WelcomeEmailData)
    case 'password-reset':
      return passwordResetEmailTemplate(data as PasswordResetEmailData)
    case 'security-alert':
      return securityAlertEmailTemplate(data as SecurityAlertEmailData)
    case 'daily-summary':
      return dailySummaryEmailTemplate(data as DailySummaryEmailData)
    case 'high-reject-rate':
      return highRejectRateAlertTemplate(data as HighRejectRateAlertData)
    case 'backup-status':
      return backupStatusEmailTemplate(data as BackupStatusEmailData)
    case 'report-ready':
      return reportReadyEmailTemplate(data as ReportReadyEmailData)
    default:
      throw new Error(`Unknown email template: ${template}`)
  }
}

/**
 * Send email with logging and retry
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  const emailId = await logEmail(options)
  
  try {
    await sendEmailInternal(options.to, options.template, options.data)
    await markEmailAsSent(emailId)
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    await markEmailAsFailed(emailId, error instanceof Error ? error.message : 'Unknown error')
    
    // Add to queue for retry
    emailQueue.add({
      to: Array.isArray(options.to) ? options.to[0] : options.to,
      template: options.template,
      data: options.data,
      scheduledFor: new Date(),
    })
    
    throw error
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  data: WelcomeEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to Saudi Mais Inventory System',
    template: 'welcome',
    data,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  data: PasswordResetEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    template: 'password-reset',
    data,
    priority: 'high',
  })
}

/**
 * Send security alert email for new device login
 */
export async function sendSecurityAlertEmail(
  email: string,
  data: SecurityAlertEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: '🔐 New Device Login Detected',
    template: 'security-alert',
    data,
    priority: 'high',
  })
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  email: string,
  data: DailySummaryEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your Daily Inventory Summary',
    template: 'daily-summary',
    data,
  })
}

/**
 * Send high reject rate alert
 */
export async function sendHighRejectRateAlert(
  emails: string[],
  data: HighRejectRateAlertData
): Promise<void> {
  await sendEmail({
    to: emails,
    subject: '⚠️ High Reject Rate Detected',
    template: 'high-reject-rate',
    data,
    priority: 'high',
  })
}

/**
 * Send backup status notification
 */
export async function sendBackupStatusEmail(
  email: string,
  data: BackupStatusEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: data.status === 'success' 
      ? '✅ Backup Completed Successfully' 
      : '❌ Backup Failed',
    template: 'backup-status',
    data,
    priority: data.status === 'failed' ? 'high' : 'normal',
  })
}

/**
 * Send report ready notification
 */
export async function sendReportReadyEmail(
  email: string,
  data: ReportReadyEmailData
): Promise<void> {
  await sendEmail({
    to: email,
    subject: '📊 Your Report is Ready',
    template: 'report-ready',
    data,
  })
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

  await logEmail({
    to: email,
    subject,
    template,
    data,
  })

  console.log('[Email] Account locked email would be sent to:', email)
  console.log('[Email] Lockout ends at:', data.lockoutEndsAt.toISOString())
}

/**
 * Log email to database
 */
async function logEmail(options: EmailOptions): Promise<string> {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: Array.isArray(options.to) ? options.to[0] : options.to,
        from: emailConfig.from.email,
        subject: options.subject,
        template: options.template,
        status: 'PENDING',
        metadata: options.data,
        attempts: 0,
      },
    })
    return emailLog.id
  } catch (error) {
    console.error('[Email] Failed to log email:', error)
    return `email_${Date.now()}`
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

/**
 * Get email queue status
 */
export function getEmailQueueStatus() {
  return emailQueue.getStatus()
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    if (emailConfig.provider === 'smtp') {
      const transporter = getTransporter()
      await transporter.verify()
      return true
    }
    return true
  } catch (error) {
    console.error('[Email] Configuration test failed:', error)
    return false
  }
}
