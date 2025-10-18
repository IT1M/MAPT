# Login Security Features

This document describes the security features implemented for authentication in the Saudi Mais Medical Products Inventory System.

## Overview

The system implements multiple layers of security to protect against brute force attacks, credential stuffing, and unauthorized access attempts.

## Features

### 1. Rate Limiting

**IP-Based Rate Limiting**
- Maximum 5 login attempts per 15 minutes per IP address
- Prevents brute force attacks from a single source
- Returns HTTP 429 (Too Many Requests) when exceeded

**Email-Based Rate Limiting**
- Maximum 10 login attempts per 15 minutes per email address
- Prevents targeted attacks on specific accounts
- Works in conjunction with IP-based limiting

**Implementation**: `src/middleware/login-rate-limiter.ts`

### 2. Failed Login Tracking

The system tracks all failed login attempts with the following information:
- Email address
- IP address
- User agent
- Timestamp

Failed attempts are stored in memory (for development) and automatically cleaned up after 15 minutes.

**Implementation**: `src/services/login-security.ts`

### 3. CAPTCHA Challenge

**Trigger**: After 5 failed login attempts
**Type**: Simple math-based challenge (can be replaced with reCAPTCHA/hCaptcha)
**Behavior**:
- Appears automatically when threshold is reached
- Must be completed before login can proceed
- Resets after each failed attempt
- Disappears after successful login

**Implementation**: `src/components/auth/SimpleCaptcha.tsx`

### 4. Account Lockout

**Trigger**: After 10 failed login attempts
**Duration**: 15 minutes
**Behavior**:
- Account is temporarily locked
- User cannot login even with correct credentials
- Automatic unlock after lockout period expires
- Security notification sent to user

**Database Field**: `User.lockedUntil`

### 5. Security Notifications

The system creates in-app notifications for security events:

**Account Locked Notification**
- Type: ALERT
- Priority: URGENT
- Includes lockout end time
- Visible in notification center

**New Device Login Notification** (Future Enhancement)
- Type: ALERT
- Priority: HIGH
- Includes device and location information
- Helps users detect unauthorized access

### 6. Login Metadata Tracking

The system tracks successful logins:
- Last login timestamp (`User.lastLogin`)
- Last login IP address (`User.lastLoginIp`)
- Device information (stored in Session model)
- Browser and OS details

## Security Flow

```
User attempts login
    ↓
Check IP rate limit (5/15min)
    ↓
Check email rate limit (10/15min)
    ↓
Check if account is locked
    ↓
Check if CAPTCHA is required (≥5 attempts)
    ↓
Verify CAPTCHA if required
    ↓
Validate credentials
    ↓
If failed:
  - Record failed attempt
  - Show CAPTCHA after 5 attempts
  - Lock account after 10 attempts
  - Send security notification
    ↓
If successful:
  - Clear failed attempts
  - Update last login info
  - Create session
  - Redirect to dashboard
```

## API Endpoints

### POST /api/auth/security-status

Check the security status for an email address.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isLocked": false,
    "requiresCaptcha": true,
    "attemptsRemaining": 3,
    "lockoutEndsAt": null
  }
}
```

## Configuration

Security settings are defined in `src/services/login-security.ts`:

```typescript
const SECURITY_CONFIG = {
  MAX_ATTEMPTS_BEFORE_CAPTCHA: 5,
  MAX_ATTEMPTS_BEFORE_LOCKOUT: 10,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
}
```

## User Experience

### Visual Indicators

1. **Security Warning** (5-9 attempts)
   - Yellow warning banner
   - Shows remaining attempts
   - Encourages caution

2. **CAPTCHA Challenge** (≥5 attempts)
   - Math-based challenge
   - Must be completed to proceed
   - New challenge on each attempt

3. **Account Locked** (≥10 attempts)
   - Red error banner
   - Shows unlock time
   - Login button disabled

### Error Messages

- **Invalid credentials**: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
- **Rate limit exceeded**: "Too many login attempts. Please try again in 15 minutes."
- **Account locked**: "Your account has been temporarily locked due to multiple failed login attempts."
- **CAPTCHA required**: "Please complete the security check"

## Production Considerations

### 1. Replace In-Memory Storage

The current implementation uses in-memory storage for failed attempts. For production:

**Recommended**: Use Redis for distributed systems
```typescript
// Example with Redis
import { Redis } from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

async function recordFailedLogin(email: string) {
  const key = `failed-login:${email}`
  await redis.incr(key)
  await redis.expire(key, 900) // 15 minutes
}
```

### 2. Upgrade CAPTCHA

Replace SimpleCaptcha with a production-ready solution:

**Options**:
- Google reCAPTCHA v3 (invisible)
- hCaptcha (privacy-focused)
- Cloudflare Turnstile (free)

### 3. Add Email Notifications

Implement email alerts for security events:
- Account locked
- New device login
- Password changed
- Multiple failed attempts

### 4. Implement IP Geolocation

Add actual geolocation service in `src/utils/device-detection.ts`:
- MaxMind GeoIP2
- IP2Location
- ipapi.co

### 5. Add Logging and Monitoring

- Log all security events to external service
- Set up alerts for suspicious patterns
- Monitor lockout rates
- Track CAPTCHA solve rates

## Testing

### Manual Testing

1. **Test Rate Limiting**:
   - Attempt 6 logins with wrong password
   - Verify rate limit error appears

2. **Test CAPTCHA**:
   - Attempt 5 logins with wrong password
   - Verify CAPTCHA appears
   - Complete CAPTCHA and verify it works

3. **Test Account Lockout**:
   - Attempt 10 logins with wrong password
   - Verify account is locked
   - Wait 15 minutes and verify unlock

4. **Test Security Warnings**:
   - Attempt 3-4 logins with wrong password
   - Verify warning banner appears with correct count

### Automated Testing

```typescript
// Example test
describe('Login Security', () => {
  it('should show CAPTCHA after 5 failed attempts', async () => {
    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      await attemptLogin('test@example.com', 'wrongpassword')
    }
    
    // Check security status
    const status = await getLoginSecurityStatus('test@example.com')
    expect(status.requiresCaptcha).toBe(true)
  })
  
  it('should lock account after 10 failed attempts', async () => {
    // Attempt 10 failed logins
    for (let i = 0; i < 10; i++) {
      await attemptLogin('test@example.com', 'wrongpassword')
    }
    
    // Check security status
    const status = await getLoginSecurityStatus('test@example.com')
    expect(status.isLocked).toBe(true)
  })
})
```

## Security Best Practices

1. **Never reveal if email exists**: Return same error for non-existent users
2. **Use constant-time comparison**: Prevent timing attacks (bcrypt handles this)
3. **Log security events**: Track patterns and anomalies
4. **Rate limit by IP and email**: Prevent distributed attacks
5. **Use HTTPS only**: Protect credentials in transit
6. **Implement session security**: httpOnly, secure, sameSite cookies
7. **Monitor failed attempts**: Alert on suspicious patterns
8. **Regular security audits**: Review and update security measures

## Compliance

These security features help meet common compliance requirements:

- **OWASP Top 10**: Protection against brute force attacks
- **PCI DSS**: Account lockout and monitoring requirements
- **GDPR**: Security of personal data
- **ISO 27001**: Access control and monitoring

## Future Enhancements

1. **Adaptive Rate Limiting**: Adjust limits based on threat level
2. **Risk-Based Authentication**: Require additional verification for suspicious logins
3. **Device Fingerprinting**: Track and recognize trusted devices
4. **Behavioral Analysis**: Detect anomalous login patterns
5. **Two-Factor Authentication**: Add second factor for high-risk accounts
6. **Passwordless Login**: Support WebAuthn/FIDO2
7. **Session Management**: View and revoke active sessions
8. **Security Dashboard**: Admin view of security metrics

## Support

For questions or issues related to login security:
- Review this documentation
- Check the implementation files
- Contact the development team
- Review security logs

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
