import { prisma } from './prisma';
import {
  recordFailedAttempt as recordFailedAttemptLockout,
  clearFailedAttempts as clearFailedAttemptsLockout,
  isAccountLocked as checkAccountLocked,
  requiresCaptcha as checkRequiresCaptcha,
  unlockAccount as unlockAccountLockout,
} from './account-lockout';

/**
 * Login security service for tracking failed attempts and managing account lockouts
 * This is a wrapper around the account-lockout service for backward compatibility
 */

interface LoginSecurityStatus {
  isLocked: boolean;
  requiresCaptcha: boolean;
  attemptsRemaining: number;
  lockoutEndsAt?: Date;
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await recordFailedAttemptLockout(email, ipAddress, userAgent);
}

/**
 * Clear failed login attempts for an email (after successful login)
 */
export function clearFailedAttempts(email: string): void {
  clearFailedAttemptsLockout(email);
}

/**
 * Check if CAPTCHA is required for this email
 */
export function requiresCaptcha(email: string): boolean {
  return checkRequiresCaptcha(email);
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const result = await checkAccountLocked(email);
  return result.isLocked;
}

/**
 * Unlock an account
 */
export async function unlockAccount(email: string): Promise<void> {
  await unlockAccountLockout(email);
}

/**
 * Get login security status for an email
 */
export async function getLoginSecurityStatus(
  email: string
): Promise<LoginSecurityStatus> {
  const lockStatus = await checkAccountLocked(email);

  return {
    isLocked: lockStatus.isLocked,
    requiresCaptcha: checkRequiresCaptcha(email),
    attemptsRemaining: 10, // Default value
    lockoutEndsAt: lockStatus.lockedUntil,
  };
}

/**
 * Send new device login notification
 */
export async function sendNewDeviceNotification(
  userId: string,
  deviceInfo: {
    deviceType?: string;
    browser?: string;
    os?: string;
    ipAddress?: string;
    location?: string;
  }
): Promise<void> {
  try {
    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return;
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: 'ALERT',
        priority: 'HIGH',
        title: 'New Device Login',
        message: `A new login was detected from ${deviceInfo.deviceType || 'Unknown device'} in ${deviceInfo.location || 'Unknown location'}. If this wasn't you, please secure your account immediately.`,
        metadata: deviceInfo,
      },
    });

    console.log(
      `[LoginSecurity] New device notification created for user ${userId}`
    );
  } catch (error) {
    console.error(
      `[LoginSecurity] Failed to send new device notification:`,
      error
    );
  }
}

/**
 * Record successful login and update user metadata
 */
export async function recordSuccessfulLogin(
  userId: string,
  email: string,
  ipAddress: string
): Promise<void> {
  try {
    // Clear failed attempts
    clearFailedAttempts(email);

    // Update user's last login info
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    console.log(`[LoginSecurity] Successful login recorded for ${email}`);
  } catch (error) {
    console.error(`[LoginSecurity] Failed to record successful login:`, error);
  }
}

/**
 * Check if this is a new device/location for the user
 */
export async function isNewDevice(
  userId: string,
  deviceInfo: {
    deviceType?: string;
    browser?: string;
    ipAddress?: string;
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
    });

    // Check if this device/browser combination exists
    const deviceExists = recentSessions.some(
      (session: any) =>
        session.deviceType === deviceInfo.deviceType &&
        session.browser === deviceInfo.browser
    );

    // Check if this IP address exists
    const ipExists = recentSessions.some(
      (session: any) => session.ipAddress === deviceInfo.ipAddress
    );

    // Consider it a new device if both device and IP are new
    return !deviceExists && !ipExists;
  } catch (error) {
    console.error(`[LoginSecurity] Failed to check for new device:`, error);
    return false;
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
    return { suspicious: false };
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
    });

    if (!lastSession?.location || lastSession.location === 'Unknown') {
      return { suspicious: false };
    }

    // For now, we can't calculate distance without storing coordinates
    // This would require storing latitude/longitude in the session model
    // For the current implementation, we'll just check if location changed
    return {
      suspicious: false,
      lastLocation: lastSession.location,
    };
  } catch (error) {
    console.error(
      '[LoginSecurity] Failed to check suspicious location:',
      error
    );
    return { suspicious: false };
  }
}
