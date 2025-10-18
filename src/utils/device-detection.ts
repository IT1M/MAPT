/**
 * Device detection utilities for parsing user agent strings
 */

export interface DeviceInfo {
  deviceType: string
  browser: string
  os: string
  userAgent: string
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType = 'Desktop'
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'Tablet'
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    deviceType = 'Mobile'
  }
  
  // Detect browser
  let browser = 'Unknown'
  if (ua.includes('edg/')) {
    browser = 'Edge'
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome'
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari'
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera'
  } else if (ua.includes('trident/') || ua.includes('msie')) {
    browser = 'Internet Explorer'
  }
  
  // Detect OS
  let os = 'Unknown'
  if (ua.includes('windows nt 10.0')) {
    os = 'Windows 10'
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows 8.1'
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows 8'
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows 7'
  } else if (ua.includes('windows')) {
    os = 'Windows'
  } else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+)[._](\d+)/)
    if (match) {
      os = `macOS ${match[1]}.${match[2]}`
    } else {
      os = 'macOS'
    }
  } else if (ua.includes('android')) {
    const match = ua.match(/android (\d+\.?\d*)/)
    if (match) {
      os = `Android ${match[1]}`
    } else {
      os = 'Android'
    }
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os (\d+)[._](\d+)/)
    if (match) {
      os = `iOS ${match[1]}.${match[2]}`
    } else {
      os = 'iOS'
    }
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }
  
  return {
    deviceType,
    browser,
    os,
    userAgent,
  }
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Get approximate location from IP address
 * Note: This is a placeholder. In production, use a geolocation service like:
 * - MaxMind GeoIP2
 * - IP2Location
 * - ipapi.co
 */
export async function getLocationFromIp(ipAddress: string): Promise<string> {
  // For now, return a placeholder
  // In production, implement actual geolocation lookup
  if (ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return 'Local'
  }
  
  // TODO: Implement actual geolocation service
  // Example with ipapi.co (free tier):
  // try {
  //   const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
  //   const data = await response.json()
  //   return `${data.city}, ${data.country_name}`
  // } catch (error) {
  //   console.error('Failed to get location:', error)
  //   return 'Unknown'
  // }
  
  return 'Unknown'
}
