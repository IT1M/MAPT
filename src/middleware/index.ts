/**
 * Middleware exports for easy importing
 */

// Rate limiting
export {
  RateLimiter,
  type RateLimitConfig,
  defaultRateLimiter,
  geminiRateLimiter,
  checkRateLimit,
} from './rate-limiter';

// Authentication
export {
  type AuthContext,
  requireAuth,
  requireRole,
  requirePermission,
  getPermissionsForRole,
  unauthorizedResponse,
  forbiddenResponse,
  checkAuth,
  checkRole,
  checkPermission,
} from './auth';

// CSRF protection
export {
  generateCsrfToken,
  verifyCsrfToken,
  checkCsrf,
  addCsrfHeaders,
} from './csrf';

// Security headers
export {
  SECURITY_HEADERS,
  addSecurityHeaders,
  createSecureResponse,
} from './security-headers';
