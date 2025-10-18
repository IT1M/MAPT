import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { updateSessionInfo, getLocationFromIP, getDetailedLocationFromIP } from '@/services/session'
import { isNewDevice, sendNewDeviceNotification, isSuspiciousLocation } from '@/services/login-security'
import { parseUserAgent } from '@/utils/user-agent'

/**
 * POST /api/auth/session/update
 * Update session information after login
 * This endpoint should be called by the client after successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session token from cookies
    const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                        request.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 400 }
      )
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get location from IP
    const location = await getLocationFromIP(ipAddress)
    const detailedLocation = await getDetailedLocationFromIP(ipAddress)

    // Update session info
    await updateSessionInfo({
      sessionToken,
      userId: session.user.id,
      ipAddress,
      userAgent,
      location,
    })

    // Parse user agent
    const parsed = parseUserAgent(userAgent)

    // Check if this is a new device
    const isNew = await isNewDevice(session.user.id, {
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      ipAddress,
    })

    // Check if location is suspicious
    const locationCheck = await isSuspiciousLocation(
      session.user.id,
      detailedLocation ? {
        latitude: detailedLocation.latitude,
        longitude: detailedLocation.longitude,
      } : null
    )

    // Determine if we should send a security alert
    const shouldAlert = isNew || locationCheck.suspicious

    // Send notification if new device or suspicious location
    if (shouldAlert) {
      await sendNewDeviceNotification(session.user.id, {
        deviceType: parsed.device,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress,
        location,
      })
    }

    return NextResponse.json({
      success: true,
      isNewDevice: isNew,
      suspiciousLocation: locationCheck.suspicious,
      distance: locationCheck.distance,
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
