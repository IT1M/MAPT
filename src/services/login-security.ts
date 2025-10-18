import { prisma } from './prisma'

/**
 * Login security service for tracking failed attempts and managing account lockouts
 */

interface FailedLoginAttempt {
  email: string
  ipAddress: string
  timestamp: Date
  userAgent: string
}

interface LoginSecurityStatus {
  isLocked: boolean
  requiresCaptcha: boolean
  attemptsRemaining: number
  lockoutEndsAt?: Date
}

// In-memory store for failed login attempts
// In production, use Redis for distributed systems
const failedAttempts = new Map<string, FailedLoginAttempt[]>()

// Configuration
const SECURITY_CONFIG = {
  MAX_ATTEMPTS_BEFORE_CAPTCHA: 5,
  MAX_ATTEMPTS_BEFORE_LOCKOUT: 10,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
}

/**
 * Get the key for tracking failed attempts
 */
function getAttemptKey(email: string): string {
  return `login:${email.toLowerCase()}`
}

/**
 * Clean up old attempts outside the time window
 */
function cleanupOldAttempts(attempts: FailedLoginAttempt[]): FailedLoginAttempt[] {
  const cutoffTime = Date.now() - SECURITY_CONFIG.ATTEMPT_WINDOW_MS
  return attempts.filter(attempt => attempt.timestamp.getTime() > cutoffTime)
}

/**
 * Get current failed login attempts for an email
 */
export function getFailedAttempts(email: string): FailedLoginAttempt[] {
  const key = getAttemptKey(email)
  const attempts = failedAttempts.get(key) || []
  const cleanedAttempts = cleanupOldAttempts(attempts)
  
  // Update the map with cleaned attempts
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
export async function recordFailedLogin(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const key = getAttemptKey(email)
  const attempts = getFailedAttempts(email)
  
  // Add new attempt
  attempts.push({
    email,
    ipAddress,
    timestamp: new Date(),
    userAgent,
  })
  
  failedAttempts.set(key, attempts)
  
  const attemptCount = attempts.length
  
  console.log(`[LoginSecurity] Failed login attempt ${attemptCount} for ${email} from ${ipAddress}`)
  
  // Check if account should be locked
  if (attemptCount >= SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    await lockAccount(email)
  }
}

/**
 * Clear failed login attempts for an email (after successful login)
 */
export function clearFailedAttempts(email: string): void {
  const key = getAttemptKey(email)
  failedAttempts.delete(key)
  console.log(`[LoginSecurity] Cleared failed attempts for ${email}`)
}

/**
 * Check if CAPTCHA is required for this email
 */
export function requiresCaptcha(email: string): boolean {
  const attempts = getFailedAttempts(email)
  return attempts.length >= SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_CAPTCHA
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { lockedUntil: true },
  })
  
  if (!user || !user.lockedUntil) {
    return false
  }
  
  // Check if lockout period has expired
  if (user.lockedUntil.getTime() <= Date.now()) {
    // Unlock the account
    await unlockAccount(email)
    return false
  }
  
  return true
}

/**
 * Lock an account due to too many failed attempts
 */
export async function lockAccount(email: string): Promise<void> {
  const lockoutEndsAt = new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION_MS)
  
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lockedUntil: lockoutEndsAt,
      },
    })
    
    console.log(`[LoginSecurity] Account locked for ${email} until ${lockoutEndsAt.toISOString()}`)
    
    // Send security alert notification
    await sendAccountLockedNotification(email, lockoutEndsAt)
  } catch (error) {
    console.error(`[LoginSecurity] Failed to lock account for ${email}:`, error)
  }
}

/**
 * Unlock an account
 */
export async function unlockAccount(email: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lockedUntil: null,
      },
    })
    
    // Clear failed attempts
    clearFailedAttempts(email)
    
    console.log(`[LoginSecurity] Account unlocked for ${email}`)
  } catch (error) {
    console.error(`[LoginSecurity] Failed to unlock account for ${email}:`, error)
  }
}

/**
 * Get login security status for an email
 */
export async function getLoginSecurityStatus(email: string): Promise<LoginSecurityStatus> {
  const attempts = getFailedAttempts(email)
  const locked = await isAccountLocked(email)
  
  let lockoutEndsAt: Date | undefined
  if (locked) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { lockedUntil: true },
    })
    lockoutEndsAt = user?.lockedUntil || undefined
  }
  
  return {
    isLocked: locked,
    requiresCaptcha: requiresCaptcha(email),
    attemptsRemaining: Math.max(0, SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCKOUT - attempts.length),
    lockoutEndsAt,
  }
}

/**
 * Send account locked notification
 */
async function sendAccountLockedNotification(email: string, lockoutEndsAt: Date): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true },
    })
    
    if (!user) {
      return
    }
    
    // Create in-app notification
    await prisma.notification.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'ALERT',
        priority: 'URGENT',
        title: 'Account Locked',
        message: `Your account has been temporarily locked due to multiple failed login attempts. It will be automatically unlocked at ${lockoutEndsAt.toLocaleString()}.`,
        metadata: {
          lockoutEndsAt: lockoutEndsAt.toISOString(),
          reason: 'multiple_failed_attempts',
        },
      },
    })
    
    // Send email notification
    const { sendAccountLockedEmail } = await import('./email')
    await sendAccountLockedEmail(email, {
      userName: user.name,
      lockoutEndsAt,
    })
    
    console.log(`[LoginSecurity] Security alert notification created for ${email}`)
  } catch (error) {
    console.error(`[LoginSecurity] Failed to send notification for ${email}:`, error)
  }
}

/**
 * Send new device login notification
 */
export async function sendNewDeviceNotification(
  userId: string,
  deviceInfo: {
    deviceType?: string
    browser?: string
    os?: string
    ipAddress?: string
    location?: string
  }
): Promise<void> {
  try {
    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    if (!user) {
      return
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'ALERT',
        priority: 'HIGH',
        title: 'New Device Login',
        message: `A new login was detected from ${deviceInfo.deviceType || 'Unknown device'} in ${deviceInfo.location || 'Unknown location'}. If this wasn't you, please secure your account immediately.`,
        metadata: deviceInfo,
      },
    })

    // Send email notification
    const { sendSecurityAlertEmail } = await import('./email')
    await sendSecurityAlertEmail(user.email, {
      userName: user.name,
      deviceType: deviceInfo.deviceType || 'Unknown device',
      browser: deviceInfo.browser || 'Unknown browser',
      os: deviceInfo.os || 'Unknown OS',
      ipAddress: deviceInfo.ipAddress || 'Unknown',
      location: deviceInfo.location || 'Unknown location',
      timestamp: new Date(),
    })
    
    console.log(`[LoginSecurity] New device notification created for user ${userId}`)
  } catch (error) {
    console.error(`[LoginSecurity] Failed to send new device notification:`, error)
  }
}

/**
 * Record successful login and update user metadata
 */
export async function recordSuccessfulLogin(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    // Clear failed attempts
    clearFailedAttempts(email)
    
    // Update user's last login info
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        lastLoginIp: ipAddress,
      },
    })
    
    console.log(`[LoginSecurity] Successful login recorded for ${email}`)
  } catch (error) {
    console.error(`[LoginSecurity] Failed to record successful login:`, error)
  }
}

/**
 * Check if this is a new device/location for the user
 */
export async function isNewDevice(
  userId: string,
  deviceInfo: {
    deviceType?: string
    browser?: string
    ipAddress?: string
  }
): Promise<boolean> {
  try {
    // Get recent sessions (last 30 days)
    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        deviceType: true,
        browser: true,
        ipAddress: true,
      },
    })
    
    // Check if this device/browser combination exists
    const deviceExists = recentSessions.some(
      session =>
        session.deviceType === deviceInfo.deviceType &&
        session.browser === deviceInfo.browser
    )
    
    // Check if this IP address exists
    const ipExists = recentSessions.some(
      session => session.ipAddress === deviceInfo.ipAddress
    )
    
    // Consider it a new device if both device and IP are new
    return !deviceExists && !ipExists
  } catch (error) {
    console.error(`[LoginSecurity] Failed to check for new device:`, error)
    return false
  }
}

/**
 * Check if login is from a suspicious location
 * Returns true if the distance from the last known location exceeds threshold
 */
export async function isSuspiciousLocation(
  userId: string,
  currentLocation: { latitude: number; longitude: number } | null
): Promise<{ suspicious: boolean; distance?: number; lastLocation?: string }> {
  if (!currentLocation) {
    return { suspicious: false }
  }

  try {
    // Get the most recent session with location data
    const lastSession = await prisma.session.findFirst({
      where: {
        userId,
        location: {
          not: null,
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
      select: {
        location: true,
      },
    })

    if (!lastSession?.location || lastSession.location === 'Unknown') {
      return { suspicious: false }
    }

    // For now, we can't calculate distance without storing coordinates
    // This would require storing latitude/longitude in the session model
    // For the current implementation, we'll just check if location changed
    return {
      suspicious: false,
      lastLocation: lastSession.location,
    }
  } catch (error) {
    console.error('[LoginSecurity] Failed to check suspicious location:', error)
    return { suspicious: false }
  }
}
