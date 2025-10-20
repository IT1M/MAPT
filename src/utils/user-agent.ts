/**
 * User-agent parsing utilities for device and browser detection
 */

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Parse user-agent string to extract browser, OS, and device information
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      device: 'Unknown Device',
      deviceType: 'unknown',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';

  if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = extractVersion(ua, 'edg/');
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome';
    browserVersion = extractVersion(ua, 'chrome/');
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = extractVersion(ua, 'firefox/');
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
    browserVersion = extractVersion(ua, 'version/');
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
    browserVersion = extractVersion(
      ua,
      ua.includes('opr/') ? 'opr/' : 'opera/'
    );
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion = '';

  if (ua.includes('windows nt')) {
    os = 'Windows';
    const version = extractVersion(ua, 'windows nt ');
    osVersion = getWindowsVersion(version);
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    osVersion = extractVersion(ua, 'mac os x ').replace(/_/g, '.');
  } else if (ua.includes('android')) {
    os = 'Android';
    osVersion = extractVersion(ua, 'android ');
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    osVersion = extractVersion(ua, 'os ').replace(/_/g, '.');
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Detect device type
  let deviceType: ParsedUserAgent['deviceType'] = 'desktop';
  let device = 'Desktop';

  if (ua.includes('mobile') || ua.includes('android')) {
    deviceType = 'mobile';
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
    device = 'Tablet';
  }

  // More specific device detection
  if (ua.includes('iphone')) {
    device = 'iPhone';
    deviceType = 'mobile';
  } else if (ua.includes('ipad')) {
    device = 'iPad';
    deviceType = 'tablet';
  } else if (ua.includes('android')) {
    if (ua.includes('mobile')) {
      device = 'Android Phone';
      deviceType = 'mobile';
    } else {
      device = 'Android Tablet';
      deviceType = 'tablet';
    }
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    deviceType,
  };
}

/**
 * Extract version number from user-agent string
 */
function extractVersion(ua: string, prefix: string): string {
  const index = ua.indexOf(prefix);
  if (index === -1) return '';

  const versionStart = index + prefix.length;
  const versionEnd = ua.indexOf(' ', versionStart);
  const versionString = ua.substring(
    versionStart,
    versionEnd === -1 ? undefined : versionEnd
  );

  // Extract just the version number (major.minor)
  const match = versionString.match(/^(\d+\.?\d*)/);
  return match ? match[1] : versionString;
}

/**
 * Convert Windows NT version to friendly name
 */
function getWindowsVersion(ntVersion: string): string {
  const versions: Record<string, string> = {
    '10.0': '10/11',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.1': 'XP',
  };

  return versions[ntVersion] || ntVersion;
}

/**
 * Format parsed user-agent into a readable string
 */
export function formatUserAgent(parsed: ParsedUserAgent): string {
  const parts: string[] = [];

  if (parsed.browser !== 'Unknown') {
    parts.push(
      parsed.browserVersion
        ? `${parsed.browser} ${parsed.browserVersion}`
        : parsed.browser
    );
  }

  if (parsed.os !== 'Unknown') {
    parts.push(
      parsed.osVersion ? `${parsed.os} ${parsed.osVersion}` : parsed.os
    );
  }

  if (parsed.device !== 'Unknown Device' && parsed.device !== 'Desktop') {
    parts.push(parsed.device);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Unknown Device';
}

/**
 * Get device icon name based on device type
 */
export function getDeviceIcon(
  deviceType: ParsedUserAgent['deviceType']
): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
}
