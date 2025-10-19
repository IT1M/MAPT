# Security System Documentation

## Overview

The Saudi Mais Inventory System includes a comprehensive security system with multiple layers of protection:

- **Two-Factor Authentication (2FA)** - TOTP-based authentication with backup codes
- **Rate Limiting** - Per-IP and per-user rate limiting with configurable limits
- **Account Lockout** - Automatic account lockout after failed login attempts
- **Security Score Dashboard** - Real-time security score calculation and recommendations
- **Security Audit Logging** - Comprehensive logging of all security events

## Features

### 1. Two-Factor Authentication (2FA)

#### Setup Process
1. User enables 2FA in security settings
2. System generates TOTP secret and QR code
3. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
4. User verifies setup with 6-digit code
5. System generates 10 backup codes for recovery
6. 2FA is enabled after successful verification

#### Login with 2FA
1. User enters email and password
2. If 2FA is enabled, system prompts for verification code
3. User enters 6-digit code from authenticator app
4. System verifies code (allows 30s time drift)
5. If code is invalid, user can use backup code
6. After successful verification, user is logged in

#### API Endpoints
- `POST /api/auth/2fa/setup` - Initialize 2FA setup
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA (requires verification)
- `GET /api/auth/2fa/backup-codes` - Get remaining backup codes count
- `POST /api/auth/2fa/backup-codes` - Regenerate backup codes

#### Services
- `src/services/two-factor.ts` - Core 2FA functionality
  - `setup2FA()` - Generate secret and QR code
  - `verify2FASetup()` - Verify setup code
  - `verify2FALogin()` - Verify login code
  - `verifyBackupCode()` - Verify backup code
  - `disable2FA()` - Disable 2FA
  - `regenerateBackupCodes()` - Generate new backup codes

### 2. Rate Limiting

#### Configuration
Rate limits are configured per endpoint in `src/services/rate-limit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.'
  },
  export: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many export requests. Please wait a minute.'
  }
}
```

#### Usage
```typescript
import { checkRateLimit, createRateLimitResponse } from '@/services/rate-limit'

const rateLimit = checkRateLimit(req, 'login')
if (!rateLimit.allowed) {
  return createRateLimitResponse('login', rateLimit.resetAt, rateLimit.retryAfter)
}
```

#### Response Headers
When rate limit is exceeded, the response includes:
- `Retry-After` - Seconds until rate limit resets
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Timestamp when rate limit resets

### 3. Account Lockout

#### Configuration
```typescript
const LOCKOUT_CONFIG = {
  CAPTCHA_THRESHOLD: 5,        // Show CAPTCHA after 5 failed attempts
  LOCKOUT_THRESHOLD: 10,       // Lock account after 10 failed attempts
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,  // 15 minutes
  AUTO_UNLOCK_MS: 15 * 60 * 1000        // Auto-unlock after 15 minutes
}
```

#### Flow
1. User fails login attempt
2. System records failed attempt with IP and user agent
3. After 5 failed attempts, CAPTCHA is required
4. After 10 failed attempts, account is locked for 15 minutes
5. Security alert email is sent to user
6. Account automatically unlocks after 15 minutes
7. Admin can manually unlock account

#### Services
- `src/services/account-lockout.ts`
  - `recordFailedAttempt()` - Record failed login
  - `isAccountLocked()` - Check if account is locked
  - `unlockAccount()` - Unlock account
  - `requiresCaptcha()` - Check if CAPTCHA is required

### 4. Security Score Dashboard

#### Score Calculation
Security score is calculated based on 5 factors (total 100 points):

1. **Password Strength** (30 points)
   - Strong password + changed < 90 days: 30 points
   - Strong password + changed < 180 days: 20 points
   - Strong password + changed > 180 days: 15 points
   - Weak password: 10 points

2. **Two-Factor Authentication** (25 points)
   - 2FA enabled: 25 points
   - 2FA disabled: 0 points

3. **Active Sessions** (15 points)
   - 0-2 sessions: 15 points
   - 3-5 sessions: 10 points
   - 6+ sessions: 5 points

4. **Recent Security Events** (15 points)
   - No failed logins: 15 points
   - 1-3 failed logins: 10 points
   - Account locked: 0 points

5. **Last Password Change** (15 points)
   - Changed < 30 days: 15 points
   - Changed < 90 days: 12 points
   - Changed < 180 days: 8 points
   - Changed < 365 days: 4 points
   - Changed > 365 days: 0 points

#### Score Levels
- **Excellent** (90-100): Green - All security measures in place
- **Good** (70-89): Blue - Strong security with minor improvements needed
- **Medium** (50-69): Amber - Moderate security, several improvements needed
- **Low** (30-49): Red - Weak security, immediate action required
- **Critical** (0-29): Dark Red - Very weak security, urgent action required

#### API Endpoint
- `GET /api/security/score?history=true&days=30` - Get security score with history

#### Component
- `src/components/settings/SecurityScoreDashboard.tsx` - Visual dashboard

### 5. Security Audit Logging

#### Tracked Events
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `LOGOUT` - User logout
- `PASSWORD_CHANGED` - Password changed
- `PASSWORD_RESET_REQUESTED` - Password reset requested
- `PASSWORD_RESET_COMPLETED` - Password reset completed
- `2FA_ENABLED` - 2FA enabled
- `2FA_DISABLED` - 2FA disabled
- `2FA_VERIFIED` - 2FA code verified
- `2FA_FAILED` - 2FA verification failed
- `ACCOUNT_LOCKED` - Account locked
- `ACCOUNT_UNLOCKED` - Account unlocked
- `SESSION_CREATED` - New session created
- `SESSION_TERMINATED` - Session terminated
- `PERMISSION_CHANGED` - User permissions changed
- `ROLE_CHANGED` - User role changed
- `SENSITIVE_DATA_ACCESSED` - Sensitive data accessed
- `EXPORT_DATA` - Data exported
- `BULK_DELETE` - Bulk delete operation

#### Logging
```typescript
import { logSecurityEvent } from '@/services/security-audit'

await logSecurityEvent({
  userId: user.id,
  event: 'LOGIN_SUCCESS',
  ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
  userAgent: req.headers.get('user-agent') || 'unknown',
  success: true,
  metadata: {
    deviceType: 'Desktop',
    browser: 'Chrome'
  }
})
```

#### Suspicious Activity Detection
The system automatically detects suspicious activity patterns:
- Multiple failed login attempts (5+ in 24 hours)
- Logins from multiple IP addresses (5+ in 24 hours)
- Rapid session creation (10+ in 24 hours)
- Multiple 2FA failures (3+ in 24 hours)
- Unusual activity hours (2 AM - 5 AM)

#### API Endpoints
- `GET /api/security/audit?limit=50&offset=0&detectSuspicious=true` - Get audit logs

#### Component
- `src/components/settings/SecurityAuditLogs.tsx` - Audit log viewer

## Environment Variables

Add these to your `.env` file:

```env
# Two-Factor Authentication
TWO_FACTOR_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Support Email (for security alerts)
SUPPORT_EMAIL=support@mais.sa
```

## Database Models

### TwoFactorAuth
```prisma
model two_factor_auth {
  id          String    @id
  userId      String    @unique
  secret      String    // Encrypted TOTP secret
  backupCodes String[]  // Hashed backup codes
  enabled     Boolean   @default(false)
  enabledAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime
  users       users     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### ActivityLog
```prisma
model activity_logs {
  id        String   @id
  userId    String
  event     String
  metadata  Json?
  ipAddress String
  userAgent String
  sessionId String?
  timestamp DateTime @default(now())
  users     users    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Testing

### Manual Testing

1. **Test 2FA Setup**
   - Navigate to Security Settings
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes
   - Verify 2FA is enabled

2. **Test Rate Limiting**
   - Attempt to login 6 times with wrong password
   - Verify rate limit error after 5 attempts
   - Wait 15 minutes and try again

3. **Test Account Lockout**
   - Attempt to login 11 times with wrong password
   - Verify account is locked after 10 attempts
   - Check email for security alert
   - Wait 15 minutes for auto-unlock

4. **Test Security Score**
   - Navigate to Security Settings
   - View security score dashboard
   - Follow recommendations to improve score
   - Verify score updates after changes

5. **Test Audit Logs**
   - Navigate to Security Settings
   - View audit logs
   - Verify all security events are logged
   - Check for suspicious activity alerts

## Production Considerations

### Redis for Rate Limiting
For production with multiple instances, replace in-memory storage with Redis:

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

class RedisRateLimiter {
  async check(key: string, config: RateLimitConfig): Promise<boolean> {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000))
    }
    return count <= config.maxRequests
  }
}
```

### Monitoring
Set up monitoring for:
- Failed login attempts per hour
- Account lockouts per day
- 2FA adoption rate
- Security score distribution
- Suspicious activity alerts

### Alerts
Configure alerts for:
- High rate of failed logins (> 100/hour)
- Multiple account lockouts (> 10/hour)
- Suspicious activity detected
- Security score drops below 50

## Security Best Practices

1. **Encryption Keys**
   - Use strong, random encryption keys
   - Rotate keys periodically
   - Store keys securely (environment variables, secrets manager)

2. **Rate Limiting**
   - Adjust limits based on traffic patterns
   - Monitor for false positives
   - Implement gradual backoff

3. **Account Lockout**
   - Balance security with user experience
   - Provide clear unlock instructions
   - Monitor lockout rates

4. **2FA**
   - Encourage all users to enable 2FA
   - Provide backup codes for recovery
   - Support multiple authenticator apps

5. **Audit Logging**
   - Log all security events
   - Retain logs for compliance (90+ days)
   - Regular review of suspicious activity
   - Export logs for external analysis

## Troubleshooting

### 2FA Not Working
- Verify system time is synchronized
- Check TOTP secret is correctly encrypted/decrypted
- Ensure authenticator app is using correct time
- Try backup code if TOTP fails

### Rate Limit False Positives
- Check if multiple users share same IP (corporate network)
- Adjust rate limits for specific endpoints
- Implement user-based rate limiting

### Account Lockout Issues
- Verify lockout duration is reasonable
- Check email delivery for security alerts
- Provide admin unlock functionality
- Monitor for automated attacks

### Security Score Inaccurate
- Verify all factors are calculated correctly
- Check password age calculation
- Ensure 2FA status is up to date
- Review session count logic

## Future Enhancements

1. **Biometric Authentication** - Face ID, Touch ID support
2. **Hardware Security Keys** - WebAuthn/FIDO2 support
3. **Risk-Based Authentication** - Adaptive authentication based on risk score
4. **Geolocation Blocking** - Block logins from specific countries
5. **Device Fingerprinting** - More accurate device detection
6. **Security Questions** - Additional recovery method
7. **SMS 2FA** - SMS-based 2FA as alternative
8. **Email 2FA** - Email-based 2FA as alternative

## Support

For security issues or questions:
- Email: security@mais.sa
- Documentation: https://docs.mais.sa/security
- Emergency: Contact system administrator
