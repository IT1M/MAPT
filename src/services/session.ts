import { prisma } from './prisma'
import { parseUserAgent } from '@/utils/user-agent'

/**
 * Session management service
 */

export interface SessionInfo {
  sessionToken: string
  userId: string
  ipAddress: string
  userAgent: string
  location?: string
}

/**
 * Update session with device and location information
 * This should be called after a session is created by NextAuth
 */
export async function updateSessionInfo(sessionInfo: SessionInfo): Promise<void> {
  try {
    const parsed = parseUserAgent(sessionInfo.userAgent)

    await prisma.session.updateMany({
      where: {
        sessionToken: sessionInfo.sessionToken,
        userId: sessionInfo.userId,
      },
      data: {
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress: sessionInfo.ipAddress,
        location: sessionInfo.location || 'Unknown',
        userAgent: sessionInfo.userAgent,
        lastActive: new Date(),
      },
    })

    console.log(`[Session] Updated session info for user ${sessionInfo.userId}`)
  } catch (error) {
    console.error('[Session] Failed to update session info:', error)
  }
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await prisma.session.updateMany({
      where: { sessionToken },
      data: { lastActive: new Date() },
    })
  } catch (error) {
    console.error('[Session] Failed to update session activity:', error)
  }
}

export interface LocationData {
  city: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  formatted: string
}

/**
 * Get IP geolocation using ip-api.com (free tier)
 * Rate limit: 45 requests per minute
 * For production, consider using a paid service or caching results
 */
export async function getLocationFromIP(ipAddress: string): Promise<string> {
  // Skip for local/private IPs
  if (
    ipAddress === 'unknown' ||
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return 'Local Network'
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,city,lat,lon`, {
      headers: {
        'User-Agent': 'Saudi-Mais-Inventory-System',
      },
    })

    if (!response.ok) {
      throw new Error('Geolocation API request failed')
    }

    const data = await response.json()

    if (data.status === 'success') {
      return `${data.city}, ${data.country}`
    } else {
      console.warn('[Session] Geolocation failed:', data.message)
      return 'Unknown'
    }
  } catch (error) {
    console.error('[Session] Failed to get location:', error)
    return 'Unknown'
  }
}

/**
 * Get detailed location data from IP
 */
export async function getDetailedLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  // Skip for local/private IPs
  if (
    ipAddress === 'unknown' ||
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return null
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,city,lat,lon`, {
      headers: {
        'User-Agent': 'Saudi-Mais-Inventory-System',
      },
    })

    if (!response.ok) {
      throw new Error('Geolocation API request failed')
    }

    const data = await response.json()

    if (data.status === 'success') {
      return {
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
        latitude: data.lat,
        longitude: data.lon,
        formatted: `${data.city}, ${data.country}`,
      }
    }

    return null
  } catch (error) {
    console.error('[Session] Failed to get detailed location:', error)
    return null
  }
}

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Terminate all sessions for a user except the current one
 */
export async function terminateOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        userId,
        sessionToken: {
          not: currentSessionToken,
        },
      },
    })

    console.log(`[Session] Terminated ${result.count} sessions for user ${userId}`)
    return result.count
  } catch (error) {
    console.error('[Session] Failed to terminate other sessions:', error)
    return 0
  }
}

/**
 * Clean up expired sessions
 * This should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    })

    console.log(`[Session] Cleaned up ${result.count} expired sessions`)
    return result.count
  } catch (error) {
    console.error('[Session] Failed to cleanup expired sessions:', error)
    return 0
  }
}

/**
 * Rotate session token for enhanced security
 * This creates a new session token while maintaining the same session
 * Should be called after privilege escalation or sensitive operations
 */
export async function rotateSessionToken(
  currentSessionToken: string,
  userId: string
): Promise<string | null> {
  try {
    // Get current session
    const currentSession = await prisma.session.findUnique({
      where: { sessionToken: currentSessionToken },
    })

    if (!currentSession || currentSession.userId !== userId) {
      console.error('[Session] Session not found or user mismatch')
      return null
    }

    // Generate new session token
    const newSessionToken = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${userId}`

    // Update session with new token
    await prisma.session.update({
      where: { sessionToken: currentSessionToken },
      data: {
        sessionToken: newSessionToken,
        lastActive: new Date(),
      },
    })

    console.log(`[Session] Rotated session token for user ${userId}`)
    return newSessionToken
  } catch (error) {
    console.error('[Session] Failed to rotate session token:', error)
    return null
  }
}

/**
 * Extend session expiration (for "Remember Me" functionality)
 */
export async function extendSession(
  sessionToken: string,
  userId: string,
  days: number = 30
): Promise<boolean> {
  try {
    const newExpiration = new Date()
    newExpiration.setDate(newExpiration.getDate() + days)

    await prisma.session.updateMany({
      where: {
        sessionToken,
        userId,
      },
      data: {
        expires: newExpiration,
      },
    })

    console.log(`[Session] Extended session for user ${userId} to ${newExpiration.toISOString()}`)
    return true
  } catch (error) {
    console.error('[Session] Failed to extend session:', error)
    return false
  }
}
