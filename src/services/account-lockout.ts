import { prisma } from './prisma'
import { sendEmail } from './email'

/**
 * Account Lockout Service
 * Tracks failed login attempts and manages account lockouts
 */

interface FailedAttempt {
  email: string
  ipAddress: string
  timestamp: Date
  userAgent: string
}

// In-memory store for failed attempts
// For production with multiple instances, use Redis
const failedAttempts = new Map<string, FailedAttempt[]>()

const LOCKOUT_CONFIG = {
  CAPTCHA_THRESHOLD: 5,
  LOCKOUT_THRESHOLD: 10,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTO_UNLOCK_MS: 15 * 60 * 1000 // 15 minutes
}

/**
 * Get key for tracking attempts
 */
function getAttemptKey(email: string): string {
  return `attempts:${email.toLowerCase()}`
}

/**
 * Clean up old attempts outside the time window
 */
function cleanupOldAttempts(attempts: FailedAttempt[]): FailedAttempt[] {
  const cutoffTime = Date.now() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS
  return attempts.filter(attempt => attempt.timestamp.getTime() > cutoffTime)
}

/**
 * Get failed attempts for an email
 */
export function getFailedAttempts(email: string): FailedAttempt[] {
  const key = getAttemptKey(email)
  const attempts = failedAttempts.get(key) || []
  const cleanedAttempts = cleanupOldAttempts(attempts)

  if (cleanedAttempts.length > 0) {
    failedAttempts.set(key, cleanedAttempts)
  } else {
    failedAttempts.delete(key)
  }

  return cleanedAttempts
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  attemptCount: number
  requiresCaptcha: boolean
  isLocked: boolean
}> {
  const key = getAttemptKey(email)
  const attempts = getFailedAttempts(email)

  // Add new attempt
  attempts.push({
    email,
    ipAddress,
    timestamp: new Date(),
    userAgent
  })

  failedAttempts.set(key, attempts)

  const attemptCount = attempts.length
  const requiresCaptcha = attemptCount >= LOCKOUT_CONFIG.CAPTCHA_THRESHOLD
  const shouldLock = attemptCount >= LOCKOUT_CONFIG.LOCKOUT_THRESHOLD

  console.log(`[AccountLockout] Failed attempt ${attemptCount} for ${email} from ${ipAddress}`)

  // Lock account if threshold reached
  if (shouldLock) {
    await lockAccount(email, ipAddress, userAgent)
    return {
      attemptCount,
      requiresCaptcha: true,
      isLocked: true
    }
  }

  return {
    attemptCount,
    requiresCaptcha,
    isLocked: false
  }
}

/**
 * Clear failed attempts after successful login
 */
export function clearFailedAttempts(email: string): void {
  const key = getAttemptKey(email)
  failedAttempts.delete(key)
  console.log(`[AccountLockout] Cleared failed attempts for ${email}`)
}

/**
 * Lock user account
 */
async function lockAccount(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const lockUntil = new Date(Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS)

  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lockedUntil: lockUntil,
        updatedAt: new Date()
      }
    })

    console.log(`[AccountLockout] Account locked for ${email} until ${lockUntil}`)

    // Log security event
    await prisma.activityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        event: 'ACCOUNT_LOCKED',
        metadata: {
          reason: 'Too many failed login attempts',
          ipAddress,
          userAgent,
          lockUntil: lockUntil.toISOString()
        },
        ipAddress,
        userAgent,
        sessionId: 'system',
        timestamp: new Date()
      }
    })

    // Send security alert email
    await sendSecurityAlertEmail(user.email, user.name, {
      type: 'account_locked',
      ipAddress,
      lockUntil
    })
  } catch (error) {
    console.error('[AccountLockout] Error locking account:', error)
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<{
  isLocked: boolean
  lockedUntil?: Date
  minutesRemaining?: number
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { lockedUntil: true }
    })

    if (!user || !user.lockedUntil) {
      return { isLocked: false }
    }

    const now = new Date()
    
    // Check if lock has expired
    if (user.lockedUntil <= now) {
      // Auto-unlock
      await unlockAccount(email)
      return { isLocked: false }
    }

    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
    )

    return {
      isLocked: true,
      lockedUntil: user.lockedUntil,
      minutesRemaining
    }
  } catch (error) {
    console.error('[AccountLockout] Error checking lock status:', error)
    return { isLocked: false }
  }
}

/**
 * Unlock user account
 */
export async function unlockAccount(email: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lockedUntil: null,
        updatedAt: new Date()
      }
    })

    // Clear failed attempts
    clearFailedAttempts(email)

    console.log(`[AccountLockout] Account unlocked for ${email}`)
  } catch (error) {
    console.error('[AccountLockout] Error unlocking account:', error)
  }
}

/**
 * Manually unlock account (admin action)
 */
export async function manualUnlock(
  email: string,
  adminId: string
): Promise<void> {
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lockedUntil: null,
        updatedAt: new Date()
      }
    })

    // Clear failed attempts
    clearFailedAttempts(email)

    // Log admin action
    await prisma.activityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: adminId,
        event: 'ACCOUNT_UNLOCKED',
        metadata: {
          targetUserId: user.id,
          targetEmail: email,
          reason: 'Manual unlock by admin'
        },
        ipAddress: 'admin',
        userAgent: 'admin',
        sessionId: 'admin',
        timestamp: new Date()
      }
    })

    console.log(`[AccountLockout] Account manually unlocked for ${email} by admin ${adminId}`)
  } catch (error) {
    console.error('[AccountLockout] Error manually unlocking account:', error)
    throw error
  }
}

/**
 * Check if CAPTCHA is required
 */
export function requiresCaptcha(email: string): boolean {
  const attempts = getFailedAttempts(email)
  return attempts.length >= LOCKOUT_CONFIG.CAPTCHA_THRESHOLD
}

/**
 * Send security alert email
 */
async function sendSecurityAlertEmail(
  email: string,
  name: string,
  alert: {
    type: 'account_locked' | 'suspicious_login'
    ipAddress: string
    lockUntil?: Date
  }
): Promise<void> {
  try {
    if (alert.type === 'account_locked') {
      await sendEmail({
        to: email,
        subject: '⚠️ Account Locked - Security Alert',
        template: 'security-alert',
        data: {
          name,
          alertType: 'Account Locked',
          message: `Your account has been temporarily locked due to multiple failed login attempts from IP address ${alert.ipAddress}.`,
          details: `The account will be automatically unlocked at ${alert.lockUntil?.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })} (Riyadh time).`,
          action: 'If this was you, please wait for the lockout period to expire. If this was not you, please contact support immediately.',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@mais.sa'
        }
      })
    }
  } catch (error) {
    console.error('[AccountLockout] Error sending security alert email:', error)
  }
}

/**
 * Get lockout statistics for monitoring
 */
export function getLockoutStats(): {
  totalAttempts: number
  uniqueEmails: number
  averageAttempts: number
} {
  let totalAttempts = 0
  const uniqueEmails = failedAttempts.size

  failedAttempts.forEach(attempts => {
    totalAttempts += attempts.length
  })

  return {
    totalAttempts,
    uniqueEmails,
    averageAttempts: uniqueEmails > 0 ? totalAttempts / uniqueEmails : 0
  }
}
